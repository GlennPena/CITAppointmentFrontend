import { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Text, ActivityIndicator, Pressable, ScrollView, ImageBackground, useWindowDimensions, Modal, TextInput, Alert, Animated } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

import AppointmentRow from "../components/AppointmentTable";
import StudentDetailModal from "../components/StudentDetailModal";
import CompleteAppointmentModal from "../components/CompleteAppointmentModal";
import AppFooter from "../components/AppFooter";

import api from "../utils/api";
import { Typography } from "../styles/theme";


// Returns today's date as YYYY-MM-DD in the device's local timezone.
// Using toISOString() would return UTC date which is wrong for UTC+8 users.
const getLocalDateStr = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AnimatedCancelButton = ({ onPress, text, style, textStyle, baseColor, hoverColor }) => {
  const [hovered, setHovered] = useState(false);
  const colorAnim = useState(() => new Animated.Value(0))[0];
  const scale = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: hovered ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.spring(scale, {
      toValue: hovered ? 0.98 : 1,
      useNativeDriver: true,
    }).start();
  }, [hovered, colorAnim, scale]);

  const bgColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [baseColor, hoverColor]
  });

  return (
    <AnimatedPressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={[
        style,
        { backgroundColor: bgColor, transform: [{ scale }] }
      ]}
    >
      <Text style={textStyle}>{text}</Text>
    </AnimatedPressable>
  );
};

const AnimatedPageButton = ({ onPress, disabled, text, styles }) => {
  const [hovered, setHovered] = useState(false);
  const colorAnim = useState(() => new Animated.Value(0))[0];
  const scale = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: hovered && !disabled ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.spring(scale, {
      toValue: hovered && !disabled ? 1.05 : 1,
      useNativeDriver: true,
    }).start();
  }, [hovered, disabled, colorAnim, scale]);

  const bgColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [disabled ? '#F8FAFC' : '#FFFFFF', '#002366']
  });

  const borderColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [disabled ? '#F1F5F9' : '#E2E8F0', '#002366']
  });

  const textColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [disabled ? '#94A3B8' : '#002366', '#FFFFFF']
  });

  return (
    <AnimatedPressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.pageButton,
        disabled && styles.pageButtonDisabled,
        {
          transform: [{ scale }],
          backgroundColor: bgColor,
          borderColor: borderColor,
        }
      ]}
    >
      <Animated.Text style={[styles.pageButtonText, { color: textColor }]}>
        {text}
      </Animated.Text>
    </AnimatedPressable>
  );
};

const Orb = ({ style, delay = 0 }) => {
  const [translateY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: 15, duration: 4000, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -15, duration: 4000, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    );
    const timeout = setTimeout(() => float.start(), delay);
    return () => {
      clearTimeout(timeout);
      float.stop();
    };
  }, [delay, translateY]);

  return (
    <Animated.View style={[{
      position: 'absolute',
      borderRadius: 999,
      opacity: 0.18,
    }, style, { transform: [{ translateY }] }]} />
  );
};

