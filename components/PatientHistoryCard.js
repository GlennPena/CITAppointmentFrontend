import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Avatar from './Avatar';

export default function PatientHistoryCard({ patient, onPress }) {
  return (
    <View style={styles.wrapper}>
      <Pressable style={styles.card} android_ripple={{ color: '#E2E8F0' }}>

        {/* HEADER */}
        <View style={styles.headerRow}>
          <Avatar 
            name={patient.name} 
            size={50} 
            backgroundColor="#2563EB" 
          />

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {patient.name}
            </Text>

            <View style={styles.subRow}>
              <Text style={styles.role}>Patient</Text>

              {/* Status Badge */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* DIVIDER */}
        <View style={styles.divider} />

        {/* FOOTER */}
        <View style={styles.footer}>

          {/* Visits */}
          <View style={styles.visitBadge}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="calendar-check" size={14} color="#2563EB" />
            </View>
            <Text style={styles.visitCount}>
              {patient.visitCount} visits
            </Text>
          </View>

          {/* CTA BUTTON */}
          <Pressable onPress={onPress} style={styles.viewBtn}>
            <Text style={styles.viewHistoryText}>View</Text>
            <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
          </Pressable>

        </View>

      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 14,
  },

  card: {
    width: '95%',
    maxWidth: 1500,

    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,

    borderWidth: 1,
    borderColor: '#E2E8F0',

    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },

  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },

  info: { 
    marginLeft: 14, 
    flex: 1,
  },

  name: { 
    fontSize: 17, 
    fontWeight: '800', 
    color: '#0F172A' 
  },

  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },

  role: { 
    fontSize: 13, 
    color: '#64748B', 
    marginRight: 8,
  },

  badge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '700',
  },

  divider: { 
    height: 1, 
    backgroundColor: '#F1F5F9', 
    marginVertical: 16 
  },

  footer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },

  visitBadge: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },

  iconCircle: {
    backgroundColor: '#EFF6FF',
    padding: 6,
    borderRadius: 999,
    marginRight: 6,
  },

  visitCount: { 
    fontSize: 13, 
    color: '#475569', 
    fontWeight: '600' 
  },

  viewBtn: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },

  viewHistoryText: { 
    fontSize: 13, 
    color: '#FFFFFF', 
    fontWeight: '700', 
    marginRight: 4 
  }
});