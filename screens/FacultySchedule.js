import { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Text, ActivityIndicator, Pressable, ScrollView, ImageBackground, useWindowDimensions, Modal, TextInput, Alert} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppointmentRow from "../components/AppointmentTable";
import StudentDetailModal from "../components/StudentDetailModal";
import CompleteAppointmentModal from "../components/CompleteAppointmentModal";

import api from "../utils/api";
import { Typography } from "../styles/theme";


export default function FacultySchedule({ route }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;
  const styles = getStyles(isMobile, isDesktop);

  const [appointments, setAppointments] = useState([]);
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [cancelModal, setCancelModal] = useState({ visible: false, id: null, reason: "" });

  const [isCompleteModalVisible, setIsCompleteModalVisible] = useState(false);

  const [sortOrder, setSortOrder] = useState('newest');
  const [activeTab, setActiveTab] = useState('students'); // 'students' or 'meetings'

  useEffect(() => {
    if (route?.params?.date) {
      setDateStr(route.params.date);
    }
  }, [route?.params]);

  useEffect(() => {
    loadData();
  }, [dateStr, sortOrder]);

  const loadData = async () => {
    setLoading(true);
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

  const handleOpenCompleteModal = (item) => {
    setSelectedItem(item);
    setIsCompleteModalVisible(true);
  };

  const handleConfirmCompletion = async (data) => {
    try {
      await api.post(`appointments/${selectedItem.id}/complete_appointment/`, {
        outcome: data.outcome,
        consultation_notes: data.consultation_notes,
      });
      
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
        <Text style={[styles.headerCell, {textAlign: 'right', paddingRight:10 }]}>Actions</Text>
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

      <ImageBackground 
        source={require('../assets/redox-01.png')} 
        style={[styles.container]}
        resizeMode="repeat"
      >

      <View style={styles.mainWrapper} contentContainerStyle={{ padding: 25 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Today's Schedule</Text>

            <Text style={styles.dateSubtext}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.glassAccent} />
        </View>
        
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <View style={styles.datePickerBox}>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                style={styles.dateInput}
              />
            </View>

            <Pressable 
              style={styles.sortBtn} 
              onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            >
              <MaterialCommunityIcons 
                name={sortOrder === 'newest' ? "sort-calendar-descending" : "sort-calendar-ascending"} 
                size={22} 
                color="#000000" 
              />
            </Pressable>
          </View>
        </View>
      
        {/* SEGMENTED TAB SELECTOR */}
        <View style={styles.tabContainer}>
          <Pressable 
            style={[styles.tabButton, activeTab === 'students' && styles.tabButtonActive]}
            onPress={() => setActiveTab('students')}
          >
            <MaterialCommunityIcons 
              name="account-school" 
              size={18} 
              color={activeTab === 'students' ? '#FFF' : '#475569'} 
            />
            <Text style={[styles.tabButtonText, activeTab === 'students' && styles.tabButtonTextActive]}>
              Student Consultations
            </Text>
          </Pressable>

          <Pressable 
            style={[styles.tabButton, activeTab === 'meetings' && styles.tabButtonActive]}
            onPress={() => setActiveTab('meetings')}
          >
            <MaterialCommunityIcons 
              name="account-group" 
              size={18} 
              color={activeTab === 'meetings' ? '#FFF' : '#475569'} 
            />
            <Text style={[styles.tabButtonText, activeTab === 'meetings' && styles.tabButtonTextActive]}>
              CIT Meetings
            </Text>
          </Pressable>
        </View>

        <ScrollView horizontal={!isDesktop} showsHorizontalScrollIndicator={!isDesktop}>
          <View style={{ width: '100%' }}>
            {loading ? (
              <ActivityIndicator size="large" color="#002366" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={appointments.filter(item => {
                  const isMeeting = !item.student_name || item.student_name === "N/A";
                  return activeTab === 'meetings' ? isMeeting : !isMeeting;
                })}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={TableHeader}
                contentContainerStyle={{ paddingBottom: 40 }}
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

        <StudentDetailModal 
          visible={isModalVisible} 
          item={selectedItem} 
          onClose={() => setIsModalVisible(false)} 
          onAction={handleAction}
        />

        <CompleteAppointmentModal
          visible={isCompleteModalVisible}
          studentName={selectedItem?.student_name}
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
              <Text style={{ ...Typography.header, fontSize: 18, fontWeight: '800', color: '#002366', marginBottom: 8 }}>
                Cancel Appointment
              </Text>
              <Text style={{ ...Typography.body, fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                Please provide a reason for cancelling this appointment:
              </Text>
              <TextInput
                placeholder="e.g. Schedule conflict with department faculty meeting."
                style={{
                  borderWidth: 1.5,
                  borderColor: '#E2E8F0',
                  borderRadius: 10,
                  padding: 12,
                  fontSize: 14,
                  color: '#1E293B',
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
                <Pressable
                  style={{ flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                  onPress={() => setCancelModal({ visible: false, id: null, reason: "" })}
                >
                  <Text style={{ color: '#475569', fontWeight: '700', fontSize: 14 }}>Go Back</Text>
                </Pressable>
                <Pressable
                  style={{ flex: 1, backgroundColor: '#EF4444', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                  onPress={submitCancellation}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Cancel Appt</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        </View>
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
    backgroundColor: '#F8FAFC',
    width: '100%',
    height: '100%', 
    paddingHorizontal: isMobile ? 12 : 50, 
    paddingTop: 16
  },
  header: {
    marginBottom: 24,
    marginTop: 16,
    padding: isMobile ? 30 : 36,
    borderRadius: 28,
    backgroundColor: '#002366',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 8,
    width: '100%',

    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    gap: isMobile ? 10 : 0,
  },
  pageTitle: {
    ...Typography.header,
    fontSize: isMobile ? 24 : 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  dateSubtext: {
    ...Typography.title,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 18,
    fontWeight: '600'
  },
  glassAccent: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerBox: {
    flexDirection: 'row', 
    alignItems: 'center',
    marginVertical: 20,
    gap: 12
  },
  datePickerLabel: {
    ...Typography.title,
    color: '#002366',
    fontSize: 18,
    fontWeight: '800',
  },
  dateInput: {
    ...Typography.body,
    fontWeight: '600',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    cursor: 'pointer',
    lineHeight: 1,
    outlineStyle: 'none',
    width: 105,
    paddingRight: 8,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#ffffff',
    padding: 6,
    paddingHorizontal: 12

  },
  sortBtnText: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },

  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: isDesktop ? '100%' : 1000,
  },
  headerCell: {
    ...Typography.label,
    fontSize: isMobile ? 10 : 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    paddingLeft: 20
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignSelf: 'flex-start',
    minWidth: 320
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    backgroundColor: 'transparent'
  },
  tabButtonActive: {
    backgroundColor: '#002366',
    shadowColor: '#002366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  tabButtonTextActive: {
    color: '#FFF'
  },

  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    ...Typography.body,
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  emptyText: {
    ...Typography.body,
    fontSize: isMobile ? 12 : 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  mainWrapper: {
    width: '100%',
  }
});
