/* 
  StatusFilter — horizontal scrollable pill-chip filter bar.
  Active chip uses brand navy, inactive chips use a subtle slate style.
*/

import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';

export const StatusFilter = ({ options, activeFilter, onSelect }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.bar}
    contentContainerStyle={styles.content}
  >
    {options.map(f => (
      <Pressable
        key={f}
        style={({ pressed }) => [
          styles.chip,
          activeFilter === f && styles.chipActive,
          pressed && styles.chipPressed,
        ]}
        onPress={() => onSelect(f)}
      >
        {activeFilter === f && (
          <View style={styles.activeDot} />
        )}
        <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
          {f}
        </Text>
      </Pressable>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  bar: {
    flexGrow: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#002366',
    borderColor: '#002366',
    shadowColor: '#002366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  chipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9A84C',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    letterSpacing: 0.2,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});