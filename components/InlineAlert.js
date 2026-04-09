/* 
  Displays a small inline success or error message inside the UI.
  Supports optional manual dismiss via close button.
*/

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';


const InlineAlert = ({ message, type, onClose }) => {
  // Do not render anything if no message is provided
  if (!message) return null;

  // Determine whether alert is error or success
  const isError = type === 'error';
  
  // Dynamic styling based on alert type
  const containerStyle = isError 
  ? styles.errorContainer 
  : styles.successContainer;

  const textStyle = isError 
  ? styles.errorText 
  : styles.successText;

  return (
    <View style={[styles.baseContainer, containerStyle]}>
      <View style={styles.messageWrapper}>
        <Text style={[styles.baseText, textStyle]}>{message}</Text>
      </View>
      
      {/* Close Button */}
      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={textStyle}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 20,
  },
  messageWrapper: {
    flex: 1,
  },
  baseText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    marginTop: '0'
  },
  errorText: {
    color: '#DC2626',
  },
  successContainer: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  successText: {
    color: '#1E40AF',
  },
  closeButton: {
    marginLeft: 10,
    padding: 4,
    flexShrink: 0,
    height: 20,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
});

export default InlineAlert;