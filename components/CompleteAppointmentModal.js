import { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Typography } from "../styles/theme";

export default function CompleteAppointmentModal({ visible, onClose, onConfirm, isMeeting, participants = [] }) {
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    if (visible) {
      // Default all participants to attended (true)
      const initialAttendance = {};
      participants.forEach(p => {
        initialAttendance[p.id] = true;
      });
      setAttendance(initialAttendance);
      setOutcome("");
      setNotes("");
    }
  }, [visible, participants]);

  const toggleAttendance = (id) => {
    setAttendance(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleConfirm = () => {
    if (isMeeting) {
      onConfirm({
        outcome: "Completed",
        consultation_notes: "Meeting completed successfully.",
        attendance: attendance
      });
    } else {
      onConfirm({
        outcome: outcome.trim() || "Stable", 
        consultation_notes: notes.trim() || "No specific notes provided."
      });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, isMeeting && { maxHeight: '80%' }]}>
          <Text style={styles.title}>{isMeeting ? "Meeting Attendance" : "Complete Appointment"}</Text>
          <Text style={styles.subtitle}>
            {isMeeting 
              ? "Mark which of the designated participants attended this faculty meeting." 
              : "Add final outcome details so this appointment is recorded cleanly."}
          </Text>

          {isMeeting ? (
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={true}>
              <Text style={styles.label}>Invited Participants</Text>
              <View style={styles.attendanceList}>
                {participants.length === 0 ? (
                  <Text style={styles.emptyText}>No other participants were invited.</Text>
                ) : (
                  participants.map((participant) => {
                    const isAttended = !!attendance[participant.id];
                    return (
                      <Pressable
                        key={participant.id}
                        style={styles.attendanceItem}
                        onPress={() => toggleAttendance(participant.id)}
                      >
                        <View style={styles.userInfoCol}>
                          <Text style={styles.participantName}>{participant.full_name}</Text>
                          <Text style={styles.participantRole}>
                            {participant.role === 'dean' ? 'Dean' : 'Faculty'}
                          </Text>
                        </View>
                        
                        {/* Attendance Badge Switch */}
                        <View style={[
                          styles.badge, 
                          isAttended ? styles.badgeAttended : styles.badgeAbsent
                        ]}>
                          <MaterialCommunityIcons 
                            name={isAttended ? "check-circle" : "close-circle"} 
                            size={14} 
                            color="#FFF" 
                          />
                          <Text style={styles.badgeText}>
                            {isAttended ? "Attended" : "Absent"}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </ScrollView>
          ) : (
            <View style={{ gap: 12 }}>
              <Text style={styles.label}>Outcome (Optional)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. Stable, Needs Follow-up"
                placeholderTextColor="#94A3B8"
                value={outcome}
                onChangeText={setOutcome}
              />

              <Text style={styles.label}>Consultation Notes (Optional)</Text>
              <TextInput 
                style={[styles.input, { height: 80 }]} 
                multiline 
                placeholder="Add specific consultation notes here..."
                placeholderTextColor="#94A3B8"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          )}

          <View style={styles.buttonRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmText}>{isMeeting ? "Save & Complete" : "Complete"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.35)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  modalContainer: { 
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#FFFFFF', 
    borderRadius: 22, 
    padding: 28, 
    flexDirection: 'column', 
    alignItems: 'stretch', 
    gap: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  title: { 
    ...Typography.header,
    fontSize: 24, 
    fontWeight: '800', 
    color: '#002366', 
    textAlign: 'center', 
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 14,
    lineHeight: 18,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 4
  },
  label: { 
    ...Typography.title,
    fontSize: 14, 
    lineHeight: 14,
    fontWeight: '700', 
    color: '#002366', 
    textAlign: 'left',
    marginBottom: 4
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#CBD5E1', 
    borderRadius: 14, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    marginBottom: 12, 
    width: '100%',
    backgroundColor: '#F8FAFC',
    fontSize: 15,
    color: 'rgb(10, 10, 10)',
    minHeight: 52,
    fontStyle: 'italic'
  },
  scrollView: {
    maxHeight: 280,
    width: '100%',
    marginBottom: 8,
  },
  attendanceList: {
    marginTop: 6,
    gap: 10,
  },
  attendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userInfoCol: {
    flexDirection: 'column',
    gap: 2,
  },
  participantName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#0F172A',
  },
  participantRole: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700'
  },
  emptyText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
  buttonRow: { 
    flexDirection: 'row', 
    gap: 14, 
    width: '100%', 
    marginTop: 8,
    justifyContent: 'space-between'
  },
  confirmBtn: { 
    flex: 1, 
    backgroundColor: '#002366', 
    paddingVertical: 14, 
    borderRadius: 14, 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#002366',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4
  },
  confirmText: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 15 
  },
  cancelBtn: { 
    flex: 1, 
    paddingVertical: 14, 
    borderRadius: 14, 
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  cancelText: { 
    color: '#002366', 
    fontWeight: '700', 
    fontSize: 15 
  }
});