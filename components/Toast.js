import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DURATION = 3500;

export const Toast = ({ message, visible, onHide, type = 'success' }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const translateY = useRef(new Animated.Value(-120)).current;
  const translateX = useRef(new Animated.Value(400)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const scale      = useRef(new Animated.Value(0.85)).current;
  const progress   = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      progress.setValue(1);
      translateY.setValue(-120);
      translateX.setValue(isMobile ? 0 : 400);
      opacity.setValue(0);
      scale.setValue(0.85);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 9,
        }),
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 9,
        }),
      ]).start();

      Animated.timing(progress, {
        toValue: 0,
        duration: DURATION,
        useNativeDriver: false,
      }).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -120,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: isMobile ? 0 : 400,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.85,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, DURATION);

      return () => clearTimeout(timer);
    }
  }, [visible, isMobile]);

  if (!visible) return null;

  const config = type === 'error'
    ? { icon: 'alert-circle-outline', accent: '#EF4444', bg: '#1E293B' }
    : type === 'warning'
    ? { icon: 'alert-outline',         accent: '#F59E0B', bg: '#1E293B' }
    : { icon: 'check-circle-outline',  accent: '#10B981', bg: '#002366' };

  return (
    <Animated.View style={[
      styles.container,
      isMobile ? styles.containerMobile : styles.containerDesktop,
      {
        backgroundColor: config.bg,
        opacity,
        transform: [
          { translateY },
          { translateX },
          { scale }
        ]
      }
    ]}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: config.accent }]} />

      {/* Icon */}
      <View style={[styles.iconWrap, { backgroundColor: config.accent + '22' }]}>
        <MaterialCommunityIcons name={config.icon} size={22} color={config.accent} />
      </View>

      {/* Message */}
      <Text style={styles.text} numberOfLines={2}>{message}</Text>

      {/* Progress bar */}
      <Animated.View style={[
        styles.progressBar,
        {
          backgroundColor: config.accent,
          width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
        }
      ]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 14,
  },
  containerDesktop: {
    top: 24,
    right: 24,
    width: 360,
  },
  containerMobile: {
    top: 16,
    left: 16,
    right: 16,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  text: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    borderRadius: 2,
    opacity: 0.6,
  },
});