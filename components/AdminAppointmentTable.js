/* 
  Responsible for displaying a single appointment entry in the admin dashboard.
*/

import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import StatusBadge from './StatusBadge';


export default function AdminAppointmentRow({ item, onDelete, onViewDetails }) {
  
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = getStyles(isMobile, width);

  const dt = new Date(item.date_time);

  return (
    <View style={styles.row}>
      <View style={{ flex: 1.5 }}>
        <Text style={styles.primaryText}>{dt.toLocaleDateString([], { month: 'short', day: 'numeric' })}</Text>
        <Text style={styles.secondaryText}>{dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>

      <View style={{ flex: 2 }}>
        <Text style={styles.primaryText}>{item.student_name}</Text>
        <Pressable onPress={() => onViewDetails(item)}>
          <Text style={styles.linkText}>View Details</Text>
        </Pressable>
      </View>

      <StatusBadge 
          status={item.status} 
          dateTime={item.date_time} 
        />

      <View style={{ flex: 1, alignItems: 'flex-end' }}>
        <Pressable style={styles.delBtn} onPress={() => onDelete(item.id)}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (isMobile, width) => StyleSheet.create({
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingVertical: 18, 
    paddingHorizontal: 20, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 14, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 10, 
    elevation: 2 
  },
  interactiveRow: { 
    opacity: 1 
  },
  header: { 
    backgroundColor: '#F8FAFC', 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9', 
    paddingVertical: 12, 
    paddingHorizontal: 16 
  },
  headerText: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    letterSpacing: 1.2, 
    color: '#94A3B8' 
  },
  cell: { 
    paddingVertical: 16, 
    paddingHorizontal: 24, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  primaryText: { 
    fontSize: isMobile ? 12 : 14, 
    fontWeight: '700', 
    color: '#1E293B' 
  },
  secondaryText: { 
    fontSize: isMobile ? 10 : 12, 
    color: '#64748B', 
    marginTop: 4 
  },
  linkText: { 
    fontSize: isMobile ? 11 : 13, 
    color: '#002366', 
    marginTop: 8, 
    fontWeight: '600' 
  },
  delBtn: { 
    backgroundColor: '#EF4444', 
    padding: 10, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  }
});