/* 
  Horizontal scrollable filter chips used to filter data (e.g. status, category).
  Highlights the currently active filter and allows selection via callback.
*/

import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { Typography } from "../styles/theme";


export const StatusFilter = ({ options, activeFilter, onSelect }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
    {options.map(f => (
      <Pressable 
        key={f} 
        style={({ pressed }) => [
          styles.filterChip,
          activeFilter === f && styles.filterChipActive,
          pressed && styles.filterChipPressed,
        ]} 
        onPress={() => onSelect(f)}
      >
        <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
      </Pressable>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  filterBar: { 
    flexDirection: 'row',
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(241, 245, 249, 0.5)',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 10,
  },
  filterChip: { 
    paddingHorizontal: 14, 
    paddingVertical: 8,
    borderRadius: 8, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  filterChipActive: { 
    backgroundColor: '#002366',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1
  },
  filterText: { 
    ...Typography.body,
    fontSize: 14, 
    fontWeight: 'bold',
    color: '#64748B', 
    lineHeight: 18
  },
  filterTextActive: {
    color: '#fff'
  },
});