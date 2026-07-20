import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography } from "../styles/theme";

export default function MeetingHistoryCard({ meeting, onPress }) {
  const formattedDate = new Date(meeting.date_time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(meeting.date_time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const participantCount = meeting.participants ? meeting.participants.length : 0;

  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.card} android_ripple={{ color: '#E2E8F0' }} onPress={onPress}>
        <View style={styles.headerRow}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-group" size={24} color="#FFFFFF" />
          </View>

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {meeting.service}
            </Text>
            <Text style={styles.host} numberOfLines={1}>
              Hosted by {meeting.faculty_name}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="account-multiple-outline" size={16} color="#64748B" />
            <Text style={styles.detailText}>{participantCount} Invited</Text>
          </View>
          {meeting.status === "Completed" && (
            <View style={styles.viewBtn}>
              <Text style={styles.viewHistoryText}>View Report</Text>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    width: '100%',
    marginBottom: 14,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#002366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { 
    marginLeft: 14, 
    flex: 1,
  },
  title: { 
    ...Typography.title,
    fontSize: 17, 
    fontWeight: '600', 
    color: '#002366' 
  },
  host: {
    ...Typography.body,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: { 
    height: 1, 
    backgroundColor: '#82a5e4', 
    marginVertical: 16, 
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    ...Typography.body,
    fontSize: 13,
    color: '#64748B',
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    gap: 12,
  },
  agendaText: {
    ...Typography.body,
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
    fontStyle: 'italic',
  },
  viewBtn: { 
    flexDirection: 'row', 
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  viewHistoryText: { 
    ...Typography.body,
    fontSize: 14, 
    color: '#002366', 
    fontWeight: '700', 
    marginRight: 4, 
    lineHeight: 14,
  }
});
