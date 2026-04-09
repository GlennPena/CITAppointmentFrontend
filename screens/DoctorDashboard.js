import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from "../utils/api";

export default function DoctorDashboard({ navigation }) {
  const [stats, setStats] = useState({ today: 0, pending: 0, completed: 0, total: 0 });
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
      setStats({
        today: todayApps.length,
        pending: data.filter(a => a.status.toLowerCase() === 'pending').length,
        completed: data.filter(a => a.status.toLowerCase() === 'completed').length,
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

  if (loading) return <ActivityIndicator size="large" color="#059669" style={{flex: 1}} />;

  return (
    <ScrollView style={styles.mainWrapper} contentContainerStyle={{ padding: 25 }}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Doctor Dashboard</Text>

        <Text style={styles.dateSubtext}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      {/* STATISTICS GRID */}
      <View style={styles.statsGrid}>
        <StatCard label="Today" value={stats.today} color="#1E293B" icon="calendar-check" />
        <StatCard label="Pending" value={stats.pending} color="#F97316" icon="clock-outline" />
      </View>

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
          <Text style={styles.emptySubtext}>All caught up! No pending requests.</Text>
        )}

      {/* QUICK VIEW: NEXT PATIENT */}
      <Text style={styles.sectionTitle}>Next Appointment</Text>
      {nextPatient ? (
        <View style={styles.nextPatientCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="account-circle" size={40} color="#0052FF" />
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
    </ScrollView>
  );
}

const StatCard = ({ label, value, color, icon }) => (
  <View style={styles.statCard}>
    <MaterialCommunityIcons name={icon} size={20} color={color} style={{ marginBottom: 10 }} />
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  mainWrapper: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    marginBottom: 24,
    padding: 24,
    borderRadius: 28,
    backgroundColor: '#002366',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 8,
  },
  portalTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  dateSubtext: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statCard: { flex: 1, backgroundColor: '#FFF', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  statLabel: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  statValue: { fontSize: 32, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 15 },
  nextPatientCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 24, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  nextInfo: { flex: 1, marginLeft: 15 },
  nextName: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  nextService: { fontSize: 14, color: '#64748B' },
  timeBadge: { backgroundColor: '#EEF2FF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  timeText: { color: '#4338CA', fontWeight: '800', fontSize: 14 },
  actionBtn: { backgroundColor: '#1E293B', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, borderRadius: 16, gap: 10 },
  actionBtnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  emptyCard: { padding: 40, alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 24, borderStyle: 'dashed', borderWidth: 2, borderColor: '#CBD5E1' },
  emptyText: { color: '#94A3B8', fontWeight: '600', marginTop: 10 },
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
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10
  },
  dateSubtext: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600'
  },
});