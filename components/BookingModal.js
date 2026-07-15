/*
  Booking modal that guides users through selecting a service, doctor, date/time, and entering details before confirming the appointment. 
  It also fetches booked slots to prevent double-booking and provides real-time feedback on slot availability.
*/

import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TextInput} from "react-native";

import api from "../utils/api";
import InlineAlert from "../components/InlineAlert";
import { Toast } from "../components/Toast";
import { Typography } from "../styles/theme";


// HELPER FUNCTIONS
// Generates next 14 days for booking selection
const generateDates = () => {
  const dateArray = [];
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  let i = 0;

  while (dateArray.length < 12) { 
    const d = new Date();
    d.setDate(d.getDate() + i);

    if (d.getDay() !== 0) {
      const localFullDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      dateArray.push({ 
        fullDate: localFullDate, 
        dayName: days[d.getDay()], 
        dateNum: d.getDate().toString()
      });
    }

    i++;
  }

  return dateArray;
};

// Converts "08:00 AM" to "08:00:00" in 24-hour format for backend compatibility
const convertTo24Hour = (timeStr) => {
  if (!timeStr) return null;
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
  return `${hours}:${minutes}:00`;
};

// Available appointment time slots
const timeSlots = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", 
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
];


export default function BookingModal({ isVisible, onClose, facultyList, onBookingSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ message: "", type: "" });
  const [bookedSlots, setBookedSlots] = useState([]);
  
  const availableDates = generateDates();
  const [selectedDate, setSelectedDate] = useState(availableDates[0].fullDate);
  const [selectedTime, setSelectedTime] = useState(null);

    const [formData, setFormData] = useState({
    service: "",
    faculty: null,
    date_time: "",
    condition: "",
    });
  
  const isStepValid = () => {
    switch (step) {
      case 1: return formData.service !== "";
      case 2: return formData.faculty !== null;
      case 3: return selectedTime !== null;
      case 4: return formData.condition.trim().length >= 256;
      case 5: return true;
      default: return false;
    }
  };

  // Reset alert when moving steps
  useEffect(() => { setAlert({ message: "", type: "" }); }, [step]);
  
  // Reset when modal is closed
  useEffect(() => {
  if (!isVisible) {
    resetModal();
  }
  }, [isVisible]);

  // Fetch booked slots whenever faculty, date, or modal visibility changes
  useEffect(() => {
    if (formData.faculty && selectedDate && isVisible) {
      setBookedSlots([]);
      api.get(`appointments/busy-slots/${formData.faculty}/?date=${selectedDate}`)
        .then(res => {
          const booked = res.data.map(app => {
            const dt = new Date(app);
            let hours = dt.getHours();
            const minutes = String(dt.getMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12; 
            return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
          });
          setBookedSlots(booked);
        })
        .catch(err => {
          setError("Could not load available times.");
          setBookedSlots([]);
        }); 
    }
  }, [formData.faculty, selectedDate, isVisible]);

  const handleNext = () => {
  if (!isStepValid()) return;

  if (step === 3) {
    // Re-verify availability at the exact moment of clicking "Next"
    const normalize = (time) => time.replace(/^0/, '').replace(/\s+/g, '').toUpperCase();
    const normalizedSelected = normalize(selectedTime);
    
    const isStillTaken = bookedSlots.some(booked => normalize(booked) === normalizedSelected);
    const isNowPast = new Date(`${selectedDate}T${convertTo24Hour(selectedTime)}`) < new Date();

    if (isStillTaken || isNowPast) {
      setAlert({ message: "This slot just became unavailable. Please select another.", type: "error" });
      setSelectedTime(null);
      return;
    }
    
    setFormData({ ...formData, date_time: `${selectedDate}T${convertTo24Hour(selectedTime)}` });
  }
  setStep(step + 1);
};

  // Handles final submission of the booking form
  const handleFinish = async () => {
    setLoading(true);
    setAlert({ message: "", type: "" });

    try {
      await api.post("appointments/", formData);
      
      if (onBookingSuccess) {
        onBookingSuccess({ message: "Appointment Booked!", type: "success" });
      }
      onClose();

      setTimeout(() => {
        setStep(1);
        resetModal();
      }, 100); 

    } catch (e) {
      const msg = e.response?.data ? JSON.stringify(e.response.data) : "Failed to book.";
      setAlert({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const ProgressHeader = ({ currentStep }) => {
    const totalSteps = 5;
    return (
      <View style={styles.progressContainer}>
        {[...Array(totalSteps)].map((_, i) => (
          <View 
            key={i} 
            style={[
              styles.progressSegment, 
              i + 1 <= currentStep ? styles.segmentActive : styles.segmentInactive
            ]} 
          />
        ))}
      </View>
    );
  };

  const resetModal = () => {
    setStep(1);
    setFormData({
      service: "",
      faculty: null,
      date_time: "",
      condition: "",
    });
    setSelectedDate(availableDates[0].fullDate);
    setSelectedTime(null);
    setAlert({ message: "", type: "" });
    setBookedSlots([]);
  };

  const handleCancel = () => {
    resetModal();
    onClose();
  };

  // Rendering functions for each step of the booking process
  // STEP 1: Service Selection
  const renderStep1 = () => (
    <View>
      <Text style={styles.modalTitle}>Select Service</Text>

      {[
        'Dean Consultation',
        'Faculty Consultation',
        'Academic Advising',
        'Course Advising',
        'Enrollment Concern',
        'Academic Concern',
        'Completion Concern',
        'Grade Consultation',
        'Capstone Consultation',
        'Internship Consultation',
        'Research Consultation',
        'Student Concern',
        'Project Consultation',
        'Thesis Consultation',
        'Career Advising',
        'Document Request Follow-up',
        'Transaction Request Follow-up',
        'Faculty Meeting',
        'Meet the Dean',
      ].map(s => {
        const isSelected = formData.service === s;
        return (
          <Pressable 
            key={s} 
            style={[styles.card, isSelected && styles.selected]} 
            onPress={() => {
              setFormData({...formData, service: s});
            }}
          >
            <Text style={[styles.cardText, isSelected && { color: '#FFF', fontWeight: 'bold' }]}>
              {s}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  // STEP 2: Faculty Selection
  const renderStep2 = () => (
    <View>
      <Text style={styles.modalTitle}>Choose Faculty</Text>
      
      {facultyList.map(fac => {
        const isSelected = formData.faculty === fac.id;

        return (
          <Pressable 
            key={fac.id} 
            style={[styles.card, isSelected && styles.selected]} 
            onPress={() => {
              setFormData({...formData, faculty: fac.id});
            }}
          >
            <Text style={[styles.cardText, isSelected && { color: '#FFF', fontWeight: 'bold' }]}>
              {fac.full_name}
            </Text>
          </Pressable>
        );
      })}

    </View>
  );

  // STEP 3: Date & Time Selection with real-time slot availability
  const renderStep3 = () => (
    <View>
      <Text style={styles.modalTitle}>Date & Time</Text>
      <Toast
        visible={!!alert.message}
        message={alert.message}
        type={alert.type}
        onHide={() => setAlert({ message: "", type: "" })}
      />
      
      <View style={styles.dateGrid}>
        {availableDates.map(d => (
          <Pressable 
            key={d.fullDate} 
            style={[styles.dateBtnGrid, selectedDate === d.fullDate && styles.selected]} 
            onPress={() => { setSelectedDate(d.fullDate); setSelectedTime(null); }}
          >
            <Text style={[styles.dayText, selectedDate === d.fullDate && { color: '#FFF' }]}>{d.dayName}</Text>
            <Text style={[styles.dateNumText, selectedDate === d.fullDate && { color: '#FFF' }]}>{d.dateNum}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.timeGrid}>
        {timeSlots.map(t => {
          const normalize = (time) => time.replace(/^0/, '').replace(/\s+/g, '').toUpperCase();
          const normalizedUI = normalize(t);

          const isTaken = bookedSlots.some(booked => normalize(booked) === normalizedUI);
          
          const now = new Date();
          const slotDateTime = new Date(`${selectedDate}T${convertTo24Hour(t)}`);
          const isPast = slotDateTime < now;

          return (
            <Pressable 
              key={t} 
              disabled={isTaken || isPast} 
              style={[
                styles.timeBtn, 
                selectedTime === t && styles.selected, 
                isTaken && styles.booked,
                isPast && { backgroundColor: '#E5E7EB', opacity: 0.5 }
              ]} 
              onPress={() => setSelectedTime(t)}
            >
              <Text style={[
                { ...Typography.body, color: '#374151', fontWeight: '600' },
                (selectedTime === t || isTaken || isPast) && { color: '#FFF' }
              ]}>
                {isTaken ? "Booked" : isPast ? "Expired" : t}
              </Text>
            </Pressable>
          );
        })}
      </View>
          </View>
  );

  // STEP 4: Additional Info 
  const renderStep4 = () => {
    const textLength = formData.condition.trim().length;
    const isError = textLength < 256;

    return (
      <View>
        <Text style={styles.modalTitle}>Appointment Notes</Text>
        
        <TextInput 
          placeholder="What would you like to discuss during your appointment?"
          style={[styles.inputMultiline, isError && formData.condition.length > 0 && { borderColor: '#EF4444' }]}
          value={formData.condition}
          onChangeText={v => setFormData({...formData, condition: v})} 
          multiline={true}
          numberOfLines={4}  
          textAlignVertical="top"
        />
        <Text style={{
          fontSize: 12,
          color: isError ? '#EF4444' : '#10B981',
          marginTop: 6,
          fontWeight: '600'
        }}>
          {textLength < 256 
            ? `At least ${256 - textLength} more characters required` 
            : `Requirement met! (${textLength} characters)`}
        </Text>
      </View>
    );
  };

  // STEP 5: Review & Confirm
  const renderStep5 = () => {
    const selectedFaculty = facultyList.find(f => f.id === formData.faculty);

    return (
      <View>
        <Text style={styles.modalTitle}>Confirm Details</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.row}>
            <Text style={styles.summaryLabel}>Service:</Text>
            <Text style={styles.summaryValue}>{formData.service}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.summaryLabel}>Faculty:</Text>
            <Text style={styles.summaryValue}>{selectedFaculty?.full_name || 'Not selected'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>{selectedDate}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.summaryLabel}>Time:</Text>
            <Text style={styles.summaryValue}>{selectedTime}</Text>
          </View>
          <View style={styles.divider} />
          <View style={{ flexDirection: 'column', paddingVertical: 12, gap: 6 }}>
            <Text style={styles.summaryLabel}>Appointment Notes:</Text>
            <View style={{ backgroundColor: '#F1F5F9', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 4 }}>
              <Text style={{ ...Typography.body, fontSize: 13, color: '#334155', fontStyle: 'italic', lineHeight: 18 }}>
                {formData.condition}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.headerRow}>
            <Pressable onPress={handleCancel}>
              <Text style={{...Typography.body, color: '#6B7280', fontSize: 16}}>✕ Cancel</Text>
            </Pressable>
            <ProgressHeader currentStep={step} />
          </View>

          <ScrollView style={styles.scrollViewContent} contentContainerStyle={{padding: 20}}>
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
          </ScrollView>

          <View style={styles.footer}>
            {step > 1 ? (
              <Pressable style={styles.backButton} onPress={() => setStep(step - 1)}>
                <Text style={{color: '#002366', fontWeight: 'bold'}}>Back</Text>
              </Pressable>
            ) : <View style={{ width: 80 }} />}

            <Pressable 
              disabled={!isStepValid() || loading} 
              style={[
                styles.nextBtn, 
                (!isStepValid() || loading) && { backgroundColor: '#A5C4FF' } 
              ]} 
              onPress={step === 5 ? handleFinish : handleNext}
            >
              <Text style={{color: '#fff', fontWeight: 'bold'}}>
                {step === 5 ? (loading ? "..." : "Confirm") : "Next"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)'
  },
  modalContainer: {
    width: '90%',
    maxWidth: 600,
    height: 650,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    overflow: 'hidden',
    flexDirection: 'column'
  },
  modalTitle: { 
    ...Typography.title, 
    fontSize: 22, 
    fontWeight: '800', 
    marginBottom: 20, 
    textAlign: 'center', 
    color: '#002366' 
  },
  card: { 
    padding: 15, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    borderRadius: 12, 
    marginBottom: 10, 
    backgroundColor: '#FFF'
  },
  selected: { 
    backgroundColor: '#002366', 
    borderColor: '#002366' 
  },
  cardText: { 
    ...Typography.body, 
    fontSize: 16, 
    color: '#1E293B'
  },
  dateBtn: { 
    width: 60, 
    height: 70, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1, 
    marginRight: 10, 
    borderRadius: 10, 
    borderColor: '#DDD' 
  },
  timeGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  timeBtn: { 
    width: '48%', 
    padding: 15, 
    borderWidth: 1, 
    borderColor: '#DDD', 
    borderRadius: 10, 
    marginBottom: 10, 
    alignItems: 'center' 
  },
  booked: { 
    backgroundColor: '#002366', 
    borderColor: '#E2E8F0', 
    opacity: 0.5
  },
  bold: { 
    fontWeight: 'bold', 
    fontSize: 18 
  },
  input: { 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    borderRadius: 10, 
    padding: 12, 
    fontSize: 16,
    color: '#002366',
    backgroundColor: '#F8FAFC'
  },
  inputMultiline: { 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    borderRadius: 10, 
    padding: 12, 
    fontSize: 16,
    color: '#002366',
    backgroundColor: '#F8FAFC',
    
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 12, 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    paddingVertical: 12 
  },
  backButton: { 
    backgroundColor: '#fff', 
    padding: 10, 
    borderRadius: 10, 
    alignItems: 'center', 
    color: '#002366', 
    width: 80, 
    textAlign: 'center', 
    borderWidth: 1.5, 
    borderColor: '#002366'
  },
  nextBtn: { 
    backgroundColor: '#002366', 
    padding: 10, 
    borderRadius: 10, 
    alignItems: 'center', 
    color: '#fff', 
    width: 80, 
    textAlign: 'center'
  },
  submitBtn: { 
    backgroundColor: '#002366', 
    padding: 15, 
    borderRadius: 10, 
    marginTop: 20, 
    alignItems: 'center' 
  },
  reviewBox: { 
    backgroundColor: '#F9F9F9', 
    padding: 15, 
    borderRadius: 10 
  },
  closeBtn: { 
    padding: 20, 
    alignItems: 'center' 
  },
  summaryLabel: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',            
    flex: 1,            
    },         
  summaryValue: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',             
    flex: 2,                 
    textAlign: 'right',          
  },
  summaryContainer: {
    backgroundColor: '#F8FAFC',      
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    height: 6,
    width: 35,
    borderRadius: 3,
  },
  segmentActive: {
    backgroundColor: '#002366',
  },
  segmentInactive: {
    backgroundColor: '#E5E7EB',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', 
    rowGap: 10,  
    marginBottom: 20,
  },
  dateBtnGrid: {
    width: '15.5%',  
    aspectRatio: 0.85, 
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  selected: {
    backgroundColor: '#002366',
    borderColor: '#002366',
  },
  dayText: {
    ...Typography.body,
    fontSize: 12,  
    fontWeight: '700',
    color: '#64748B',
  },
  dateNumText: {
    ...Typography.body,
    fontSize:18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  serviceNextBtn: {
    backgroundColor: '#002366', 
    padding: 10, 
    borderRadius: 10, 
    alignItems: 'center', 
    color: '#fff', 
    width: 80, 
    textAlign: 'center',
    alignSelf: 'flex-end', 
    marginTop: 15,
  },
  scrollViewContent: {
    flex: 1, 
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6', 
    backgroundColor: '#FFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
});