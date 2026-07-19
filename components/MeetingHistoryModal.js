import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Dimensions, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import MeetingReportModal from './MeetingReportModal';
import { Typography } from "../styles/theme";

const { height } = Dimensions.get('window');

export default function MeetingHistoryModal({ visible, onClose, meeting }) {
  const [reportVisible, setReportVisible] = useState(false);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = getStyles(isMobile);

  if (!meeting) return null;

  const meetingDate = new Date(meeting.date_time).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const meetingTime = new Date(meeting.date_time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const participantsList = meeting.participants_attendance || [];

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 15 }}>
              <View style={styles.iconCircleHeader}>
                <MaterialCommunityIcons name="account-group" size={24} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.meetingTitle} numberOfLines={2}>{meeting.service}</Text>
                <Text style={styles.meetingOrganizer} numberOfLines={1}>Organized by {meeting.faculty_name}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={15}>
              <MaterialCommunityIcons name="close" size={26} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* SCHEDULE DETAILS */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.labelCaps}>DATE</Text>
                <Text style={styles.statValue}>{meetingDate}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.labelCaps}>TIME</Text>
                <Text style={styles.statValue}>{meetingTime}</Text>
              </View>
            </View>

            {/* AGENDA */}
            <Text style={styles.labelCaps}>MEETING AGENDA / NOTES</Text>
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>{meeting.condition || "No agenda details provided."}</Text>
            </View>

            {/* PARTICIPANTS ATTENDANCE */}
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#002366" />
              <Text style={styles.sectionTitle}>Participants Attendance</Text>
            </View>
            <View style={styles.dividerLine} />

            <View style={styles.participantsList}>
              {participantsList.length === 0 ? (
                <Text style={styles.emptyText}>No other participants were associated with this meeting.</Text>
              ) : (
                participantsList.map((p, idx) => (
                  <View key={idx} style={styles.participantItem}>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{p.full_name}</Text>
                      <Text style={styles.userRole}>{p.role === 'dean' ? 'Dean' : 'Faculty'}</Text>
                    </View>
                    <View style={[
                      styles.badge, 
                      p.attended ? styles.badgeAttended : styles.badgeAbsent
                    ]}>
                      <MaterialCommunityIcons 
                        name={p.attended ? "check-circle" : "close-circle"} 
                        size={14} 
                        color="#FFF" 
                      />
                      <Text style={styles.badgeText}>
                        {p.attended ? "Attended" : "Absent"}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* GENERATE REPORT BUTTON */}
            <Pressable 
              style={styles.reportBtn} 
              onPress={() => setReportVisible(true)}
            >
              <MaterialCommunityIcons name="file-document-outline" size={20} color="#002366" />
              <Text style={styles.reportBtnText}>Generate Meeting Report</Text>
            </Pressable>

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Close Details</Text>
            </Pressable>
          </View>

        </View>
      </View>

      <MeetingReportModal 
        visible={reportVisible} 
        onClose={() => setReportVisible(false)} 
        data={meeting} 
      />
    </Modal>
  );
}

const getStyles = (isMobile) => StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? 10 : 20,
  },
  modalContent: { 
    backgroundColor: '#FFFFFF', 
    width: '90%', 
    maxWidth: 600,
    maxHeight: '85%', 
    height: height * 0.75,
    borderRadius: 20, 
    overflow: 'hidden',  
    flexDirection: 'column',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
  },
  iconCircleHeader: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#002366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  meetingTitle: { 
    fontFamily: 'Inter_700Bold',
    fontSize: 18, 
    color: '#0F172A',
  },
  meetingOrganizer: { 
    fontFamily: 'Roboto_400Regular',
    fontSize: 12, 
    color: '#64748B',
    marginTop: 2,
  },
  scrollBody: { 
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
  },
  labelCaps: { 
    fontFamily: 'Inter_700Bold',
    fontSize: 11, 
    color: '#002366', 
    letterSpacing: 0.5, 
    marginBottom: 6,
  },
  statValue: { 
    fontFamily: 'Inter_500Medium',
    fontSize: 15, 
    color: '#0F172A',
    fontWeight: '700',
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  notesText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#002366',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#002366',
    marginVertical: 10,
  },
  participantsList: {
    gap: 10,
    marginBottom: 20,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
  },
  userInfo: {
    flexDirection: 'column',
    gap: 2,
  },
  userName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#0F172A',
  },
  userRole: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeAttended: {
    backgroundColor: '#10B981',
  },
  badgeAbsent: {
    backgroundColor: '#EF4444',
  },
  badgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 12,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#002366',
    borderStyle: 'dashed',
    gap: 6,
  },
  reportBtnText: {
    fontFamily: 'Inter_700Bold',
    color: '#002366',
    fontSize: 13,
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    alignItems: 'center', 
    padding: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#F1F5F9',
  },
  closeBtn: {  
    backgroundColor: '#002366', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 10,
  },
  closeBtnText: { 
    fontFamily: 'Inter_700Bold',
    color: '#FFF', 
    fontSize: 13, 
  },
});
