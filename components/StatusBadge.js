/* 
  StatusBadge — displays a colored pill representing appointment/task status.
  Refined design: soft pastel backgrounds, clear icon+label, precise typography.
*/

import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';

const STATUS_CONFIG = {
  approved: { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0', icon: 'check-circle-outline' },
  pending: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', icon: 'clock-outline' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA', icon: 'close-circle-outline' },
  completed: { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE', icon: 'checkbox-marked-circle-outline' },
  rejected: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1', icon: 'minus-circle-outline' },
  expired: { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0', icon: 'calendar-remove-outline' },
  upcoming: { bg: '#EDE9FE', text: '#5B21B6', border: '#DDD6FE', icon: 'calendar-clock' },
  'checked-in': { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0', icon: 'account-check-outline' },
};

const ONGOING_CONFIG = {
  bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA', icon: 'lightning-bolt',
};

export default function StatusBadge({ status, dateTime }) {
  if (!status) return null;

  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = getStyles(isMobile);

  const lowerStatus = status?.toLowerCase();

  // Check ongoing
  let isOngoing = false;
  if (lowerStatus === 'approved' && dateTime) {
    const appointmentDate = new Date(dateTime);
    if (appointmentDate <= new Date()) isOngoing = true;
  }

  const config = isOngoing ? ONGOING_CONFIG : STATUS_CONFIG[lowerStatus];
  if (!config) return null;

  const displayLabel = isOngoing ? 'Ongoing' : status;

  return (
    <View style={[styles.badge, {
      backgroundColor: config.bg,
      borderColor: config.border,
    }]}>
      <MaterialCommunityIcons
        name={config.icon}
        size={12}
        color={config.text}
        style={{ marginRight: 5 }}
      />
      <Text style={[styles.text, { color: config.text }]}>
        {displayLabel.toUpperCase()}
      </Text>
    </View>
  );
}

const getStyles = (isMobile) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: isMobile ? 8 : 10,
    paddingVertical: isMobile ? 3 : 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: isMobile ? 9 : 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
});