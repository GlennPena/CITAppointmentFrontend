import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWindowDimensions } from 'react-native';

const StatBox = ({ label, value, color = "#3B82F6", icon = "chart-box" }) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const styles = getStyles(isMobile, width);

  return (
    <View style={styles.card}>
      
      {/* Top Row (Label + Icon) */}
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
          <MaterialCommunityIcons name={icon} size={isMobile ? 14 : 18} color={color} />
        </View>
      </View>

      {/* Value */}
      <Text style={[styles.value, { color }]}>{value}</Text>

      {/* Accent Line */}
      <View style={[styles.bar, { backgroundColor: color }]} />
    </View>
  );
};

const getStyles = (isMobile, width) => StyleSheet.create({
  card: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFBFF',
    padding: isMobile ? 14 : 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
    width: isMobile ? (width / 2) - 20 : 210,
    minHeight: isMobile ? 110 : 138,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: isMobile ? 6 : 12,
    marginBottom: isMobile ? 8 : 12,
  },

  label: {
    fontSize: isMobile ? 11 : 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  value: {
    fontSize: isMobile ? 22 : 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.75,
    marginTop: 8,
  },

  trend: {
    fontSize: isMobile ? 10 : 12,
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },

  trendPositive: {
    color: '#16A34A',
  },

  trendNegative: {
    color: '#DC2626',
  },

  iconContainer: {
    padding: isMobile ? 6 : 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  bar: {
    height: isMobile ? 4 : 5,
    borderRadius: 99,
    marginTop: isMobile ? 12 : 18,
  },
});

export default StatBox;