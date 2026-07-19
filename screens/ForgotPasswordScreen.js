import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  Platform,
  ScrollView,
  Animated,
  ImageBackground,
} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppInput } from "../components/AppInput";
import { Toast } from "../components/Toast";
import api from "../utils/api";
import { Colors, Radius, Typography, Shadows } from "../styles/theme";

// Float Orb matching Login/Registration
const Orb = ({ style, delay = 0 }) => {
  const [translateY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: 15, duration: 4000, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -15, duration: 4000, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    );
    const timeout = setTimeout(() => float.start(), delay);
    return () => {
      clearTimeout(timeout);
      float.stop();
    };
  }, [delay, translateY]);

  return (
    <Animated.View style={[{
      position: 'absolute',
      borderRadius: 999,
      opacity: 0.15,
    }, style, { transform: [{ translateY }] }]} />
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const HoverScaleItem = ({ children, style, scaleTo = 1.05, withShine = false }) => {
  const [scale] = useState(() => new Animated.Value(1));
  const [shineAnim] = useState(() => new Animated.Value(-1));
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) {
      Animated.spring(scale, { toValue: scaleTo, useNativeDriver: Platform.OS !== 'web' }).start();
      if (withShine) {
        shineAnim.setValue(-1);
        Animated.timing(shineAnim, {
          toValue: 2,
          duration: 600,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      }
    } else {
      Animated.spring(scale, { toValue: 1, useNativeDriver: Platform.OS !== 'web' }).start();
      if (withShine) shineAnim.stopAnimation();
    }
  }, [isHovered, scale, shineAnim, scaleTo, withShine]);

  const translateX = shineAnim.interpolate({
    inputRange: [-1, 2],
    outputRange: [-150, 250],
  });

  return (
    <AnimatedPressable
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[style, { transform: [{ scale }], position: 'relative', overflow: withShine ? 'hidden' : 'visible' }]}
    >
      {children}
      {withShine && isHovered && (
        <Animated.View style={{
          position: 'absolute',
          top: 0, bottom: 0, width: 40,
          backgroundColor: 'rgba(255,255,255,0.3)',
          transform: [{ skewX: '-20deg' }, { translateX }],
        }} />
      )}
    </AnimatedPressable>
  );
};

