/* 
  InlineAlert — Left-border accent alert with icon and message.
  Supports success, error, warning, and info types.
*/

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CONFIGS = {
  error:   { bg: '#FEF2F2', border: '#FCA5A5', accent: '#DC2626', icon: 'alert-circle-outline'     },
  success: { bg: '#F0FDF4', border: '#86EFAC', accent: '#16A34A', icon: 'check-circle-outline'     },
  warning: { bg: '#FFFBEB', border: '#FCD34D', accent: '#D97706', icon: 'alert-outline'             },
  info:    { bg: '#EFF6FF', border: '#93C5FD', accent: '#2563EB', icon: 'information-outline'      },
};

const InlineAlert = ({ message, type = 'info', onClose }) => {
  if (!message) return null;

  const cfg = CONFIGS[type] || CONFIGS.info;

  return (
    <View style={[styles.container, {
      backgroundColor: cfg.bg,
      borderColor: cfg.border,
      borderLeftColor: cfg.accent,
    }]}>
      <MaterialCommunityIcons name={cfg.icon} size={18} color={cfg.accent} style={styles.icon} />

      <Text style={[styles.text, { color: cfg.accent }]} numberOfLines={4}>
        {message}
      </Text>

      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="close" size={16} color={cfg.accent} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginVertical: 8,
  },
  icon: {
    marginTop: 1,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  closeBtn: {
    flexShrink: 0,
    marginTop: 2,
  },
});

export default InlineAlert;