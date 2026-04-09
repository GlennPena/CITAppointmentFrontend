import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

export default function Avatar({
  name,
  size = 44,
  backgroundColor = '#2563EB',
  textColor = '#FFFFFF',
  source, // ✅ optional image
  status, // ✅ 'online', 'offline', etc.
  style
}) {

  const getInitials = (text) => {
    if (!text) return "?";

    const parts = text.trim().split(" ").filter(Boolean);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const fontSize = size * 0.42;

  return (
    <View style={[{ width: size, height: size }, style]}>
      
      {/* AVATAR */}
      {source ? (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            }
          ]}
        />
      ) : (
        <View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor,
            }
          ]}
        >
          <Text style={[styles.text, { fontSize, color: textColor }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {/* STATUS INDICATOR */}
      {status && (
        <View
          style={[
            styles.statusDot,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
              backgroundColor:
                status === 'online'
                  ? '#22C55E'
                  : status === 'busy'
                  ? '#F59E0B'
                  : '#94A3B8',
              right: 0,
              bottom: 0,
            }
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 2,
    borderColor: '#FFFFFF',

    // Soft modern shadow
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  image: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  text: {
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  statusDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});