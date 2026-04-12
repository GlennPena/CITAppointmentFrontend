import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';

import StatusBadge from './StatusBadge';
import { ConfirmModal } from './ConfirmModal';
import { Typography } from '../styles/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';


export default function AppointmentRow({ item, onAction, onViewDetails, onCompletePress, onDelete }) {

  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;
  const styles = getStyles(isMobile, isDesktop);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', onConfirm: () => {} });

  const triggerConfirm = (title, message, confirmAction, isDestructive = false) => {
    setModalConfig({
      title,
      message,
      onConfirm: () => {
        confirmAction();
        setConfirmVisible(false);
      },
      isDestructive
    });
    setConfirmVisible(true);
  };

  const status = item.status?.toLowerCase();
  const appointmentDate = new Date(item.date_time);
  const now = new Date();

  // Status is approved AND time has arrived
  const isTimeArrived = appointmentDate <= now;
  const isOngoing = status === 'approved' && isTimeArrived;
  
  // Only allow approve/reject if it is NOT in the past
  const isPast = appointmentDate < now;

  return (
    <View style={styles.tableRow}>

      <View style={[styles.cell, { flex: 1.5 }]}>
        <Text style={styles.cellText}>
          {new Date(item.date_time).toLocaleDateString([], { month: 'short',  day: '2-digit', year: 'numeric' })}
        </Text>
      </View>

      <View style={[styles.cell, { flex: 1.5 }]}>
        <Text style={styles.cellText}>
          {new Date(item.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      
      <View style={[styles.cell, { flex: 2 }]}>
        <Text style={[styles.cellText, styles.patientName]}>{item.patient_name}</Text>
        <Pressable onPress={onViewDetails} hitSlop={10}>
          <Text style={[styles.cellText, styles.viewLink]}>View Details</Text>
        </Pressable>
      </View>

      <View style={[styles.cell, { flex: 2 }]}>
        <Text style={styles.cellText}>{item.service}</Text>
      </View>

      <View style={[styles.cell, { flex: 2, textTransform: 'capitalize'}]}>
        <Text style={styles.cellText}>{item.condition}</Text>
      </View>
      
      <View style={{ flex: 1.5 }}>
        {isOngoing ? (
          <View style={styles.ongoingBadge}>
            <MaterialCommunityIcons name="clock-fast" size={14} color="#FFF" />
            <Text style={styles.ongoingText}>ONGOING</Text>
          </View>
        ) : (
          <Text style={{ fontSize: isDesktop ? 12 : 8}}>
            <StatusBadge status={item.status}/>
          </Text>
        )}
      </View>

      <View style={styles.actionCell}>
        {/* PENDING → Approve / Reject */}
        {status === 'pending' && !isPast && (
          <>
            <Pressable style={styles.approveBtn} onPress={() => onAction(item.id, 'Approved')}>
              <Text style={styles.btnTextActions}>✓</Text>
            </Pressable>

            <Pressable 
              style={styles.rejectBtn} 
              onPress={() => triggerConfirm(
                "Reject Appointment", 
                `Are you sure you want to reject ${item.patient_name}'s request?`,
                () => onAction(item.id, 'Rejected'),
                true
              )}
            >
              <Text style={styles.btnTextActions}>✕</Text>
            </Pressable>
          </>
        )}

        {/* APPROVED → Cancel + Complete */}
        {status === 'approved' && (
          <>
            {!isOngoing && (
              <Pressable 
                style={styles.cancelBtn} 
                onPress={() => triggerConfirm(
                  "Cancel Appointment", 
                  "Are you sure you want to cancel this approved appointment?",
                  () => onAction(item.id, 'Cancelled'),
                  true
                )}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </Pressable>
            )}

            {/* Complete (only when time arrived) */}
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

        {/* DELETE (Completed, Cancelled, Rejected, Expired) */}
        {['completed', 'cancelled', 'rejected', 'expired'].includes(status) && (
          <Pressable 
            style={styles.deleteBtn} 
            onPress={() => triggerConfirm(
              "Delete Record", 
              "This will permanently remove this appointment record. Continue?",
              () => onDelete(item.id),
              true
            )}
          >
            <Text style={styles.btnText}>Delete</Text>
          </Pressable>
        )}

        {!['pending', 'approved', 'completed', 'cancelled', 'rejected', 'expired'].includes(status) && (
          <Text style={styles.completedLabel}>No Actions</Text>
        )}
      </View>

      <ConfirmModal 
        visible={confirmVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setConfirmVisible(false)}
        isDestructive={modalConfig.isDestructive}
        confirmText={modalConfig.title.includes("Cancel") ? "Yes, Cancel Appointment" : "Confirm"}
      />
    </View>
  );
}

const getStyles = (isMobile, isDesktop) => StyleSheet.create({
  tableRow: { 
    flexDirection: 'row',
    flexWrap: 'nowrap',
    textAlign: 'center',
    justifyContent: 'space-between', 
    paddingVertical: 16, 
    paddingHorizontal: 14, 
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
    width: '100%',
  },
  cell: { 
    paddingHorizontal: 5,
    minWidth: (!isMobile && !isDesktop) ? 120 : 'auto',
  },
  cellText: {
    ...Typography.body,
    fontSize: 14, 
    lineHeight: 20,
    fontWeight: '700',
  },
  patientName: { 
    color: '#0F172A', 
  },
  viewLink: { 
    color: '#002366', 
    marginTop: 1, 
  },
  actionCell: { 
    flex: 2, 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-end', 
    gap: 10, 
    marginTop: 0, 
    alignItems: 'center' 
  },
  approveBtn: { 
    backgroundColor: '#10B981', 
    width: 34, 
    height: 34, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  rejectBtn: { 
    backgroundColor: '#EF4444', 
    width: 34, height: 34, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  btnText: { 
    ...Typography.label,
    color: '#FFF', 
    fontWeight: '800', 
    fontSize: isMobile ? 10 : 12, 
    fontWeight: '700',
    borderRadius: 12,
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  btnTextActions: {
    color: '#FFF', 
    fontWeight: '800', 
    fontSize: isMobile ? 10 : 12, 
    fontWeight: '700',
    borderRadius: 10,
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  ongoingBadge: {
    backgroundColor: '#002366', 
    paddingHorizontal: 12, 
    paddingVertical: 4, 
    borderRadius: 16, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.3)', 
    alignSelf: 'center', 
    width: 100,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  ongoingText: { 
    ...Typography.body,
    color: '#FFF', 
    fontSize: isMobile ? 10 : 11, 
    fontWeight: '800', 
    letterSpacing: 1,
    paddingLeft: 6
  },
  completeBtn: { 
    backgroundColor: '#002366', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    width: 100,
    alignItems: 'center' 
  },
  completeBtnText: { 
    ...Typography.label,
    color: '#FFF', 
    fontSize: isMobile ? 10 : 12, 
    fontWeight: '700',
    borderRadius: 10,
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  completedLabel: { 
    color: '#64748B', 
    fontSize: isMobile ? 12 : 13, 
    textAlign: 'right', 
    minWidth: 70 
  },

  cancelBtn: {
    ...Typography.label,
    backgroundColor: '#EF4444',
    letterSpacing: 0.1,
    borderRadius: 10,
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    width: 100,
    alignItems: 'center' 
  },
  deleteBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    width: 100,
    alignItems: 'center' 
  },
});