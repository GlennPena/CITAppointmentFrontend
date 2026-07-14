/*  
  Responsible for displaying a modal that allows faculty members to finalize an appointment by adding outcome and consultation notes.
*/

import { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, StyleSheet } from 'react-native';

import { Typography } from "../styles/theme";


export default function CompleteAppointmentModal({ visible, onClose, onConfirm }) {
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm({
      outcome: outcome.trim() || "Stable", 
      consultation_notes: notes.trim() || "No specific notes provided."
    });
    setOutcome("");
    setNotes("");
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Complete Appointment</Text>
          <Text style={styles.subtitle}>Add final outcome details so this appointment is recorded cleanly.</Text>

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

          <View style={styles.buttonRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={styles.confirmBtn}>
              <Text style={styles.confirmText}>Complete</Text>
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
    lineHeight: 16,
    color: '#97a1af',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 4
  },
  label: { 
    ...Typography.title,
    fontSize: 14, 
    lineHeight: 14,
    fontWeight: '700', 
    color: '#002366', 
    textAlign: 'left' 
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