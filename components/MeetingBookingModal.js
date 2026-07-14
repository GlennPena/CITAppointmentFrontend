/*
  Responsible for scheduling internal peer-to-peer or group meetings between 
  faculty members and the dean, with multi-selection and "everyone" options.
*/

import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  Pressable, 
  ScrollView, 
  ActivityIndicator, 
  TextInput, 
  Alert 
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "../utils/api";
import { Typography } from "../styles/theme";

const timeSlots = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", 
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
];

const meetingServices = [
  "Faculty Meeting",
  "Meet the Dean",
  "Academic Advising Consultation",
  "Course Curriculum Workshop",
  "Capstone Committee Sync",
  "Internship Coordination",
  "Research Collaboration",
  "Faculty Consultation Sync",
  "Department Sync"
];

// Helper to generate next 7 available dates (excluding Sundays)
const generateDates = () => {
  const dates = [];
  let temp = new Date();
  while (dates.length < 7) {
    if (temp.getDay() !== 0) { // Exclude Sunday
      dates.push({
        dayName: temp.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: temp.getDate(),
        fullDate: temp.toISOString().split('T')[0]
      });
    }
    temp.setDate(temp.getDate() + 1);
  }
  return dates;
};

const convertTo24Hour = (timeStr) => {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
  return `${String(hours).padStart(2, '0')}:${minutes}:00`;
};

