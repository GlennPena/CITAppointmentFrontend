/*
  Displays a temporary animated notification (success or error)
  that fades in, stays visible briefly, then fades out automatically.
*/

import { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const Toast = ({ message, visible, onHide, type = 'success' }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  
  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      translateY.setValue(-20);
      
      Animated.sequence([
        // Fade In
        Animated.timing(opacity, { 
          toValue: 1, 
          duration: 400, 
          useNativeDriver: true 
        }),
        Animated.timing(translateY, { toValue: 0, duration: 400, useNativeDriver: true }),

        // Wait
        Animated.delay(2500),

        // Fade Out
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -20, duration: 400, useNativeDriver: true }),
        ]),

      ]).start(() => {
        onHide();
      });
    }
  }, [visible]);

  if (!visible) return null;

  const iconName = type === 'success' ? 'check-circle' : 'alert-circle';

  return (
    <Animated.View style={[
      styles.container, 
      { opacity, transform: [{ translateY }] },
      type === 'error' ? styles.error : styles.success
    ]}>

      <MaterialCommunityIcons name={iconName} size={24} color="#FFF" />
      <Text style={styles.text}>{message}</Text>

    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12, 
    
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  success: { backgroundColor: '#002366' },
  error: { backgroundColor: '#991b1b' },
  text: { 
    color: '#FFF', 
    fontWeight: '700', 
    fontSize: 14,
    flex: 1, 
    letterSpacing: 0.5, 
  },
  progress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 2
  }
});