export default function FacultySchedule({ route }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;
  const styles = getStyles(isMobile, isDesktop);

  const [appointments, setAppointments] = useState([]);
  const [dateStr, setDateStr] = useState(getLocalDateStr());
  const [loading, setLoading] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cancelModal, setCancelModal] = useState({ visible: false, id: null, reason: "" });
  const [disapproveModal, setDisapproveModal] = useState({ visible: false, id: null, reason: "" });

  const [isCompleteModalVisible, setIsCompleteModalVisible] = useState(false);

  const [sortOrder, setSortOrder] = useState('newest');
  const [activeTab, setActiveTab] = useState('students'); // 'students' or 'meetings'
  const [currentPage, setCurrentPage] = useState(1);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (route?.params?.date) {
      setDateStr(route.params.date);
    }
  }, [route?.params]);

  // Load data immediately when focused, or when date or sort order changes
  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused, dateStr, sortOrder]);

  // Setup background polling interval (every 10s) when screen is active
  useEffect(() => {
    if (!isFocused) return;

    const interval = setInterval(() => {
      if (!cancelModal.visible && !isModalVisible && !isCompleteModalVisible && !disapproveModal.visible) {
        loadData(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isFocused, dateStr, sortOrder, cancelModal.visible, isModalVisible, isCompleteModalVisible, disapproveModal.visible]);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`appointments/?date=${dateStr}`);

      let data = res.data;

      data.sort((a, b) => {
        const timeA = new Date(a.date_time);
        const timeB = new Date(b.date_time);
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });

      if (route?.params?.highlightId) {
        const target = data.find(app => app.id === route.params.highlightId);
        if (target) {
          const isMeeting = !target.student_name || target.student_name === "N/A";
          setActiveTab(isMeeting ? 'meetings' : 'students');
        }
      }

      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, newStatus) => {
    if (newStatus === 'Cancelled') {
      setCancelModal({ visible: true, id, reason: "" });
    } else if (newStatus === 'Rejected') {
      setDisapproveModal({ visible: true, id, reason: "" });
    } else {
      try {
        await api.patch(`appointments/${id}/`, { status: newStatus });
        loadData();
      } catch (err) {
        alert("Error: " + (err.response?.data?.detail || "Action failed"));
      }
    }
  };

  const submitCancellation = async () => {
    const { id, reason } = cancelModal;
    if (!reason.trim()) {
      Alert.alert("Required", "Please enter a reason for cancellation.");
      return;
    }

    try {
      setLoading(true);
      setCancelModal({ visible: false, id: null, reason: "" });
      await api.patch(`appointments/${id}/`, {
        status: 'Cancelled',
        consultation_notes: `Faculty Cancellation: ${reason.trim()}`
      });
      loadData();
    } catch (err) {
      console.error(err);
      alert("Failed to cancel appointment.");
      setLoading(false);
    }
  };

  const submitDisapproval = async () => {
    const { id, reason } = disapproveModal;
    if (!reason.trim()) {
      Alert.alert("Required", "Please enter a reason for disapproval.");
      return;
    }

    try {
      setLoading(true);
      setDisapproveModal({ visible: false, id: null, reason: "" });
      await api.patch(`appointments/${id}/`, {
        status: 'Rejected',
        consultation_notes: `Faculty Rejection: ${reason.trim()}`
      });
      Alert.alert("Success", "Appointment disapproved.");
      loadData();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to disapprove appointment.");
      setLoading(false);
    }
  };

  const handleOpenCompleteModal = (item) => {
    setSelectedItem(item);
    setIsCompleteModalVisible(true);
  };

  const handleConfirmCompletion = async (data) => {
    try {
      const isMeeting = !selectedItem?.student_name || selectedItem?.student_name === "N/A";
      const payload = {
        outcome: data.outcome,
        consultation_notes: data.consultation_notes,
      };
      if (isMeeting && data.attendance) {
        payload.attendance = data.attendance;
      }

      await api.post(`appointments/${selectedItem.id}/complete_appointment/`, payload);

      setIsCompleteModalVisible(false);
      loadData();
    } catch (err) {
      console.error("Completion error:", err);
      alert("Failed to save consultation records.");
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    await api.delete(`appointments/${id}/`);
    loadData();
  };

  const TableHeader = () => (
    <View style={styles.headerRow}>

      <View style={{ flex: 1.5 }}>
        <Text style={styles.headerCell}>Date</Text>
      </View>

      <View style={{ flex: 1.5 }}>
        <Text style={styles.headerCell}>Time</Text>
      </View>

      <View style={{ flex: 2 }}>
        <Text style={styles.headerCell}>
          {activeTab === 'meetings' ? 'Host / Organizer' : 'Student'}
        </Text>
      </View>

      <View style={{ flex: 2 }}>
        <Text style={styles.headerCell}>
          {activeTab === 'meetings' ? 'Meeting Type' : 'Service'}
        </Text>
      </View>

      <View style={{ flex: 2 }}>
        <Text style={styles.headerCell}>
          {activeTab === 'meetings' ? 'Agenda' : 'Notes'}
        </Text>
      </View>

      <View style={{ flex: 1.5 }}>
        <Text style={styles.headerCell}>Status</Text>
      </View>

      <View style={{ flex: 2 }}>
        <Text style={[styles.headerCell, { textAlign: 'right', paddingRight: 10 }]}>Actions</Text>
      </View>
    </View>
  );

  const filteredAppointments = appointments.filter(item => {
    const isMeeting = !item.student_name || item.student_name === "N/A";
    return activeTab === 'meetings' ? isMeeting : !isMeeting;
  });

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE) || 1;
  const paginatedAppointments = filteredAppointments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

      <ImageBackground
        source={require('../assets/redox-01.png')}
        style={[styles.container]}
        resizeMode="repeat"
      >

        <View style={styles.mainWrapper} contentContainerStyle={{ padding: 25 }}>
          <View style={styles.header}>
            {isMobile ? (
              <>
                <Orb style={{ width: 120, height: 120, backgroundColor: '#4F8EF7', top: -30, left: -20 }} delay={0} />
                <Orb style={{ width: 180, height: 180, backgroundColor: '#93C5FD', bottom: -50, right: -40 }} delay={1500} />
              </>
            ) : (
              <>
                <Orb style={{ width: 120, height: 120, backgroundColor: '#4F8EF7', top: -30, left: -20 }} delay={0} />
                <Orb style={{ width: 180, height: 180, backgroundColor: '#93C5FD', bottom: -50, right: -40 }} delay={1500} />
                <Orb style={{ width: 100, height: 100, backgroundColor: '#60A5FA', top: '20%', right: '48%' }} delay={3000} />
                <Orb style={{ width: 60, height: 60, backgroundColor: '#BFDBFE', bottom: '10%', left: '25%' }} delay={800} />
                <Orb style={{ width: 150, height: 150, backgroundColor: '#3B82F6', top: -40, right: '25%' }} delay={2200} />
              </>
            )}
            <View style={{ zIndex: 2 }}>
              <Text style={styles.pageTitle}>Today's Schedule</Text>

              <Text style={styles.dateSubtext}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterGroup}>
              <View style={styles.datePickerBox}>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => { setDateStr(e.target.value); setCurrentPage(1); }}
                  style={styles.dateInput}
                />
              </View>

              <Pressable
                style={styles.sortBtn}
                onPress={() => { setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest'); setCurrentPage(1); }}
              >
                <MaterialCommunityIcons
                  name={sortOrder === 'newest' ? "sort-calendar-descending" : "sort-calendar-ascending"}
                  size={22}
                  color="#000000"
                />
              </Pressable>
            </View>

            {/* SEGMENTED TAB SELECTOR */}
            <View style={[styles.tabContainer, isMobile && { minWidth: 100 }]}>
              <Pressable
                style={[styles.tabButton, activeTab === 'students' && styles.tabButtonActive]}
                onPress={() => { setActiveTab('students'); setCurrentPage(1); }}
              >
                <MaterialCommunityIcons
                  name="account-school"
                  size={18}
                  color={activeTab === 'students' ? '#FFF' : '#475569'}
                />
                {!isMobile && (
                  <Text style={[styles.tabButtonText, activeTab === 'students' && styles.tabButtonTextActive]}>
                    Student
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={[styles.tabButton, activeTab === 'meetings' && styles.tabButtonActive]}
                onPress={() => { setActiveTab('meetings'); setCurrentPage(1); }}
              >
                <MaterialCommunityIcons
                  name="account-group"
                  size={18}
                  color={activeTab === 'meetings' ? '#FFF' : '#475569'}
                />
                {!isMobile && (
                  <Text style={[styles.tabButtonText, activeTab === 'meetings' && styles.tabButtonTextActive]}>
                    Faculty
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          <ScrollView horizontal={!isDesktop} showsHorizontalScrollIndicator={!isDesktop} style={{ flexGrow: 0 }}>
            <View style={{ width: '100%' }}>
              {loading ? (
                <ActivityIndicator size="large" color="#002366" style={{ marginTop: 40 }} />
              ) : (
                <FlatList
                  data={paginatedAppointments}
                  keyExtractor={(item) => item.id.toString()}
                  ListHeaderComponent={TableHeader}
                  contentContainerStyle={{ paddingBottom: 0 }}
                  renderItem={({ item }) => (
                    <AppointmentRow
                      item={item}
                      onViewDetails={() => handleViewDetails(item)}
                      onAction={handleAction}
                      onCompletePress={handleOpenCompleteModal}
                      onDelete={handleDelete}
                      isHighlighted={route?.params?.highlightId === item.id}
                    />
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyTitle}>
                        {activeTab === 'meetings' ? 'No CIT Meetings' : 'No Appointments'}
                      </Text>
                      <Text style={styles.emptyText}>
                        {activeTab === 'meetings'
                          ? 'There are no CIT meetings scheduled for this date.'
                          : 'There are no scheduled student consultations for this date.'}
                      </Text>
                    </View>
                  }
                />
              )}
            </View>
          </ScrollView>

          {!loading && totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <AnimatedPageButton
                onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                text="Previous"
                styles={styles}
              />

              <Text style={styles.pageText}>
                Page {currentPage} of {totalPages}
              </Text>

              <AnimatedPageButton
                onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                text="Next"
                styles={styles}
              />
            </View>
          )}

          <StudentDetailModal
            visible={isModalVisible}
            item={selectedItem}
            onClose={() => setIsModalVisible(false)}
            onAction={handleAction}
          />

          <CompleteAppointmentModal
            visible={isCompleteModalVisible}
            isMeeting={!selectedItem?.student_name || selectedItem?.student_name === "N/A"}
            participants={selectedItem?.participants_detail || []}
            onClose={() => setIsCompleteModalVisible(false)}
            onConfirm={handleConfirmCompletion}
          />

          <Modal visible={cancelModal.visible} transparent animationType="fade">
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20
            }}>
              <View style={{
                backgroundColor: '#FFF',
                borderRadius: 20,
                padding: 24,
                width: '90%',
                maxWidth: 400,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5
              }}>
                <Text style={{ ...Typography.header, fontSize: 26, fontWeight: '800', color: '#002366' }}>
                  Cancel Appointment
                </Text>
                <Text style={{ ...Typography.body, fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                  Please provide a reason for cancelling this appointment:
                </Text>
                <TextInput
                  placeholder="e.g. I have a schedule conflict with a class exam."
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    color: '#64748B',
                    minHeight: 100,
                    textAlignVertical: 'top',
                    marginBottom: 20,
                    backgroundColor: '#F8FAFC'
                  }}
                  multiline={true}
                  numberOfLines={4}
                  value={cancelModal.reason}
                  onChangeText={(txt) => setCancelModal({ ...cancelModal, reason: txt })}
                />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <AnimatedCancelButton
                    onPress={() => setCancelModal({ visible: false, id: null, reason: "" })}
                    text="Go Back"
                    baseColor="#F1F5F9"
                    hoverColor="#E2E8F0"
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                    textStyle={{ fontFamily: Typography.label.fontFamily, color: '#475569', fontWeight: '700', fontSize: 14 }}
                  />
                  <AnimatedCancelButton
                    onPress={submitCancellation}
                    text="Cancel Appt"
                    baseColor="#EF4444"
                    hoverColor="#DC2626"
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                    textStyle={{ fontFamily: Typography.label.fontFamily, color: '#FFF', fontWeight: '700', fontSize: 14 }}
                  />
                </View>
              </View>
            </View>
          </Modal>

          <Modal visible={disapproveModal.visible} transparent animationType="fade">
            <View style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 20
            }}>
              <View style={{
                backgroundColor: '#FFF',
                borderRadius: 20,
                padding: 24,
                width: '90%',
                maxWidth: 400,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 5
              }}>
                <Text style={{ ...Typography.header, fontSize: 26, fontWeight: '800', color: '#002366' }}>
                  Disapprove Appointment
                </Text>
                <Text style={{ ...Typography.body, fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                  Provide a brief explanation or instructions for the student:
                </Text>
                <TextInput
                  placeholder="e.g. Please choose another time slot..."
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#E2E8F0',
                    borderRadius: 10,
                    padding: 12,
                    fontSize: 14,
                    color: '#64748B',
                    minHeight: 100,
                    textAlignVertical: 'top',
                    marginBottom: 20,
                    backgroundColor: '#F8FAFC'
                  }}
                  multiline={true}
                  numberOfLines={4}
                  value={disapproveModal.reason}
                  onChangeText={(txt) => setDisapproveModal(prev => ({ ...prev, reason: txt }))}
                />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <AnimatedCancelButton
                    onPress={() => setDisapproveModal({ visible: false, id: null, reason: "" })}
                    text="Cancel"
                    baseColor="#F1F5F9"
                    hoverColor="#E2E8F0"
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                    textStyle={{ fontFamily: Typography.label.fontFamily, color: '#475569', fontWeight: '700', fontSize: 14 }}
                  />
                  <AnimatedCancelButton
                    onPress={submitDisapproval}
                    text="Confirm"
                    baseColor="#EF4444"
                    hoverColor="#DC2626"
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                    textStyle={{ fontFamily: Typography.label.fontFamily, color: '#FFF', fontWeight: '700', fontSize: 14 }}
                  />
                </View>
              </View>
            </View>
          </Modal>

        </View>
        <AppFooter userRole="faculty" navigation={navigation} />
      </ImageBackground>
    </ScrollView>
  );
}

