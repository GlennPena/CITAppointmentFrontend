/* 
  AppInput — floating label text input with animated label, focus ring,
  and optional password visibility toggle.
*/

import { useState, useRef, useEffect } from 'react';
import { View, TextInput, Animated, StyleSheet, Pressable, Platform } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

export const AppInput = ({
  label,
  value,
  onChangeText,
  setError,
  secureTextEntry,
  style,
  editable,
  disabledStyleOverride,
  disabledLabelBg,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isForcedDisabledLook = editable === false && !!disabledStyleOverride;

  const flattenedDisabledStyle = disabledStyleOverride
    ? StyleSheet.flatten(disabledStyleOverride)
    : null;
  const resolvedDisabledLabelBg =
    disabledLabelBg || flattenedDisabledStyle?.backgroundColor || '#FFFFFF';

  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    const toValue = isForcedDisabledLook
      ? 0
      : (isFocused || (value && value.length > 0)) ? 1 : 0;

    Animated.timing(animatedIsFocused, {
      toValue,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, isForcedDisabledLook]);

  const isSecure = secureTextEntry && !isPasswordVisible;

  const showHint = !isForcedDisabledLook && (isFocused || (value && value.length > 0));

  const labelStyle = {
    position: 'absolute',
    left: 14,
    top: animatedIsFocused.interpolate({ inputRange: [0, 1], outputRange: [16, -10] }),
    fontSize: animatedIsFocused.interpolate({ inputRange: [0, 1], outputRange: [15, 11] }),
    fontWeight: '600',
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ['#94A3B8', isFocused ? '#003DA5' : '#475569'],
    }),
    backgroundColor: isForcedDisabledLook ? resolvedDisabledLabelBg : '#FFFFFF',
    paddingHorizontal: 4,
    zIndex: 2,
    letterSpacing: 0.2,
  };

  return (
    <View style={styles.container}>
      <Animated.Text style={labelStyle} pointerEvents="none">
        {label === 'Date of Birth' && showHint
          ? 'Date of Birth (YYYY-MM-DD)'
          : label === 'Course' && showHint
            ? 'Course (BSN, STEM, High School)'
            : label === 'Year' && showHint
              ? 'Year / Grade Level'
              : label}
      </Animated.Text>

      <TextInput
        {...props}
        editable={editable}
        placeholderTextColor="#CBD5E1"
        style={[
          styles.input,
          isFocused && !isForcedDisabledLook && styles.inputFocused,
          editable === false && styles.inputDisabled,
          editable === false && disabledStyleOverride,
          (secureTextEntry && value?.length > 0) && { paddingRight: 52 },
          style,
        ]}
        secureTextEntry={isSecure}
        value={value}
        onFocus={() => { setIsFocused(true); if (setError) setError(null); }}
        onBlur={() => setIsFocused(false)}
        onChangeText={(text) => { if (onChangeText) onChangeText(text); if (setError) setError(null); }}
      />

      {secureTextEntry && value?.length > 0 && (
        <Pressable
          style={styles.eyeBtn}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isPasswordVisible
            ? <EyeOff size={19} color="#94A3B8" />
            : <Eye size={19} color="#94A3B8" />}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 10,
    position: 'relative',
  },
  input: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    letterSpacing: 0.2,
    ...(Platform.OS === 'web' && { outlineStyle: 'none' }),
  },
  inputFocused: {
    borderColor: '#003DA5',
    backgroundColor: '#FFFFFF',
    shadowColor: '#003DA5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  inputDisabled: {
    backgroundColor: '#F8FAFC',
    color: '#94A3B8',
    borderColor: '#E2E8F0',
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 16,
    zIndex: 2,
  },
});