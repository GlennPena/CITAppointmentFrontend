import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, ImageBackground, useWindowDimensions, Modal, TextInput, Alert} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "../utils/api";
import { Typography } from "../styles/theme";
import Avatar from "../components/Avatar";
import MeetingBookingModal from "../components/MeetingBookingModal";

export default function FacultyDashboard({ navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;
  const styles = getStyles(isMobile, isDesktop);

  const [facultyName, setFacultyName] = useState("Faculty");

  const [stats, setStats] = useState({ today: 0, pending: 0, completed: 0, remaining: 0, total: 0});
  const [nextStudent, setNextStudent] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [disapproveModal, setDisapproveModal] = useState({ visible: false, id: null, reason: "" });
  const [isBookingVisible, setIsBookingVisible] = useState(false);
  

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('first_name');
      
      if (savedName) {
        const formattedName = savedName.charAt(0).toUpperCase() + savedName.slice(1);
        setFacultyName(formattedName);
      } else {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const rawName = parsedUser.first_name || parsedUser.username || "Faculty";
          setFacultyName(rawName.charAt(0).toUpperCase() + rawName.slice(1));
        }
      }

      const res = await api.get("appointments/");
      const data = res.data;
      const now = new Date();
      const todayStr = now.toDateString();
      
      const todayApps = data.filter(a => new Date(a.date_time).toDateString() === todayStr);
      const completedToday = todayApps.filter(a => a.status.toLowerCase() === 'completed').length;

      setStats({
        today: todayApps.length,
        pending: data.filter(a => a.status.toLowerCase() === 'pending').length,
        completed: data.filter(a => a.status.toLowerCase() === 'completed').length,
        remaining: todayApps.length - completedToday,
        total: data.length
      });

      const upcoming = todayApps
        .filter(a => a.status === 'Approved')
        .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

      setNextStudent(upcoming[0] || null);

      const pending = data
      .filter(a => a.status === 'Pending')
      .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

      setPendingRequests(pending);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }; 

  const handleQuickAction = async (id, action) => {
    if (action === 'Approved') {
      try {
        setLoading(true);
        const res = await api.patch(`appointments/${id}/`, { status: 'Approved' });
        const apptDate = res.data.date_time.split('T')[0];
        setLoading(false);
        loadData();
        Alert.alert("Success", "Appointment approved successfully!", [
          {
            text: "View in Schedule",
            onPress: () => navigation.navigate('Schedule', { date: apptDate, highlightId: id })
          },
          {
            text: "Dismiss",
            style: "cancel"
          }
        ]);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to approve appointment.");
        setLoading(false);
      }
    } else {
      setDisapproveModal({ visible: true, id: id, reason: "" });
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
        consultation_notes: reason.trim()
      });
      Alert.alert("Success", "Appointment disapproved.");
      loadData();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to disapprove appointment.");
      setLoading(false);
    }
  };

  const StatCard = ({ label, value, color, icon}) => (
    <View style={styles.statCard}>
      <View style={styles.statInfo}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
      <MaterialCommunityIcons name={icon} size={ isMobile ? 40 : isDesktop ? 50 : 40} color={color} style={{ marginTop: 5 }} />
    </View>
  );

  if (loading) return <ActivityIndicator size="large" color="#059669" style={{flex: 1}} />;

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

      <ImageBackground 
        source={require('../assets/redox-01.png')} 
        style={[styles.container]}
        resizeMode="repeat"
      >

        <View style={styles.mainWrapper} contentContainerStyle={{ padding: 25 }}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.pageTitle} numberOfLines={1} ellipsizeMode="tail">
                  Welcome, {facultyName}
                </Text>
                <Text style={styles.dateSubtext}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
              <Pressable 
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#002366',
                    paddingVertical: 14,
                    paddingHorizontal: 24,
                    borderRadius: 16,
                    gap: 8,
                    shadowColor: '#002366',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.15,
                    shadowRadius: 10,
                    elevation: 4,
                  },
                  pressed && { opacity: 0.9, transform: [{ scale: 0.96 }] }
                ]}
                hitSlop={15}
                onPress={() => setIsBookingVisible(true)}
              >
                <MaterialCommunityIcons name="calendar-plus" size={20} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.2 }}>Book Meeting</Text>
              </Pressable>
            </View>
            <View style={styles.glassAccent} />
          </View>
          
          <View style={styles.statsGrid}>
            <StatCard label="Today" value={stats.today} color="#1E293B" icon="calendar-check" />
            <StatCard label="Pending" value={stats.pending} color="#F97316" icon="clock-outline" />
            <StatCard label="Completed" value={stats.completed} color="#059669" icon="check-circle-outline" />
            <StatCard label="Remaining" value={stats.remaining} color="#6366F1" icon="progress-clock" />
          </View>

          <View style={styles.sectionWrapper}>  
            <Text style={styles.sectionTitle}>Needs Your Approval ({pendingRequests.length})</Text>
              {pendingRequests.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                  {pendingRequests.map((item) => (
                    <View key={item.id} style={styles.requestCard}>
                      <View style={styles.requestHeader}>
                        <Text style={styles.requestName}>{item.student_name}</Text>
                        <Text style={styles.requestDate}>
                          {new Date(item.date_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <Text style={styles.requestService}>{item.service}</Text>

                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>NOTES PREVIEW:</Text>
                      <View style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginBottom: 12, height: 60, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' }}>
                        <Text style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', lineHeight: 15 }} numberOfLines={3}>
                          {item.condition || "No notes provided."}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
                        <Pressable 
                          style={({ pressed }) => [
                            { flex: 1, backgroundColor: '#10B981', paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
                            pressed && { opacity: 0.8 }
                          ]}
                          onPress={() => handleQuickAction(item.id, 'Approved')}
                        >
                          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>Approve</Text>
                        </Pressable>
                        <Pressable 
                          style={({ pressed }) => [
                            { flex: 1, backgroundColor: '#EF4444', paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
                            pressed && { opacity: 0.8 }
                          ]}
                          onPress={() => handleQuickAction(item.id, 'Rejected')}
                        >
                          <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>Disapprove</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons name="check-decagram-outline" size={46} color="#94A3B8" />
                  <Text style={styles.emptyText}>All caught up! No pending requests.</Text>
                </View>
              )}
          </View>

          <View style={[styles.sectionWrapper, {marginBottom : 60}]}>
            <Text style={styles.sectionTitle}>Next Appointment</Text>
            
              {nextStudent ? (
                <View style={styles.nextPatientCard}>
                  
                  <View style={styles.cardHeader}>
                    <Avatar 
                      name={nextStudent.student_name} 
                      size={56}
                      backgroundColor="#002366" 
                      textColor="#fff"
                    />
                    <View style={styles.nextInfo}>
                      <Text style={styles.nextName}>{nextStudent.student_name}</Text>
                      <Text style={styles.nextService}>{nextStudent.service}</Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeText}>
                        {new Date(nextStudent.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                  
                  <Pressable 
                    style={styles.actionBtn} 
                    onPress={() => navigation.navigate('Schedule')}
                  >
                    <Text style={styles.actionBtnText}>Go to Schedule</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons name="check-decagram-outline" size={40} color="#94A3B8" />
                  <Text style={styles.emptyText}>No upcoming students for today.</Text>
                </View>
              )}
          </View>
        </View>

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
              <Text style={{ ...Typography.header, fontSize: 18, fontWeight: '800', color: '#002366', marginBottom: 8 }}>
                Disapprove Appointment
              </Text>
              <Text style={{ ...Typography.body, fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                Provide a brief explanation or instructions for the student:
              </Text>
              <TextInput
                placeholder="e.g. Please choose another time slot, as I will be in a faculty seminar."
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
                value={disapproveModal.reason}
                onChangeText={(txt) => setDisapproveModal({ ...disapproveModal, reason: txt })}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable
                  style={{ flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                  onPress={() => setDisapproveModal({ visible: false, id: null, reason: "" })}
                >
                  <Text style={{ color: '#475569', fontWeight: '700', fontSize: 14 }}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={{ flex: 1, backgroundColor: '#EF4444', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                  onPress={submitDisapproval}
                >
                  <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Confirm</Text>
                </Pressable>
              </View>
            </View>
        </View>
      </Modal>

      <MeetingBookingModal
        isVisible={isBookingVisible}
        onClose={() => setIsBookingVisible(false)}
        onBookingSuccess={() => {
          loadData();
          Alert.alert("Success", "Meeting scheduled successfully!");
        }}
      />
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
    paddingHorizontal: isMobile ? 12 : 50,
    paddingTop: 16,
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
    fontSize: isMobile ? 22 : 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  dateSubtext: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: isMobile ? 13 : 16,
    fontWeight: '500',
    letterSpacing: 0.1,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: isDesktop ? 'flex-start' : 'space-between',
    gap: isDesktop ? 24 : isMobile ? 10 : 16,
    paddingHorizontal: isDesktop ? 60 : isMobile ? 0 : 16,
  },
  statCard: {
    width: isDesktop ? undefined : '48%',
    flex: isMobile ? undefined : 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isDesktop ? 26 : isMobile ? 14 : 18,
    minWidth: isDesktop ? 160 : '45%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  statLabel: {
    color: '#64748B',
    fontSize: isDesktop ? 14 : isMobile ? 11 : 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: isDesktop ? 36 : isMobile ? 26 : 30,
    lineHeight: isDesktop ? 40 : 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sectionWrapper: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: isMobile ? 17 : 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  requestDate: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  requestService: {
    fontSize: 13,
    color: '#002366',
    fontWeight: '500',
    marginBottom: 14,
  },
  reviewBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 28,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  nextPatientCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  nextInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nextName: {
    fontSize: isMobile ? 15 : 18,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  nextService: {
    fontSize: isMobile ? 12 : 13,
    color: '#64748B',
    marginTop: 2,
  },
  timeBadge: {
    backgroundColor: '#002366',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 12,
  },
  timeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: isMobile ? 12 : 13,
    letterSpacing: 0.3,
  },
  actionBtn: {
    backgroundColor: '#002366',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#002366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: isMobile ? 14 : 15,
    letterSpacing: 0.3,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    width: 272,
    padding: 18,
    borderRadius: 18,
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyCard: {
    padding: isDesktop ? 72 : 52,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
  },
  mainWrapper: {
    width: '100%',
  },
});