const getStyles = (isMobile, isDesktop) => StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    width: '100%',
    height: '100%',
  },
  header: {
    marginBottom: 24,
    marginTop: 16,
    padding: isMobile ? 24 : 36,
    borderRadius: 24,
    backgroundColor: '#002366',
    shadowColor: '#002366',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  pageTitle: {
    fontFamily: Typography.header.fontFamily,
    fontSize: isMobile ? 22 : 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  dateSubtext: {
    fontFamily: Typography.body.fontFamily,
    color: 'rgba(255,255,255,0.70)',
    fontSize: isMobile ? 13 : 15,
    fontWeight: '500',
  },
  glassAccent: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
    marginBottom: 10,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  datePickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  datePickerLabel: {
    color: '#002366',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dateInput: {
    fontWeight: '600',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    cursor: 'pointer',
    lineHeight: 1,
    outlineStyle: 'none',
    width: 130,
    paddingRight: 8,
    color: '#0F172A',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 12,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sortBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: isDesktop ? '100%' : 1000,
  },
  headerCell: {
    fontSize: isMobile ? 10 : 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingLeft: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignSelf: 'center',
    minWidth: 320,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 7,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#002366',
    shadowColor: '#002366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.1,
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontFamily: Typography.label.fontFamily,
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  emptyText: {
    fontFamily: Typography.body.fontFamily,
    fontSize: isMobile ? 13 : 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 20
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 15,
  },
  pageButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pageButtonDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002366',
  },
  pageText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  mainWrapper: {
    minHeight: '90vh',
    width: '100%',
    paddingHorizontal: isMobile ? 12 : 50,
    paddingTop: 16,
  },
});
