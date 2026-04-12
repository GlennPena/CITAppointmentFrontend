/* 
  Displays a colored badge representing appointment or task status.
  Color changes dynamically based on status type (approved, pending, etc.).
*/

import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWindowDimensions } from "react-native";

// Background colors for standard statuses
const STATUS_COLORS = {
  approved: { bg: '#DCFCE7', text: '#166534', icon: 'check-circle' },
  pending: { bg: '#FEF9C3', text: '#854d0e', icon: 'clock-outline' },
  cancelled: { bg: '#FEE2E2', text: '#991b1b', icon: 'close-circle' },
  completed: { bg: '#DCFCE7', text: '#166534', icon: 'checkbox-marked-circle' },
  rejected: { bg: '#F1F5F9', text: '#475569', icon: 'minus-circle' },
  expired: { bg: '#F1F5F9', text: '#475569', icon: 'calendar-remove' },
  upcoming: { bg: '#DBEAFE', text: '#1D4ED8', icon: 'calendar-clock' },
  'checked-in': { bg: '#DCFCE7', text: '#15803D', icon: 'account-check' },
};


export default function StatusBadge({ status, dateTime }) {
  if (!status) return null;

  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;
  
  const styles = getStyles(isMobile, isDesktop);

  const lowerStatus = status?.toLowerCase();

  
  // Check if the appointment is currently ONGOING
  let isOngoing = false;
  if (lowerStatus === 'approved' && dateTime) {
    const appointmentDate = new Date(dateTime);
    const now = new Date();
    // If it's approved and the time has already arrived/passed
    if (appointmentDate <= now) {
      isOngoing = true;
    }
  }

  // Return the "ONGOING" UI if the logic above is true
  if (isOngoing) {
    return (
      <View style={styles.ongoingBadge}>
        <Text style={styles.ongoingText}>ONGOING</Text>
      </View>
    );
  }

  // Otherwise, return the standard colored badge
  const statusConfig = STATUS_COLORS[lowerStatus];
  const bgColor = typeof statusConfig === 'object' ? statusConfig.bg : statusConfig;
  const textColor = typeof statusConfig === 'object' ? statusConfig.text : '#FFF';
  
  return (
    <View style={[styles.badge, { backgroundColor: bgColor }]}>
      <MaterialCommunityIcons 
        name={statusConfig.icon} 
        size={14} 
        color={statusConfig.text} 
        style={{ marginRight: 4 }}
      />
      <Text style={[styles.text, { color: textColor }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

const getStyles = (isMobile, isDesktop) => StyleSheet.create({
  badge: { 
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start' 
  },
  text: { 
    fontSize: isMobile ? 10 : 12, 
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: isDesktop ? 1 : isMobile ? 1 : 0.1
  },
  ongoingBadge: { 
    backgroundColor: '#E0F2FE', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: '#7DD3FC',
    alignSelf: 'flex-start' 
  },
  ongoingText: { 
    color: '#0369A1', 
    fontSize: 10, 
    fontWeight: '800' 
  },
});