const ShineButton = ({ onPress, loading, styles, text }) => {
  const [hovered, setHovered] = useState(false);
  const shineAnim = useState(() => new Animated.Value(-1))[0];
  const scale = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    if (hovered) {
      Animated.spring(scale, { toValue: 1.05, useNativeDriver: true }).start();
      shineAnim.setValue(-1);
      Animated.timing(shineAnim, {
        toValue: 2,
        duration: 450,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
      shineAnim.stopAnimation();
      shineAnim.setValue(-1);
    }
  }, [hovered, shineAnim, scale]);

  const translateX = shineAnim.interpolate({
    inputRange: [-1, 2],
    outputRange: [-150, 450],
  });

  return (
    <AnimatedPressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      disabled={loading}
      style={[styles.submitBtn, loading && { opacity: 0.7 }, { transform: [{ scale }], paddingVertical: 0, paddingHorizontal: 0, overflow: 'hidden' }]}
    >
      <LinearGradient
        colors={['#003DA5', '#001E5C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ width: '100%', alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>{text}</Text>
        )}
        {hovered && (
          <Animated.View style={{
            position: 'absolute',
            top: 0, left: 0, bottom: 0, width: 120,
            transform: [{ translateX }, { skewX: '-25deg' }],
          }}>
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
};

export default function ForgotPasswordScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const entryAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const entryScale = entryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.99, 1],
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ message: "", type: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleRequestOTP = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setAlertConfig({ message: "Email address is required.", type: "error" });
      return;
    }
    if (!cleanEmail.toLowerCase().endsWith("@ua.edu.ph")) {
      setAlertConfig({ message: "Only @ua.edu.ph email addresses are allowed.", type: "error" });
      return;
    }

    setLoading(true);
    setAlertConfig({ message: "", type: "" });
    try {
      const response = await api.post("forgot-password/request-otp/", { email: cleanEmail.toLowerCase() });
      setAlertConfig({ message: response.data.message || "OTP code sent to email.", type: "success" });
      setTimeout(() => {
        setCurrentStep(2);
      }, 1200);
    } catch (error) {
      const errMsg = error.response?.data?.error || "Failed to send reset code.";
      setAlertConfig({ message: errMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setAlertConfig({ message: "Verification code is required.", type: "error" });
      return;
    }

    setLoading(true);
    setAlertConfig({ message: "", type: "" });
    try {
      const response = await api.post("forgot-password/verify-otp/", {
        email: email.trim().toLowerCase(),
        otp: cleanOtp
      });
      setAlertConfig({ message: response.data.message || "Code verified successfully.", type: "success" });
      setTimeout(() => {
        setCurrentStep(3);
      }, 1200);
    } catch (error) {
      const errMsg = error.response?.data?.error || "Invalid or expired verification code.";
      setAlertConfig({ message: errMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setAlertConfig({ message: "Password fields are required.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setAlertConfig({ message: "Password must be at least 6 characters.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setAlertConfig({ message: "Passwords do not match.", type: "error" });
      return;
    }

    setLoading(true);
    setAlertConfig({ message: "", type: "" });
    try {
      const response = await api.post("forgot-password/reset-password/", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        new_password: newPassword
      });
      setAlertConfig({ message: response.data.message || "Password reset successfully.", type: "success" });
      setTimeout(() => {
        navigation.navigate("Login");
      }, 1500);
    } catch (error) {
      const errMsg = error.response?.data?.error || "Failed to reset password.";
      setAlertConfig({ message: errMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.formContent}>
            <Text style={styles.cardTitle}>Reset Password</Text>
            <Text style={styles.cardSubtitle}>Enter your UA institutional email to receive a password reset verification code.</Text>
            <View style={[styles.inputSection, isMobile && { gap: 2 }]}>
              <AppInput
                label="Institutional Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <ShineButton
              onPress={handleRequestOTP}
              loading={loading}
              styles={styles}
              text="Send Verification Code"
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.formContent}>
            <Text style={styles.cardTitle}>Enter Code</Text>
            <Text style={styles.cardSubtitle}>We sent a 6-digit OTP code to <Text style={styles.emailHighlight}>{email}</Text>. Enter the code below.</Text>
            <View style={[styles.inputSection, isMobile && { gap: 2 }]}>
              <AppInput
                label="6-Digit Verification Code"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
              />
            </View>
            <ShineButton
              onPress={handleVerifyOTP}
              loading={loading}
              styles={styles}
              text="Verify Code"
            />
            <Pressable onPress={() => setCurrentStep(1)} style={styles.backStepLink}>
              <Text style={styles.backStepText}>Resend Code</Text>
            </Pressable>
          </View>
        );
      case 3:
        return (
          <View style={styles.formContent}>
            <Text style={styles.cardTitle}>New Password</Text>
            <Text style={styles.cardSubtitle}>Set a secure new password for your account.</Text>
            <View style={[styles.inputSection, isMobile && { gap: 2 }]}>
              <AppInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <AppInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
            <ShineButton
              onPress={handleResetPassword}
              loading={loading}
              styles={styles}
              text="Reset Password"
            />
          </View>
        );
      default:
        return null;
    }
  };

  const renderStepIndicators = () => (
    <View style={[styles.indicatorRow, isMobile && { justifyContent: 'center', marginTop: 12 }]}>
      {[1, 2, 3].map((step) => (
        <View
          key={step}
          style={[
            styles.dot,
            step === currentStep && styles.dotActive,
            step < currentStep && styles.dotCompleted
          ]}
        />
      ))}
    </View>
  );

  if (isMobile) {
    return (
      <Animated.View style={{ flex: 1, opacity: entryAnim, transform: [{ scale: entryScale }] }}>
        <View style={styles.mobileRoot}>
          <Toast
            visible={!!alertConfig.message}
            message={alertConfig.message}
            type={alertConfig.type}
            onHide={() => setAlertConfig({ message: "", type: "" })}
          />

          <View style={styles.mobileHero}>
            <Orb style={[styles.mobileHeroOrb, { opacity: 1 }]} delay={0} />
            <Orb style={[styles.mobileHeroOrb, { width: 160, height: 160, borderRadius: 80, top: undefined, bottom: -50, left: -50, right: undefined, opacity: 1 }]} delay={1200} />

            <View style={styles.mobileLogoRow}>
              <HoverScaleItem>
                <Image source={require('../assets/ua-logo.png')} style={styles.mobileUaLogo} resizeMode="contain" />
              </HoverScaleItem>
              <HoverScaleItem>
                <Image source={require('../assets/cit-logo.png')} style={styles.mobileCitLogo} resizeMode="contain" />
              </HoverScaleItem>
            </View>
            <Text style={styles.mobileAppName}>CIT APPOINTMENT</Text>
            <Text style={styles.mobileTagline}>College of Information Technology</Text>
          </View>

          <ScrollView
            style={styles.mobileFormScroll}
            contentContainerStyle={styles.mobileFormContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.mobileNotch} />

            {renderStepIndicators()}
            {renderStepContent()}

            <Pressable onPress={() => navigation.navigate("Login")} style={{ marginTop: 24, alignItems: 'center' }}>
              <Text style={[styles.loginBackText, { textAlign: 'center' }]}>
                Back to <Text style={styles.loginBackLink}>Sign In</Text>
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.rootContainer, { opacity: entryAnim, transform: [{ scale: entryScale }] }]}>
      <ImageBackground
        source={require('../assets/full-facade.jpg')}
        style={StyleSheet.absoluteFillObject}
        imageStyle={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0, 5, 14, 0.92)', 'rgba(1, 18, 41, 0.88)', 'rgba(0, 1, 3, 0.85)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Image
          source={require('../assets/subtle-dots.png')}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width: '100%', height: '100%',
            opacity: 0.15,
          }}
          resizeMode="repeat"
        />
        <Orb style={{ width: 350, height: 350, backgroundColor: '#4F8EF7', top: -100, left: -100 }} delay={0} />
        <Orb style={{ width: 250, height: 250, backgroundColor: '#93C5FD', bottom: -50, right: -50 }} delay={1500} />
        <Orb style={{ width: 180, height: 180, backgroundColor: '#60A5FA', top: -40, right: 60 }} delay={2500} />
        <Orb style={{ width: 200, height: 200, backgroundColor: '#4F8EF7', bottom: 100, left: -80 }} delay={3500} />
        <Orb style={{ width: 150, height: 150, backgroundColor: '#4F8EF7', bottom: 460, left: 470 }} delay={3500} />
        <Orb style={{ width: 120, height: 120, backgroundColor: '#93C5FD', top: '44%', right: '15%' }} delay={1000} />
      </ImageBackground>

      <Toast
        visible={!!alertConfig.message}
        message={alertConfig.message}
        type={alertConfig.type}
        onHide={() => setAlertConfig({ message: "", type: "" })}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, isMobile && styles.cardMobile]}>
          {/* Back button */}
          <Pressable
            onPress={() => navigation.navigate("Login")}
            style={({ pressed, hovered }) => [
              styles.backButton,
              hovered && styles.backButtonHovered,
              pressed && styles.backButtonPressed
            ]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color="#0F172A" />
          </Pressable>

          {/* Logo Section */}
          <View style={styles.logoRow}>
            <Image source={require('../assets/ua-logo.png')} style={styles.logo} resizeMode="contain" />
            <Image source={require('../assets/cit-logo.png')} style={styles.logo2} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>CIT APPOINTMENT</Text>

          {renderStepIndicators()}
          {renderStepContent()}

          <Pressable onPress={() => navigation.navigate("Login")} style={{ marginTop: 24 }}>
            <Text style={styles.loginBackText}>
              Back to <Text style={styles.loginBackLink}>Sign In</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#001233',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md || 16,
    padding: 40,
    alignItems: 'center',
    position: 'relative',
    ...Shadows.lg,
  },
  cardMobile: {
    width: '100%',
    padding: 24,
  },

  // Mobile styles
  mobileRoot: { flex: 1, backgroundColor: '#FFFFFF' },
  mobileHero: { backgroundColor: '#001233', alignItems: 'center', paddingTop: 45, paddingBottom: 46, paddingHorizontal: 24, overflow: 'hidden' },
  mobileHeroOrb: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(79,142,247,0.12)', top: -70, right: -50 },
  mobileUaLogo: { width: 64, height: 64 },
  mobileCitLogo: { width: 66, height: 66 },
  mobileLogoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 12 },
  mobileAppName: { fontFamily: 'Inter_900Black', fontSize: 24, color: '#FFFFFF', letterSpacing: 2.5, marginBottom: 4 },
  mobileTagline: { fontFamily: 'Roboto_400Regular', fontSize: 14, color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 },
  mobileFormScroll: { flex: 1, marginTop: -20, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  mobileFormContent: { padding: 24, paddingTop: 8, paddingBottom: 60 },
  mobileNotch: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#C9A84C', alignSelf: 'center', marginTop: 12, marginBottom: 28 },

  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    transitionDuration: '0.2s',
  },
  backButtonHovered: {
    backgroundColor: '#E2E8F0',
  },
  backButtonPressed: {
    backgroundColor: '#CBD5E1',
    transform: [{ scale: 0.96 }],
  },
  logoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    marginTop: 10,
  },
  logo: {
    width: 50,
    height: 50,
  },
  logo2: {
    width: 50,
    height: 50,
  },
  appName: {
    fontFamily: 'Inter_900Black',
    fontSize: 18,
    color: '#002c6e',
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  indicatorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#002366',
  },
  dotCompleted: {
    backgroundColor: '#10B981',
  },
  formContent: {
    width: '100%',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'Inter_900Black',
    fontSize: 28,
    color: '#002c6e',
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  emailHighlight: {
    fontFamily: 'Inter_700Bold',
    color: '#0F172A',
  },
  inputSection: {
    width: '100%',
    gap: 6,
    marginBottom: 24,
  },
  showPassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  showPassText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 13,
    color: '#64748B',
  },
  submitBtn: {
    width: '100%',
    height: 48,
    borderRadius: Radius.sm || 10,
    backgroundColor: '#002366',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
    transitionDuration: '0.2s',
  },
  submitBtnHovered: {
    backgroundColor: '#00184A',
  },
  submitBtnPressed: {
    backgroundColor: '#000F30',
    transform: [{ scale: 0.98 }],
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  backStepLink: {
    marginTop: 15,
  },
  backStepText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#002366',
    textDecorationLine: 'underline',
  },
  loginBackText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 14,
    color: '#64748B',
  },
  loginBackLink: {
    fontFamily: 'Inter_700Bold',
    color: '#002366',
  },
});
