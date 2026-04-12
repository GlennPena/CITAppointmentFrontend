/* 
	Displays a reusable confirmation dialog for user actions such as 
  delete, cancel, or submit, with optional destructive styling.
*/

import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';


export const ConfirmModal = ({ visible, title, message, onConfirm, onCancel, confirmText = "Confirm", isDestructive = false }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            <Pressable style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            
            <Pressable 
              style={[styles.confirmBtn, isDestructive && { backgroundColor: '#EF4444' }]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 },
  alertBox: { 
    backgroundColor: 'white', 
    borderRadius: 16, 
    padding: 20, 
    width: '100%', 
    maxWidth: 400, 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    letterSpacing: -0.5, 
    marginBottom: 10, 
    color: '#0F172A' 
  },
  message: { 
    fontSize: 14, 
    color: '#64748B', 
    marginBottom: 20 
  },
  buttonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    gap: 12 
  },
  cancelBtn: { 
    paddingVertical: 10, 
    paddingHorizontal: 16 
  },
  cancelText: { 
    color: '#64748B', 
    fontWeight: '600' 
  },
  confirmBtn: { 
    backgroundColor: '#002366', 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 8 
  },
  confirmText: { 
    color: 'white', 
    fontWeight: '700' 
  },
});

