import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AnimatedPaginationButton = ({ onPress, disabled, iconName }) => {
  const [hovered, setHovered] = useState(false);
  const colorAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: hovered && !disabled ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [hovered, disabled, colorAnim]);

  const bgColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#002366']
  });

  const iconColor = disabled ? '#94A3B8' : (hovered ? '#FFFFFF' : '#002366');

  return (
    <AnimatedPressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.pageButton,
        disabled && styles.pageButtonDisabled,
        { backgroundColor: disabled ? '#F8FAFC' : bgColor }
      ]}
    >
      <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
    </AnimatedPressable>
  );
};

export function PaginationControls({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <View style={styles.paginationContainer}>
      <AnimatedPaginationButton
        onPress={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        iconName="chevron-left"
      />
      <Text style={styles.pageText}>Page {currentPage} of {totalPages}</Text>
      <AnimatedPaginationButton
        onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        iconName="chevron-right"
      />
    </View>
  );
}

export default PaginationControls;

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  pageButton: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pageButtonDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    opacity: 0.5,
  },
  pageText: {
    fontFamily: 'Inter_600SemiBold',
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});
