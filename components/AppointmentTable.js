/* 
	Renders a single row in the appointments table on the DoctorDashboard screen.
*/

import { View, Text, StyleSheet, Pressable } from 'react-native';
import StatusBadge from './StatusBadge';
import { useWindowDimensions } from "react-native";

export default function AppointmentRow({ item, onAction, onViewDetails, onCompletePress, onDelete }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const styles = getStyles(isMobile);

  const status = item.status?.toLowerCase();
	
  const appointmentDate = new Date(item.date_time);
  const now = new Date();

  // Status is approved AND time has arrived
  const isTimeArrived = appointmentDate <= now;
  const isOngoing = status === 'approved' && isTimeArrived;
  
  // Only allow approve/reject if it's NOT in the past
  const isPast = appointmentDate < now;

  return (
    <View style={styles.tableRow}>
			<Text style={[styles.cell, { flex: 1 }]}>
        {new Date(item.date_time).toLocaleDateString([], { month: 'short',  day: '2-digit', year: 'numeric' })}
      </Text>

      <Text style={[styles.cell, { flex: 1 }]}>
        {new Date(item.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      
      <View style={{ flex: 2 }}>
        <Text style={styles.patientName}>{item.patient_name}</Text>
        <Pressable onPress={onViewDetails} hitSlop={10}>
          <Text style={styles.viewLink}>View Details</Text>
        </Pressable>
      </View>

      <Text style={[styles.cell, { flex: 2 }]}>{item.service}</Text>
      
      <View style={{ flex: 1.5 }}>
        {isOngoing ? (
          <View style={styles.ongoingBadge}>
            <Text style={styles.ongoingText}>ONGOING</Text>
          </View>
        ) : (
          <StatusBadge status={item.status} />
        )}
      </View>

      <View style={styles.actionCell}>
        {/* ✅ PENDING → Approve / Reject */}
        {status === 'pending' && !isPast && (
          <>
            <Pressable style={styles.approveBtn} onPress={() => onAction(item.id, 'Approved')}>
              <Text style={styles.btnText}>✓</Text>
            </Pressable>

            <Pressable style={styles.rejectBtn} onPress={() => onAction(item.id, 'Rejected')}>
              <Text style={styles.btnText}>✕</Text>
            </Pressable>
          </>
        )}

        {/* ✅ APPROVED → Cancel + Complete */}
        {status === 'approved' && (
          <>
            {/* Cancel (Doctor emergency cancel) */}
            <Pressable 
              style={styles.cancelBtn} 
              onPress={() => onAction(item.id, 'Cancelled')}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </Pressable>

            {/* Complete (only when time arrived OR allow always if you want) */}
            {isTimeArrived && (
              <Pressable 
                style={styles.completeBtn} 
                onPress={() => onCompletePress(item)}
              >
                <Text style={styles.completeBtnText}>Complete</Text>
              </Pressable>
            )}
          </>
        )}

        {/* ✅ DELETE (Completed, Cancelled, Rejected, Expired) */}
        {['completed', 'cancelled', 'rejected', 'expired'].includes(status) && (
          <Pressable 
            style={styles.deleteBtn} 
            onPress={() => onDelete(item.id)}
          >
            <Text style={styles.btnText}>Delete</Text>
          </Pressable>
        )}

        {/* ✅ FALLBACK */}
        {!['pending', 'approved', 'completed', 'cancelled', 'rejected', 'expired'].includes(status) && (
          <Text style={styles.completedLabel}>No Actions</Text>
        )}
      </View>
    </View>
  );
}

const getStyles = (isMobile) => StyleSheet.create({
  tableRow: { 
    flexDirection: isMobile ? 'column' : 'row',
    flexWrap: 'wrap',
    textAlign: 'center',
    justifyContent: 'space-between', 
    paddingVertical: 16, 
    paddingHorizontal: 14, 
    gap: 10,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  cell: { fontSize: 14, color: '#334155', lineHeight: 20 },
  patientName: { fontSize: isMobile ? 14 : 15, fontWeight: '700', color: '#0F172A', marginBottom: 4, },
  viewLink: { fontSize: 13, color: '#0052FF', marginTop: 4, fontWeight: '600' },
  actionCell: { flex: 2, flexDirection: 'row', flexWrap: 'wrap', justifyContent: isMobile ? 'flex-start' : 'flex-end', gap: 10, marginTop: isMobile ? 8 : 0, alignItems: 'center' },
  approveBtn: { backgroundColor: '#10B981', width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rejectBtn: { backgroundColor: '#EF4444', width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: '800', fontSize: isMobile ? 13 : 14 },
  
  // Styles for Ongoing & Complete
  ongoingBadge: { backgroundColor: '#E0F2FE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#7DD3FC', alignSelf: isMobile ? 'flex-start' : 'auto', },
  ongoingText: { color: '#0369A1', fontSize: isMobile ? 10 : 11, fontWeight: '800', letterSpacing: 0.5 },
  completeBtn: { backgroundColor: '#0052FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, minWidth: 90, alignItems: 'center' },
  completeBtnText: { color: '#FFF', fontSize: isMobile ? 12 : 13, fontWeight: '700' },
  completedLabel: { color: '#64748B', fontSize: isMobile ? 12 : 13, textAlign: 'right', minWidth: 70 },

cancelBtn: {
  backgroundColor: '#F59E0B',
  paddingHorizontal: 10,
  paddingVertical: 8,
  borderRadius: 10,
},

deleteBtn: {
  backgroundColor: '#1E293B',
  paddingHorizontal: 10,
  paddingVertical: 8,
  borderRadius: 10,
},
});