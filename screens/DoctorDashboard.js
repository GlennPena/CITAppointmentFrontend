import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, ImageBackground, useWindowDimensions} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

import api from "../utils/api";
import { Typography } from "../styles/theme";
import Avatar from "../components/Avatar";

export default function DoctorDashboard({ navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;
  const styles = getStyles(isMobile, isDesktop);

  const numColumns = isDesktop ? 2 : 1;

  const [stats, setStats] = useState({ today: 0, pending: 0, completed: 0, remaining: 0, total: 0});
  const [nextPatient, setNextPatient] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const res = await api.get("appointments/");
      const data = res.data;
      const now = new Date();
      const todayStr = now.toDateString();
      
      // 1. Calculate Stats (Your existing logic)
      const todayApps = data.filter(a => new Date(a.date_time).toDateString() === todayStr);
      const completedToday = todayApps.filter(a => a.status.toLowerCase() === 'completed').length;
      setStats({
        today: todayApps.length,
        pending: data.filter(a => a.status.toLowerCase() === 'pending').length,
        completed: data.filter(a => a.status.toLowerCase() === 'completed').length,
        remaining: todayApps.length - completedToday,
        total: data.length
      });

      // 2. Find "Next Patient" Logic
      // Filter for today, status NOT completed/rejected, and time is in the future or current
      const upcoming = todayApps
        .filter(a => a.status === 'Approved')
        .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

      setNextPatient(upcoming[0] || null);

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
            <Text style={styles.pageTitle}>Doctor Dashboard</Text>

            <Text style={styles.dateSubtext}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>

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
                        <Text style={styles.requestName}>{item.patient_name}</Text>
                        <Text style={styles.requestDate}>
                          {new Date(item.date_time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <Text style={styles.requestService}>{item.service}</Text>
                      <Pressable 
                        style={styles.reviewBtn}
                        onPress={() => navigation.navigate('Schedule', { highlightId: item.id })}
                      >
                        <Text style={styles.reviewBtnText}>Review Request</Text>
                      </Pressable>
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
            
              {nextPatient ? (
                <View style={styles.nextPatientCard}>
                  
                  <View style={styles.cardHeader}>
                    <Avatar 
                      name={nextPatient.patient_name} 
                      size={56}
                      backgroundColor="#002366" 
                      textColor="#fff"
                    />
                    <View style={styles.nextInfo}>
                      <Text style={styles.nextName}>{nextPatient.patient_name}</Text>
                      <Text style={styles.nextService}>{nextPatient.service}</Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeText}>
                        {new Date(nextPatient.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                  <Text style={styles.emptyText}>No upcoming patients for today.</Text>
                </View>
              )}
          </View>
        </View>
    </ImageBackground>
  </ScrollView>
  );
}

const getStyles = (isMobile, isDesktop) => StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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

  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    justifyContent: isDesktop ? 'flex-start' : 'space-between',
    gap: isDesktop ? 30 : isMobile ? 12 : 20,
    paddingHorizontal: isDesktop ? 60 : isMobile ? 0 : 20
  },
  statCard: { 
    width: isDesktop ? undefined : '48%',
    flex: isMobile ? undefined : 1,
    flexDirection: 'row',
    backgroundColor: '#FFF', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: isDesktop ? 30 : isMobile ? 15 : 20,
    minWidth: isDesktop ? 160 : '45%',
  },
  statInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  statLabel: { 
    ...Typography.body,
    color: '#64748B', 
    fontSize: isDesktop ? 16 : isMobile ? 12 : 14, 
    fontWeight: '700', 
  },
  statValue: { 
    fontSize: isDesktop ? 38 : isMobile ? 28 : 32,
    lineHeight: isDesktop ? 36 : 32,
    fontWeight: '800' 
  },

  sectionWrapper: {
    marginTop: 50
  },
  sectionTitle: { 
    ...Typography.title,
    fontSize: isMobile ? 18 : 22,
    fontWeight: '800', 
    color: '#002366', 
    marginBottom: 15,
    letterSpacing: -0.4,
  },

  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  requestDate: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  requestService: {
    fontSize: 13,
    color: '#0052FF',
    marginBottom: 16,
  },
  reviewBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  reviewBtnText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  emptySubtext: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 30,
    fontStyle: 'italic',
  },
  nextPatientCard: { width: '100%', backgroundColor: '#FFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, },
  nextInfo: { flex: 1, marginLeft: 15 },
  nextName: { ...Typography.title, fontSize: 20, fontWeight: '800', color: '#1E293B' },
  nextService: { ...Typography.body, fontSize: 14, color: '#64748B' },
  timeBadge: { backgroundColor: '#002366', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  timeText: { ...Typography.title, color: '#fff', fontWeight: '800', fontSize: 14 },
  actionBtn: { backgroundColor: '#002366', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 16, gap: 10 },
  actionBtnText: { ...Typography.title, color: '#FFF', fontWeight: '700', fontSize: 16 },
  requestCard: {
    backgroundColor: '#FFF',
    width: 230,
    padding: 20,
    borderRadius: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  emptyCard: { 
    padding: isDesktop ? 80 : 60, 
    alignItems: 'center', 
    backgroundColor: '#F1F5F9', 
    borderRadius: 24, 
    borderStyle: 'dashed', 
    borderWidth: 2, 
    borderColor: '#CBD5E1' 
  },
  emptyText: { 
    ...Typography.body,
    fontSize: 16,
    color: '#94A3B8', 
    fontWeight: '600', 
    marginTop: 10,
    textAlign: 'center'
  },

});