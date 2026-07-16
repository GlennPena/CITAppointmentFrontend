/* 
  Responsible for displaying full appointment details
*/

import { View, Text, StyleSheet, Pressable, Platform, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import StatusBadge from './StatusBadge';
import { Typography } from '../styles/theme';


const AppointmentCard = ({ item, children, userRole, onPress }) => {

  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = getStyles(isMobile);

  const dt = new Date(item.date_time);

  const dateString = dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const timeString = dt.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      android_ripple={{ color: '#F1F5F9' }}
    >

      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.serviceHeader}>{item.service || "General Consultation"}</Text>
        <StatusBadge
          status={item.status || "Pending"}
          dateTime={item.date_time}
        />
      </View>

      <View style={styles.divider} />

      {/* FACULTY INFO */}
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="account" size={16} color="#002366" style={styles.icons} />
        <Text style={styles.label}>Faculty:</Text>
        <Text style={styles.facultyName}>{item.faculty_name}</Text>
      </View>

      {/* DATE*/}
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="calendar-month" size={16} color="#002366" style={styles.icons} />
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>{dateString}</Text>
      </View>

      {/* TIME */}
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="clock-outline" size={16} color="#002366" style={styles.icons} />
        <Text style={styles.label}>Time:</Text>
        <Text style={styles.value}>{timeString}</Text>
      </View>

      {/* STUDENT NOTE */}
      <View style={styles.conditionBox}>
        <View style={styles.noteLabelRow}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={16} color="#002366" style={styles.icons} />
          <Text style={styles.studentNoteLabel}>Appointment notes:</Text>
        </View>
        <Text style={styles.conditionText}>{item.condition || "No description provided"}</Text>
      </View>

      {(item.status === "Completed" && userRole === 'faculty') && (
        <View style={styles.historySection}>
          <View style={styles.divider} />

          <Text style={styles.labelTiny}>OUTCOME</Text>
          <Text style={styles.outcomeText}>{item.outcome || "No outcome notes provided"}</Text>

          <Text style={styles.labelTiny}>CONSULTATION NOTES</Text>
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              "{item.consultation_notes || "No specific notes provided."}"
            </Text>
          </View>
        </View>
      )}

      {item.status === "Rejected" && (
        <View style={styles.historySection}>
          <View style={styles.divider} />

          <Text style={[styles.labelTiny, { color: '#EF4444' }]}>REASON FOR DISAPPROVAL</Text>
          <View style={[styles.noteBox, { borderLeftColor: '#EF4444', backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.noteText, { color: '#991B1B' }]}>
              "{item.consultation_notes || "No specific reason provided."}"
            </Text>
          </View>
        </View>
      )}

      {item.status === "Cancelled" && item.consultation_notes && (
        <View style={styles.historySection}>
          <View style={styles.divider} />

          <Text style={[styles.labelTiny, { color: '#EF4444' }]}>REASON FOR CANCELLATION</Text>
          <View style={[styles.noteBox, { borderLeftColor: '#EF4444', backgroundColor: '#FEF2F2' }]}>
            <Text style={[styles.noteText, { color: '#991B1B' }]}>
              "{item.consultation_notes}"
            </Text>
          </View>
        </View>
      )}

      {/* ACTION BUTTONS */}
      <View style={styles.actions}>
        {children}
      </View>
    </Pressable>
  );
};

const getStyles = (isMobile) => StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'column',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    padding: 26,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: { elevation: 1 },
    }),
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: '#F8FAFC',
  },
  hover: {
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderColor: '#DBEAFE'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0
  },
  serviceHeader: {
    ...Typography.title,
    fontSize: isMobile ? 16 : 20,
    fontWeight: 'bold',
    color: '#002366',
    lineHeight: 26,
    letterSpacing: -0.5,
    flex: 1
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 10,
    marginTop: 0
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center'
  },
  icons: {
    marginRight: 10
  },
  label: {
    ...Typography.body,
    width: 72,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  facultyName: {
    ...Typography.body,
    fontSize: isMobile ? 15 : 16,
    fontWeight: 'bold',
    color: '#0F172A',
    lineHeight: 18
  },
  value: {
    ...Typography.body,
    fontSize: isMobile ? 13 : 15,
    color: '#334155'
  },
  conditionBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  noteLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  studentNoteLabel: {
    ...Typography.body,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  conditionText: {
    fontSize: 15,
    color: '#475569',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    ...Typography.label,
    marginTop: 12,
  },
  historySection: {
    marginTop: 8
  },
  labelTiny: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    marginTop: 8
  },
  outcomeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 2,
    lineHeight: 18
  },
  noteBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#0052FF'
  },
  noteText: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic'
  },
});

export default AppointmentCard;