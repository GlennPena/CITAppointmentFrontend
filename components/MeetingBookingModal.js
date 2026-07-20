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
  Alert,
  Animated,
  Platform
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "../utils/api";
import { Toast } from "../components/Toast";
import { Typography } from "../styles/theme";

// HELPER FUNCTIONS
// Helper to generate next 7 available dates (excluding Sundays)
const generateDates = () => {
  const dates = [];
  let temp = new Date();
  while (dates.length < 12) {
    if (temp.getDay() !== 0) { // Exclude Sunday
      const year = temp.getFullYear();
      const month = String(temp.getMonth() + 1).padStart(2, '0');
      const date = String(temp.getDate()).padStart(2, '0');
      const localFullDate = `${year}-${month}-${date}`;

      dates.push({
        dayName: temp.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: temp.getDate(),
        fullDate: localFullDate
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ShineButton = ({ onPress, disabled, text, style }) => {
  const [hovered, setHovered] = useState(false);
  const shineAnim = useState(() => new Animated.Value(-1))[0];
  const scale = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    if (hovered && !disabled) {
      Animated.spring(scale, { toValue: 1.05, useNativeDriver: true }).start();
      shineAnim.setValue(-1);
      Animated.timing(shineAnim, {
        toValue: 2,
        duration: 450,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      shineAnim.stopAnimation();
      shineAnim.setValue(-1);
    }
  }, [hovered, disabled, shineAnim, scale]);

  const translateX = shineAnim.interpolate({
    inputRange: [-1, 2],
    outputRange: [-150, 450],
  });

  return (
    <AnimatedPressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      disabled={disabled}
      style={[
        style,
        disabled && { opacity: 0.6 },
        { transform: [{ scale }], overflow: 'hidden' }
      ]}
    >
      <LinearGradient
        colors={disabled ? ['#A5C4FF', '#A5C4FF'] : ['#003DA5', '#001E5C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, paddingHorizontal: 16 }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', marginRight: 6 }}>{text}</Text>
        {text === "Next" && <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />}
        {text === "Confirm" && <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />}
      </View>
      {hovered && !disabled && (
        <Animated.View style={{
          position: 'absolute',
          top: 0, left: 0, bottom: 0, width: 120,
          transform: [{ translateX }, { skewX: '-25deg' }],
        }}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      )}
    </AnimatedPressable>
  );
};

const HoverScaleItem = ({ children, style, scaleTo = 1.05, ...props }) => {
  const [scale] = useState(() => new Animated.Value(1));
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) {
      Animated.spring(scale, { toValue: scaleTo, useNativeDriver: Platform.OS !== 'web' }).start();
    } else {
      Animated.spring(scale, { toValue: 1, useNativeDriver: Platform.OS !== 'web' }).start();
    }
  }, [isHovered, scale, scaleTo]);

  return (
    <AnimatedPressable
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[style, { transform: [{ scale }] }]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
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

  const otherFaculty = facultyList.filter(f => f.id !== currentUserId);

  useEffect(() => {
    if (currentUserId && selectedDate && isVisible) {
      setBookedSlots([]);
      const allFacultyIds = [currentUserId, ...selectedParticipants];
      const paramIds = allFacultyIds.join(',');
      api.get(`appointments/busy-slots/${paramIds}/?date=${selectedDate}`)
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
  }, [currentUserId, selectedParticipants.join(','), selectedDate, isVisible]);

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
      case 4: return formData.condition.trim().length >= 1;
      case 5: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!isStepValid()) return;

    if (step === 3) {
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
        faculty: currentUserId
      });
    }
    setStep(step + 1);
  };

  const handleCancel = () => {
    resetModal();
    onClose();
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

      setTimeout(() => {
        setStep(1);
        resetModal();
      }, 100);

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

  const renderStep1 = () => (
    <View>
      <Text style={styles.modalTitle}>Select Participants</Text>

      <HoverScaleItem style={[styles.card, isEveryoneSelected && styles.selected]} onPress={toggleSelectEveryone} scaleTo={1.02}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.checkbox, isEveryoneSelected && styles.checkboxSelected]}>
            {isEveryoneSelected && <MaterialCommunityIcons name="check" size={16} color="#FFF" />}
          </View>
          <Text style={[styles.cardText, isEveryoneSelected && { color: '#FFF', fontWeight: 'bold' }]}>
            Invite All CIT Faculty / Dean
          </Text>
        </View>
      </HoverScaleItem>

      <View style={styles.servicesGrid}>
        {otherFaculty.length > 0 ? (
          otherFaculty.map((fac) => {
            const isSelected = selectedParticipants.includes(fac.id);
            return (
              <HoverScaleItem key={fac.id} onPress={() => toggleParticipant(fac.id)} scaleTo={1.02}>
                <View style={[styles.card, isSelected && styles.selected]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.avatarMini}>
                      <Text style={styles.avatarMiniText}>
                        {fac.full_name ? (() => {
                          const parts = fac.full_name.trim().split(/\s+/);
                          if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
                          return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                        })() : "?"}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardText, { fontWeight: 'bold' }, isSelected && { color: '#FFF' }]}>
                        {fac.full_name}
                      </Text>
                      <Text style={[styles.participantRole, isSelected && { color: '#E2E8F0' }]}>
                        {fac.is_superuser ? "Dean" : fac.department || "Faculty"}
                      </Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && <MaterialCommunityIcons name="check" size={16} color="#FFF" />}
                    </View>
                  </View>
                </View>
              </HoverScaleItem>
            );
          })
        ) : (
          <Text style={{ textAlign: "center", color: "#94A3B8", marginTop: 20 }}>
            No other faculty available.
          </Text>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.modalTitle}>Meeting Topic</Text>
      <View style={styles.servicesGrid}>
        {meetingServices.map((service) => {
          const isSelected = formData.service === service;
          return (
            <HoverScaleItem key={service} onPress={() => setFormData({ ...formData, service })} scaleTo={1.02}>
              <View style={[styles.card, isSelected && styles.selected]}>
                <Text style={[styles.cardText, isSelected && { color: '#FFF', fontWeight: 'bold' }]}>
                  {service}
                </Text>
              </View>
            </HoverScaleItem>
          );
        })}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.modalTitle}>Choose Date & Time</Text>
      
      <View style={styles.dateGrid}>
        {availableDates.map(dateObj => {
          const isSelected = selectedDate === dateObj.fullDate;
          return (
            <HoverScaleItem key={dateObj.fullDate} style={styles.dateBtnGrid} onPress={() => setSelectedDate(dateObj.fullDate)}>
              <View style={[styles.dateBtn, isSelected && styles.selected, { width: '100%', marginRight: 0 }]}>
                <Text style={[styles.dayText, isSelected && { color: '#E2E8F0' }]}>{dateObj.dayName}</Text>
                <Text style={[styles.dateNumText, isSelected && { color: '#FFF' }]}>{dateObj.dayNum}</Text>
              </View>
            </HoverScaleItem>
          );
        })}
      </View>

      <View style={styles.timeGrid}>
        {timeSlots.map(time => {
          const isSelected = selectedTime === time;
          const normalize = (t) => t.replace(/^0/, '').replace(/\s+/g, '').toUpperCase();
          const normalizedTime = normalize(time);
          const isBooked = bookedSlots.some(booked => normalize(booked) === normalizedTime);
          const isPast = new Date(`${selectedDate}T${convertTo24Hour(time)}`) < new Date();
          const disabled = isBooked || isPast;

          return (
            <HoverScaleItem
              key={time}
              style={[styles.timeBtn, isSelected && styles.selected, disabled && styles.booked]}
              onPress={() => {
                if (!disabled) setSelectedTime(time);
              }}
              disabled={disabled}
              scaleTo={disabled ? 1 : 1.05}
            >
              <Text style={[styles.cardText, (isSelected || disabled) && { color: '#FFF', fontWeight: 'bold' }]}>
                {time}
              </Text>
            </HoverScaleItem>
          );
        })}
      </View>
    </View>
  );

  const renderStep4 = () => {
    const textLength = formData.condition.length;
    const isError = textLength === 0;

    return (
      <View>
        <Text style={styles.modalTitle}>Meeting Notes</Text>

        <TextInput
          placeholder="Enter agenda, topics, or notes for this meeting..."
          style={[styles.inputMultiline, isError && { borderColor: '#EF4444' }]}
          value={formData.condition}
          onChangeText={v => setFormData({ ...formData, condition: v })}
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
          {textLength < 1
            ? `Please add some notes for context.`
            : `Requirement met! (${textLength} characters)`}
        </Text>
      </View>
    );
  };

  const renderStep5 = () => {
    return (
      <View>
        <Text style={styles.modalTitle}>Confirm Details</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.row}>
            <Text style={styles.summaryLabel}>Topic:</Text>
            <Text style={styles.summaryValue}>{formData.service}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.summaryLabel}>Participants:</Text>
            <Text style={styles.summaryValue}>{selectedParticipants.length} selected</Text>
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
        </View>

        <View style={styles.confirmNotesCard}>
          <Text style={styles.confirmNotesTitle}>AGENDA/NOTES</Text>
          <Text style={styles.confirmNotesText}>{formData.condition}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={isVisible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Toast
            visible={!!alert.message}
            message={alert.message}
            type={alert.type}
            onHide={() => setAlert({ message: "", type: "" })}
          />

          <View style={styles.headerRow}>
            <Pressable onPress={handleCancel}>
              <Text style={{ ...Typography.body, color: '#6B7280', fontSize: 16 }}>✕ Cancel</Text>
            </Pressable>
            <ProgressHeader currentStep={step} />
          </View>

          <ScrollView style={styles.scrollViewContent} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </ScrollView>

          <View style={styles.footer}>
            {step > 1 ? (
              <HoverScaleItem style={styles.backButton} onPress={() => setStep(step - 1)} scaleTo={1.05}>
                <Text style={{ color: '#002366', fontWeight: 'bold' }}>Back</Text>
              </HoverScaleItem>
            ) : <View style={{ width: 80 }} />}

            <ShineButton
              disabled={!isStepValid() || loading}
              style={[
                styles.nextBtn,
                { width: 'auto', minWidth: 100, padding: 0 }
              ]}
              onPress={step === 5 ? handleFinish : handleNext}
              text={step === 5 ? (loading ? "..." : "Confirm") : "Next"}
            />
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
  modalTitle: {
    ...Typography.title,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
    color: '#002366'
  },
  scrollViewContent: {
    flex: 1,
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
  participantRole: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "normal",
    marginTop: 2
  },
  servicesGrid: {
    gap: 0
  },
  subLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 10
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
  },
  dateBtn: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  timeBtn: {
    width: '48%',
    padding: 15,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    backgroundColor: '#FFF'
  },
  booked: {
    backgroundColor: '#002366',
    borderColor: '#E2E8F0',
    opacity: 0.5
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
  summaryContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
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
  confirmNotesCard: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 8,
    marginTop: 15
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
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
});
