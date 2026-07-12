/* 
  Responsible for creating input field with animated floating label, validation handling, and optional password visibility toggle.
*/

import { useState, useRef, useEffect } from 'react';
import { View, TextInput, Animated, StyleSheet, Pressable } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { Typography } from "../styles/theme";

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

  // Only forces the "default/unfocused" look when this input is explicitly
  // marked disabled via disabledStyleOverride (e.g. Academic Info in
  // RegistrationScreen). Other screens using editable={false} without this
  // prop keep their existing floating-label behavior untouched.
  const isForcedDisabledLook = editable === false && !!disabledStyleOverride;

  // Auto-pull the backgroundColor from disabledStyleOverride so the label
  // always matches the field, without needing a second prop kept in sync.
  const flattenedDisabledStyle = disabledStyleOverride
    ? StyleSheet.flatten(disabledStyleOverride)
    : null;
  const resolvedDisabledLabelBg =
    disabledLabelBg || flattenedDisabledStyle?.backgroundColor || '#ffffff';
  
  const animatedIsFocused = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    const toValue = isForcedDisabledLook
      ? 0
      : (isFocused || (value && value.length > 0)) ? 1 : 0;

    Animated.timing(animatedIsFocused, {
      toValue,
      duration: 200,
      useNativeDriver: false, 
    }).start();
  }, [isFocused, value, isForcedDisabledLook]);

  const isSecure = secureTextEntry && !isPasswordVisible;

  const labelStyle = {
    ...Typography.body,
    position: 'absolute',
    left: 16,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [14, -12],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [15, 12], 
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: ['#94A3B8', '#0F172A'], 
    }),
    backgroundColor: isForcedDisabledLook ? resolvedDisabledLabelBg : '#ffffff', 
    paddingHorizontal: 6,
    zIndex: 2,
  };

  const showHint = !isForcedDisabledLook && (isFocused || (value && value.length > 0));
  
  return (
    <View style={styles.container}>
      <Animated.Text style={labelStyle} pointerEvents="none">
        {label === "Date of Birth" && showHint 
          ? "Date of Birth (YYYY-MM-DD)" 
        : label === "Course" && showHint
          ? "Course (BSN, STEM, High School)"
        : label === "Year" && showHint
          ? "Year / Grade Level"
        : label}
      </Animated.Text>

      <TextInput
        {...props}
        editable={editable}
        placeholderTextColor="#94A3B8"
        style={[
          styles.defaultInput,
          isFocused && !isForcedDisabledLook && styles.focus,
          editable === false && { backgroundColor: '#ffffff', color: '#64748B' },
          editable === false && disabledStyleOverride,
          style,
          (secureTextEntry && value?.length > 0) && { paddingRight: 56 }
          
        ]}
        secureTextEntry={isSecure}
        value={value}
        onFocus={() => {
          setIsFocused(true);
          if (setError) setError(null);
        }}
        onBlur={() => setIsFocused(false)}
        onChangeText={(text) => {
          if (onChangeText) onChangeText(text);
          if (setError) setError(null);
        }}
      />

      {secureTextEntry && value?.length > 0 && (
        <Pressable 
          style={styles.iconContainer} 
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          {isPasswordVisible ? (
            <EyeOff size={20} color="#64748B" />
          ) : (
            <Eye size={20} color="#64748B" />
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
    position: 'relative',
  },
  defaultInput: {
    ...Typography.body,
    width: '100%',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0d8d8',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  focus: {
    ...Typography.body,
    borderColor: '#ffffff', 
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    letterSpacing: 0.3,
  },
  iconContainer: {
    position: 'absolute',
    right: 12,
    top: 15,
    zIndex: 2,
  },
});