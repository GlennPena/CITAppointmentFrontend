/*  
  Responsible for displaying a student history summary card including avatar, 
  student info, visit count, and a button to view detailed history.
*/

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { Typography } from "../styles/theme";

export default function StudentHistoryCard({ student, onPress }) {
  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.card} android_ripple={{ color: '#E2E8F0' }}>

        <View style={styles.headerRow}>
          <Avatar 
            name={student.name} 
            size={50} 
            backgroundColor="#002366" 
          />

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {student.name}
            </Text>

            <View style={styles.subRow}>
              <Text style={styles.role}>Student</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.footer}>

          <View style={styles.visitBadge}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="calendar-check" size={16} color="#64748B" />
            </View>
            <Text style={styles.visitCount}>
              {student.visitCount} visits
            </Text>
          </View>

          <Pressable onPress={onPress} style={styles.viewBtn}>
            <Text style={styles.viewHistoryText}>View Details</Text>
          </Pressable>

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
  info: { 
    marginLeft: 14, 
    flex: 1,
  },
  name: { 
    ...Typography.title,
    fontSize: 17, 
    fontWeight: '600', 
    color: '#002366' 
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  role: { 
    ...Typography.body,
    fontSize: 13, 
    color: '#64748B', 
    marginRight: 8,
    lineHeight: 16,
  },
  divider: { 
    height: 1, 
    backgroundColor: '#82a5e4', 
    marginVertical: 16, 
  },
  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  visitBadge: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  iconCircle: {
    padding: 6,
    borderRadius: 999,
    marginRight: 3,
  },
  visitCount: { 
    ...Typography.body,
    fontSize: 13, 
    color: '#64748B', 
    fontWeight: '600',
    lineHeight: 14,
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
