/*
  StatBox — dashboard metric card with colored left-border accent,
  large number, label, icon, and optional trend indicator.
*/

import { View, Text, StyleSheet, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';
import { useState, useEffect } from 'react';

const AnimatedNumber = ({ value, style }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startValue = 0;
    const duration = 1500;
    const frames = 30;
    const stepTime = Math.abs(Math.floor(duration / frames));
    const increment = value / frames;

    const timer = setInterval(() => {
      startValue += increment;
      if (startValue >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.ceil(startValue));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <Text style={style}>{displayValue}</Text>;
};

const StatBox = ({ label, value, color = '#002366', icon = 'chart-box', trend }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = getStyles(isMobile, width);

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      {/* Icon badge */}
      <View style={[styles.iconBadge, { backgroundColor: color + '18' }]}>
        <MaterialCommunityIcons name={icon} size={isMobile ? 18 : 22} color={color} />
      </View>

      {/* Value */}
      <AnimatedNumber value={value} style={[styles.value, { color }]} />

      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Optional trend */}
      {trend != null && (
        <View style={styles.trendRow}>
          <MaterialCommunityIcons
            name={trend >= 0 ? 'trending-up' : 'trending-down'}
            size={14}
            color={trend >= 0 ? '#059669' : '#DC2626'}
          />
          <Text style={[styles.trendText, { color: trend >= 0 ? '#059669' : '#DC2626' }]}>
            {trend >= 0 ? '+' : ''}{trend}%
          </Text>
        </View>
      )}
    </View>
  );
};

const getStyles = (isMobile, width) => StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    padding: isMobile ? 14 : 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    width: isMobile ? (width / 2) - 22 : 200,
    minHeight: isMobile ? 108 : 130,
    justifyContent: 'space-between',
  },
  iconBadge: {
    width: isMobile ? 36 : 42,
    height: isMobile ? 36 : 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  value: {
    fontSize: isMobile ? 28 : 38,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: isMobile ? 34 : 44,
  },
  label: {
    fontSize: isMobile ? 11 : 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default StatBox;