export default function MeetingBookingModal({ isVisible, onClose, onBookingSuccess }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isEveryoneSelected, setIsEveryoneSelected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
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

  // Reset alert on step navigation
  useEffect(() => { setAlert({ message: "", type: "" }); }, [step]);

  // Load current user and list of potential meeting participants
  useEffect(() => {
    const initData = async () => {
      try {
        const uid = await AsyncStorage.getItem("user_id");
        setCurrentUserId(uid ? parseInt(uid) : null);

        const res = await api.get("faculty/");
        setFacultyList(res.data);
      } catch (err) {
        console.error("Init Error", err);
      }
    };

    if (isVisible) {
      initData();
    } else {
      resetModal();
    }
  }, [isVisible]);

  // Filter list to exclude logged-in user
  const otherFaculty = facultyList.filter(f => f.id !== currentUserId);

  // Fetch busy slots for the logged-in host
  useEffect(() => {
    if (currentUserId && selectedDate && isVisible) {
      setBookedSlots([]);
      api.get(`appointments/busy-slots/${currentUserId}/?date=${selectedDate}`)
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
          console.error("Error loading times:", err);
        });
    }
  }, [currentUserId, selectedDate, isVisible]);

  const toggleParticipant = (id) => {
    if (selectedParticipants.includes(id)) {
      setSelectedParticipants(selectedParticipants.filter(pId => pId !== id));
      setIsEveryoneSelected(false);
    } else {
      const nextSelection = [...selectedParticipants, id];
      setSelectedParticipants(nextSelection);
      if (nextSelection.length === otherFaculty.length) {
        setIsEveryoneSelected(true);
      }
    }
  };

  const toggleSelectEveryone = () => {
    if (isEveryoneSelected) {
      setSelectedParticipants([]);
      setIsEveryoneSelected(false);
    } else {
      const allIds = otherFaculty.map(f => f.id);
      setSelectedParticipants(allIds);
      setIsEveryoneSelected(true);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return selectedParticipants.length > 0;
      case 2: return formData.service !== "";
      case 3: return selectedTime !== null;
      case 4: return formData.condition.trim().length >= 256;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!isStepValid()) return;

    if (step === 3) {
      // Validate slot availability
      const normalize = (time) => time.replace(/^0/, '').replace(/\s+/g, '').toUpperCase();
      const normalizedSelected = normalize(selectedTime);
      
      const isStillTaken = bookedSlots.some(booked => normalize(booked) === normalizedSelected);
      const isNowPast = new Date(`${selectedDate}T${convertTo24Hour(selectedTime)}`) < new Date();

      if (isStillTaken || isNowPast) {
        setAlert({ message: "This slot just became unavailable. Please select another.", type: "error" });
        setSelectedTime(null);
        return;
      }
      
      setFormData({ 
        ...formData, 
        date_time: `${selectedDate}T${convertTo24Hour(selectedTime)}`,
        faculty: currentUserId // Host
      });
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    setAlert({ message: "", type: "" });

    try {
      const payload = {
        ...formData,
        participants: selectedParticipants
      };

      await api.post("appointments/", payload);
      
      if (onBookingSuccess) {
        onBookingSuccess({ message: "Meeting Scheduled!", type: "success" });
      }
      onClose();
    } catch (e) {
      const msg = e.response?.data ? JSON.stringify(e.response.data) : "Failed to book meeting.";
      setAlert({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setSelectedParticipants([]);
    setIsEveryoneSelected(false);
    setSelectedTime(null);
    setSelectedDate(availableDates[0].fullDate);
    setFormData({
      service: "",
      faculty: null,
      date_time: "",
      condition: "",
    });
    setAlert({ message: "", type: "" });
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

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          
          <View style={styles.modalHeader}>
            <Text style={styles.mainTitle}>Schedule CIT Meeting</Text>
            <Pressable onPress={onClose} style={styles.closeIcon}>
              <MaterialCommunityIcons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          <ProgressHeader currentStep={step} />

          {alert.message ? (
            <View style={[styles.alertBox, alert.type === 'error' ? styles.alertError : styles.alertSuccess]}>
              <Text style={styles.alertText}>{alert.message}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            {step === 1 && (
              <View>
                <Text style={styles.stepTitle}>Step 1: Select Participants</Text>
                
                {/* SELECT EVERYONE TOGGLE */}
                <Pressable style={styles.everyoneRow} onPress={toggleSelectEveryone}>
                  <View style={[styles.checkbox, isEveryoneSelected && styles.checkboxSelected]}>
                    {isEveryoneSelected && <MaterialCommunityIcons name="check" size={16} color="#FFF" />}
                  </View>
                  <Text style={styles.everyoneLabel}>Invite All CIT Faculty / Dean</Text>
                </Pressable>

                <View style={styles.participantsList}>
                  {otherFaculty.length > 0 ? (
                    otherFaculty.map((fac) => {
                      const isSelected = selectedParticipants.includes(fac.id);
                      return (
                        <Pressable 
                          key={fac.id} 
                          style={[styles.participantItem, isSelected && styles.participantItemActive]}
                          onPress={() => toggleParticipant(fac.id)}
                        >
                          <View style={styles.participantInfo}>
                            <View style={styles.avatarMini}>
                              <Text style={styles.avatarMiniText}>
                                {fac.full_name?.charAt(0) || "F"}
                              </Text>
                            </View>
                            <View>
                              <Text style={styles.participantName}>{fac.full_name}</Text>
                              <Text style={styles.participantRole}>
                                {fac.role === "dean" ? "Dean" : "Faculty"}
                              </Text>
                            </View>
                          </View>
                          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                            {isSelected && <MaterialCommunityIcons name="check" size={16} color="#FFF" />}
                          </View>
                        </Pressable>
                      );
                    })
                  ) : (
                    <Text style={{ textAlign: "center", color: "#64748B", marginTop: 20 }}>No other personnel registered.</Text>
                  )}
                </View>
              </View>
            )}

            {step === 2 && (
              <View>
                <Text style={styles.stepTitle}>Step 2: Choose Meeting Type</Text>
                <View style={styles.servicesGrid}>
                  {meetingServices.map((srv) => {
                    const isSelected = formData.service === srv;
                    return (
                      <Pressable 
                        key={srv}
                        style={[styles.serviceCard, isSelected && styles.serviceCardActive]}
                        onPress={() => setFormData({ ...formData, service: srv })}
                      >
                        <Text style={[styles.serviceText, isSelected && styles.serviceTextActive]}>
                          {srv}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {step === 3 && (
              <View>
                <Text style={styles.stepTitle}>Date & Time</Text>
                
                {/* DATE SELECTOR GRID */}
                <View style={styles.dateGrid}>
                  {availableDates.map((date) => {
                    const isSelected = selectedDate === date.fullDate;
                    return (
                      <Pressable 
                        key={date.fullDate} 
                        style={[styles.dateBtnGrid, isSelected && styles.selected]}
                        onPress={() => {
                          setSelectedDate(date.fullDate);
                          setSelectedTime(null);
                        }}
                      >
                        <Text style={[styles.dayText, isSelected && { color: '#FFF' }]}>{date.dayName}</Text>
                        <Text style={[styles.dateNumText, isSelected && { color: '#FFF' }]}>{date.dayNum}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* TIME SLOTS GRID */}
                <View style={styles.timeGrid}>
                  {timeSlots.map((time) => {
                    const normalize = (t) => t.replace(/^0/, '').replace(/\s+/g, '').toUpperCase();
                    const normalizedUI = normalize(time);

                    const isTaken = bookedSlots.some(booked => normalize(booked) === normalizedUI);
                    
                    const now = new Date();
                    const slotDateTime = new Date(`${selectedDate}T${convertTo24Hour(time)}`);
                    const isPast = slotDateTime < now;

                    const isSelected = selectedTime === time;

                    return (
                      <Pressable 
                        key={time}
                        disabled={isTaken || isPast}
                        style={[
                          styles.timeBtn, 
                          isSelected && styles.selected, 
                          isTaken && styles.booked,
                          isPast && { backgroundColor: '#E5E7EB', opacity: 0.5 }
                        ]}
                        onPress={() => setSelectedTime(time)}
                      >
                        <Text style={[
                          { fontSize: 13, fontWeight: "600", color: "#374151" },
                          (isSelected || isTaken || isPast) && { color: '#FFF' }
                        ]}>
                          {isTaken ? "Booked" : isPast ? "Expired" : time}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {step === 4 && (
              <View>
                <Text style={styles.stepTitle}>Step 4: Meeting Agenda & Notes</Text>
                <Text style={styles.subLabel}>What is the agenda or discussion topic for this meeting?</Text>
                
                <TextInput 
                  placeholder="Please describe the meeting topic or items you would like to discuss (minimum 256 characters)..."
                  placeholderTextColor="#94A3B8"
                  style={styles.textArea}
                  multiline
                  numberOfLines={6}
                  value={formData.condition}
                  onChangeText={(val) => setFormData({ ...formData, condition: val })}
                />

                <View style={styles.counterRow}>
                  <Text style={[
                    styles.counterText,
                    formData.condition.length >= 256 ? styles.counterValid : styles.counterInvalid
                  ]}>
                    Characters: {formData.condition.length} / 256
                  </Text>
                </View>
              </View>
            )}

            {step === 5 && (
              <View>
                <Text style={styles.stepTitle}>Step 5: Confirm Meeting Details</Text>
                
                <View style={styles.confirmContainer}>
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Meeting Type:</Text>
                    <Text style={styles.confirmValue}>{formData.service}</Text>
                  </View>

                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Date:</Text>
                    <Text style={styles.confirmValue}>
                      {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>

                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Time Slot:</Text>
                    <Text style={styles.confirmValue}>{selectedTime}</Text>
                  </View>

                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>Participants:</Text>
                    <Text style={styles.confirmValue}>
                      {isEveryoneSelected ? "Everyone" : `${selectedParticipants.length} Personnel Selected`}
                    </Text>
                  </View>

                  <View style={styles.confirmNotesCard}>
                    <Text style={styles.confirmNotesTitle}>AGENDA NOTES</Text>
                    <Text style={styles.confirmNotesText}>"{formData.condition}"</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* ACTION BUTTONS BUTTONBAR */}
          <View style={styles.buttonBar}>
            {step > 1 && (
              <Pressable style={styles.btnBack} onPress={handleBack}>
                <Text style={styles.btnBackText}>Back</Text>
              </Pressable>
            )}

            {step < 5 ? (
              <Pressable 
                style={[styles.btnNext, !isStepValid() && styles.btnDisabled]} 
                disabled={!isStepValid()}
                onPress={handleNext}
              >
                <Text style={styles.btnNextText}>Next</Text>
              </Pressable>
            ) : (
              <Pressable 
                style={[styles.btnSubmit, loading && styles.btnDisabled]} 
                disabled={loading}
                onPress={handleFinish}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.btnSubmitText}>Schedule Meeting</Text>
                )}
              </Pressable>
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    width: "95%",
    maxWidth: 550,
    maxHeight: "90%",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A"
  },
  closeIcon: {
    padding: 4
  },
  progressContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 20
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2
  },
  segmentActive: {
    backgroundColor: "#002366"
  },
  segmentInactive: {
    backgroundColor: "#E2E8F0"
  },
  stepContent: {
    marginBottom: 20,
    maxHeight: 400
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E293B",
    marginBottom: 14
  },
  subLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 10
  },
  everyoneRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    marginBottom: 14,
    gap: 12
  },
  everyoneLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A"
  },
  participantsList: {
    gap: 10
  },
  participantItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#F1F5F9",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FFF"
  },
  participantItemActive: {
    borderColor: "#002366",
    backgroundColor: "#F8FAFC"
  },
  participantInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  avatarMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center"
  },
  avatarMiniText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569"
  },
  participantName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B"
  },
  participantRole: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 1
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center"
  },
  checkboxSelected: {
    borderColor: "#002366",
    backgroundColor: "#002366"
  },
  servicesGrid: {
    gap: 10
  },
  serviceCard: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "#FFF"
  },
  serviceCardActive: {
    borderColor: "#002366",
    backgroundColor: "#F8FAFC"
  },
  serviceText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569"
  },
  serviceTextActive: {
    color: "#002366"
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', 
    rowGap: 10,  
    marginBottom: 20,
  },
  dateBtnGrid: {
    width: '13.5%',  
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
  booked: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  dayText: {
    ...Typography.body,
    fontSize: 11,  
    fontWeight: '700',
    color: '#64748B',
  },
  dateNumText: {
    ...Typography.body,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  timeBtn: {
    width: "48%",
    padding: 15,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    backgroundColor: "#FFF"
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: "#1E293B",
    backgroundColor: "#F8FAFC",
    minHeight: 120,
    textAlignVertical: "top"
  },
  counterRow: {
    alignItems: "flex-end",
    marginTop: 6
  },
  counterText: {
    fontSize: 11,
    fontWeight: "700"
  },
  counterValid: {
    color: "#10B981"
  },
  counterInvalid: {
    color: "#EF4444"
  },
  confirmContainer: {
    gap: 12
  },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  confirmLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B"
  },
  confirmValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A"
  },
  confirmNotesCard: {
    backgroundColor: "#F8FAFC",
    borderLeftWidth: 4,
    borderLeftColor: "#002366",
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  confirmNotesTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 4
  },
  confirmNotesText: {
    fontSize: 13,
    color: "#334155",
    fontStyle: "italic"
  },
  buttonBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 16
  },
  btnBack: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFF"
  },
  btnBackText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569"
  },
  btnNext: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#002366"
  },
  btnNextText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFF"
  },
  btnSubmit: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#10B981"
  },
  btnSubmitText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFF"
  },
  btnDisabled: {
    opacity: 0.5
  },
  alertBox: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 14
  },
  alertError: {
    backgroundColor: "#FEF2F2"
  },
  alertSuccess: {
    backgroundColor: "#ECFDF5"
  },
  alertText: {
    fontSize: 12,
    color: "#991B1B",
    fontWeight: "700"
  }
});
