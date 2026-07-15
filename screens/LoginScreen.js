import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  Platform,
  ScrollView,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import InlineAlert from "../components/InlineAlert";
import { Toast } from "../components/Toast";
import { AppInput } from "../components/AppInput";

import api, { GOOGLE_WEB_CLIENT_ID } from "../utils/api";
import { Typography } from "../styles/theme";


if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
}

// ── Decorative Floating Orb ─────────────────────────────────────────────────
const Orb = ({ style }) => (
  <View style={[{
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.18,
  }, style]} />
);

export default function LoginScreen({ navigation }) {

  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = getStyles(isMobile, width);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ message: "", type: "" });

  const handleLogin = async () => {
    setAlertConfig({ message: "", type: "" });
    setLoading(true);
    try {
      const response = await api.post("login/", { username, password });
      const { access, refresh, role, first_name, last_name, id } = response.data;
      if (id) await AsyncStorage.setItem('user_id', id.toString());
      await AsyncStorage.setItem('access_token', access);
      await AsyncStorage.setItem('user_role', role);
      await AsyncStorage.setItem('first_name', first_name || "");
      await AsyncStorage.setItem('last_name', last_name || "");
      if (rememberMe) {
        await AsyncStorage.setItem('refresh_token', refresh);
        await AsyncStorage.setItem('remember_me', 'true');
      } else {
        await AsyncStorage.removeItem('refresh_token');
        await AsyncStorage.setItem('remember_me', 'false');
      }
      setAlertConfig({ message: "Welcome back!", type: "success" });
      setTimeout(() => {
        if (role === "admin") navigation.replace("AdminDashboard");
        else if (role === "faculty" || role === "dean") navigation.replace("FacultyHome");
        else navigation.replace("StudentDashboard");
      }, 800);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || "Invalid username or password.";
      setAlertConfig({ message: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleBackendResponse = async (data) => {
    const { action, tokens, user, google_info } = data;
    if (action === "login") {
      if (user.id) await AsyncStorage.setItem('user_id', user.id.toString());
      await AsyncStorage.setItem('access_token', tokens.access);
      await AsyncStorage.setItem('user_role', user.role);
      await AsyncStorage.setItem('first_name', user.first_name);
      await AsyncStorage.setItem('last_name', user.last_name);
      setAlertConfig({ message: "Welcome back!", type: "success" });
      setTimeout(() => {
        if (user.role === "admin") navigation.replace("AdminDashboard");
        else if (user.role === "faculty" || user.role === "dean") navigation.replace("FacultyHome");
        else navigation.replace("StudentDashboard");
      }, 800);
    } else if (action === "register") {
      setAlertConfig({ message: "Almost there! Please complete your profile.", type: "success" });
      setTimeout(() => {
        navigation.navigate("Register", { isGoogle: true, googleData: google_info });
      }, 1000);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && GOOGLE_WEB_CLIENT_ID) {
      const initializeGoogle = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_WEB_CLIENT_ID,
            callback: handleWebGoogleResponse,
            use_fedcm_for_prompt: false,
          });

          // Wait briefly for DOM rendering to complete, then render the official button
          setTimeout(() => {
            const btnId = isMobile ? "googleButtonDivMobile" : "googleButtonDiv";
            const btnDiv = document.getElementById(btnId);
            if (btnDiv) {
              window.google.accounts.id.renderButton(btnDiv, {
                theme: "outline",
                size: "large",
                text: "continue_with",
                width: 320,
              });
            }
          }, 100);
        }
      };
      if (window.google) {
        initializeGoogle();
      } else {
        const interval = setInterval(() => {
          if (window.google) { initializeGoogle(); clearInterval(interval); }
        }, 1000);
      }
    }
  }, [isMobile]);

  const handleWebGoogleResponse = async (response) => {
    setGoogleLoading(true);
    try {
      const backendRes = await api.post("google-auth/", { id_token: response.credential });
      handleBackendResponse(backendRes.data);
    } catch (err) {
      setAlertConfig({ message: "Verification failed with server.", type: "error" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAlertConfig({ message: "", type: "" });
    if (Platform.OS === 'web') {
      if (!GOOGLE_WEB_CLIENT_ID) {
        if (__DEV__) {
          const mockEmail = window.prompt(
            "Google Client ID is not configured in your .env file.\n\nFor local development, enter a mock @ua.edu.ph email to bypass Google verification:",
            "student@ua.edu.ph"
          );
          if (mockEmail) {
            if (!mockEmail.toLowerCase().endsWith("@ua.edu.ph")) {
              setAlertConfig({ message: "Only @ua.edu.ph emails are allowed.", type: "error" });
              return;
            }
            setGoogleLoading(true);
            try {
              const backendRes = await api.post("google-auth/", { id_token: `mock_token_${mockEmail.trim()}` });
              handleBackendResponse(backendRes.data);
            } catch (err) {
              setAlertConfig({ message: "Mock verification failed with server.", type: "error" });
            } finally {
              setGoogleLoading(false);
            }
          }
        } else {
          setAlertConfig({ message: "Google Client ID is not configured in .env", type: "error" });
        }
        return;
      }
      if (window.google) {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setAlertConfig({ message: "Please allow third-party sign-in in your browser settings.", type: "error" });
          }
        });
      }
    } else {
      setGoogleLoading(true);
      try {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        const email = userInfo.user.email;
        if (!email.toLowerCase().endsWith("@ua.edu.ph")) {
          await GoogleSignin.signOut();
          setAlertConfig({ message: "Only @ua.edu.ph emails are allowed.", type: "error" });
          return;
        }
        const response = await api.post("google-auth/", { id_token: userInfo.idToken });
        handleBackendResponse(response.data);
      } catch (error) {
        setAlertConfig({ message: "Sign-in failed", type: "error" });
      } finally {
        setGoogleLoading(false);
      }
    }
  };

  // ── DESKTOP: split-panel layout ─────────────────────────────────────────
  if (!isMobile) {
    return (
      <View style={styles.desktopRoot}>
        <Toast
          visible={!!alertConfig.message}
          message={alertConfig.message}
          type={alertConfig.type}
          onHide={() => setAlertConfig({ message: "", type: "" })}
        />

        {/* LEFT PANEL — Branding */}
        <LinearGradient
          colors={['#001848', '#002B6B', '#003DA5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.leftPanel}
        >
          {/* Decorative orbs */}
          <Orb style={{ width: 320, height: 320, backgroundColor: '#4F8EF7', top: -80, left: -80 }} />
          <Orb style={{ width: 260, height: 260, backgroundColor: '#60A5FA', bottom: 40, right: -60 }} />
          <Orb style={{ width: 180, height: 180, backgroundColor: '#93C5FD', top: '45%', left: '30%' }} />

          <View style={styles.leftContent}>
            {/* Logo */}
            <View style={styles.leftLogoRow}>
              <Image
                source={require('../assets/ua-logo.png')}
                style={styles.uaLogo}
                resizeMode="contain"
              />
              <Image
                source={require('../assets/cit-logo.png')}
                style={styles.citLogo}
                resizeMode="contain"
              />
            </View>

            {/* Main copy */}
            <Text style={styles.leftTitle}>CIT Appointment</Text>
            <Text style={styles.leftSubtitle}>College of Information Technology</Text>
            <Text style={styles.leftBody}>
              Book, manage, and track your clinic appointments at the University of the Assumption — all in one place.
            </Text>

            {/* Feature pills */}
            <View style={styles.pillRow}>
              {['Book Appointments', 'View History', 'Secure & Private'].map(f => (
                <View key={f} style={styles.pill}>
                  <Text style={styles.pillText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom watermark */}
          <Text style={styles.watermark}>University of the Assumption · CIT</Text>
        </LinearGradient>

        {/* RIGHT PANEL — Form */}
        <ScrollView
          contentContainerStyle={styles.rightPanel}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {/* Top accent line */}
            <View style={styles.accentBar} />

            <Text style={styles.formGreeting}>Good to see you!</Text>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSubtitle}>to Book an Appointment</Text>

            <View style={styles.inputSection}>
              <AppInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                setError={(val) => setAlertConfig({ ...alertConfig, message: val })}
              />
              <AppInput
                label="Password"
                value={password}
                secureTextEntry={!showPassword}
                onChangeText={setPassword}
                setError={(val) => setAlertConfig({ ...alertConfig, message: val })}
              />
            </View>

            {/* Remember me row */}
            <View style={styles.row}>
              <Pressable
                onPress={() => setRememberMe(!rememberMe)}
                style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
              >
                {rememberMe && <MaterialCommunityIcons name="check" size={12} color="#fff" />}
              </Pressable>
              <Text style={styles.rememberText}>Remember me</Text>
            </View>

            {/* Sign In CTA */}
            <TouchableOpacity
              style={[styles.button, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#003DA5', '#001E5C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.buttonInner}>
                    <Text style={styles.buttonText}>Sign In</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            {Platform.OS === 'web' && GOOGLE_WEB_CLIENT_ID ? (
              <View style={{ alignItems: 'center', marginVertical: 8 }}>
                <div id="googleButtonDiv" style={{ width: '320px', height: '44px' }} />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                disabled={googleLoading}
                activeOpacity={0.85}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#444" />
                ) : (
                  <View style={styles.googleContent}>
                    <Image source={require('../assets/google-logo.png')} style={{ width: 22, height: 22 }} />
                    <Text style={styles.googleButtonText}>Continue with UA Email</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Footer */}
            <View style={styles.footerRow}>
              <MaterialCommunityIcons name="shield-check-outline" size={14} color="#94A3B8" />
              <Text style={styles.securityText}>  Secured with end-to-end encryption</Text>
            </View>

            <Pressable onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerText}>
                Don't have an account?{'  '}
                <Text style={styles.link}>Register here</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── MOBILE: navy hero top + white form below ──────────────────────────────
  return (
    <View style={styles.mobileRoot}>
      <Toast
        visible={!!alertConfig.message}
        message={alertConfig.message}
        type={alertConfig.type}
        onHide={() => setAlertConfig({ message: "", type: "" })}
      />

      {/* ── HERO SECTION (always navy, no gradient needed) ── */}
      <View style={styles.mobileHero}>
        {/* subtle decorative circle */}
        <View style={styles.mobileHeroOrb} />
        <View style={styles.mobileLogoRow}>
          <Image
            source={require('../assets/ua-logo.png')}
            style={styles.mobileUaLogo}
            resizeMode="contain"
          />
          <Image
            source={require('../assets/cit-logo.png')}
            style={styles.mobileCitLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.mobileAppName}>CIT APPOINTMENT</Text>
        <Text style={styles.mobileTagline}>College of Information Technology</Text>
      </View>

      {/* ── FORM SECTION (white, scrollable) ── */}
      <ScrollView
        style={styles.mobileFormScroll}
        contentContainerStyle={styles.mobileFormContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Notch / pill handle */}
        <View style={styles.mobileNotch} />

        <Text style={styles.mobileCardTitle}>Welcome!</Text>
        <Text style={styles.mobileCardSubtitle}>Sign in to Book an Appointment</Text>

        <AppInput
          label="Username"
          value={username}
          onChangeText={setUsername}
          setError={(val) => setAlertConfig({ ...alertConfig, message: val })}
        />
        <AppInput
          label="Password"
          value={password}
          secureTextEntry={!showPassword}
          onChangeText={setPassword}
          setError={(val) => setAlertConfig({ ...alertConfig, message: val })}
        />

        <View style={styles.row}>
          <Pressable
            onPress={() => setRememberMe(!rememberMe)}
            style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
          >
            {rememberMe && <MaterialCommunityIcons name="check" size={12} color="#fff" />}
          </Pressable>
          <Text style={styles.rememberText}>Remember me</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#003DA5', '#001E5C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonInner}>
                <Text style={styles.buttonText}>Sign In</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.divider} />
        </View>

        {Platform.OS === 'web' && GOOGLE_WEB_CLIENT_ID ? (
          <View style={{ alignItems: 'center', marginVertical: 8 }}>
            <div id="googleButtonDivMobile" style={{ width: '320px', height: '44px' }} />
          </View>
        ) : (
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator color="#444" />
            ) : (
              <View style={styles.googleContent}>
                <Image source={require('../assets/google-logo.png')} style={{ width: 22, height: 22 }} />
                <Text style={styles.googleButtonText}>Continue with UA Email</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <View style={styles.footerRow}>
          <MaterialCommunityIcons name="shield-check-outline" size={13} color="#94A3B8" />
          <Text style={styles.securityText}>  Secured with end-to-end encryption</Text>
        </View>

        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerText}>
            Don't have an account?{'  '}
            <Text style={styles.link}>Register here</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const getStyles = (isMobile, width) => StyleSheet.create({

  // ── Desktop ──────────────────────────────────────────────────────────────
  desktopRoot: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#001233',
  },
  leftPanel: {
    width: '44%',
    minHeight: '100%',
    justifyContent: 'space-between',
    padding: 56,
    overflow: 'hidden',
  },
  leftContent: {
    flex: 1,
    justifyContent: 'center',
  },
  leftLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
    gap: 16,
  },
  uaLogo: {
    width: 92,
    height: 92,
  },
  citLogo: {
    width: 110,
    height: 110,
  },
  leftTitle: {
    fontFamily: 'Inter_900Black',
    fontSize: 44,
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 50,
    marginBottom: 6,
  },
  leftSubtitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  leftBody: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 27,
    maxWidth: 360,
    marginBottom: 40,
  },
  pillRow: {
    flexDirection: 'column',
    gap: 10,
  },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  pillText: {
    color: 'rgba(255,255,255,0.88)',
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  watermark: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 0.5,
  },

  // Right panel (desktop)
  rightPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  formContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 44,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  accentBar: {
    height: 4,
    width: 40,
    borderRadius: 2,
    backgroundColor: '#C9A84C',
    marginBottom: 20,
  },
  formGreeting: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  formTitle: {
    fontFamily: 'Inter_900Black',
    fontSize: 30,
    color: '#0F172A',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  formSubtitle: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 28,
    lineHeight: 20,
  },
  inputSection: {
    marginTop: 4,
  },

  // ── Mobile ───────────────────────────────────────────────────────────────
  mobileRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileHero: {
    backgroundColor: '#001233',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 56,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  mobileHeroOrb: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(79,142,247,0.12)',
    top: -70,
    right: -50,
  },
  mobileUaLogo: {
    width: 74,
    height: 74,
  },
  mobileCitLogo: {
    width: 88,
    height: 88,
  },
  mobileLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  mobileAppName: {
    fontFamily: 'Inter_900Black',
    fontSize: 22,
    color: '#FFFFFF',
    letterSpacing: 2.5,
    marginBottom: 4,
  },
  mobileTagline: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
  },
  mobileFormScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileFormContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 8,
  },
  mobileNotch: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 28,
  },
  mobileCardTitle: {
    fontFamily: 'Inter_900Black',
    fontSize: 26,
    color: '#0F172A',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  mobileCardSubtitle: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
    lineHeight: 20,
  },

  // ── Shared ───────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: isMobile ? 22 : 26,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#002366',
    borderColor: '#002366',
  },
  rememberText: {
    fontFamily: 'Roboto_400Regular',
    marginLeft: 8,
    color: '#64748B',
    fontSize: 13,
  },
  button: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#002366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 7,
  },
  buttonGradient: {
    paddingVertical: isMobile ? 15 : 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    fontSize: isMobile ? 15 : 16,
    letterSpacing: 0.5,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  dividerText: {
    marginHorizontal: 14,
    color: '#CBD5E1',
    fontSize: 12,
    fontFamily: 'Roboto_400Regular',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: isMobile ? 13 : 14,
    borderRadius: 14,
    marginBottom: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleButtonText: {
    marginLeft: 10,
    fontSize: isMobile ? 13 : 14,
    color: '#334155',
    fontFamily: 'Inter_500Medium',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    gap: 4,
  },
  securityText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 11,
    color: '#CBD5E1',
  },
  registerText: {
    fontFamily: 'Roboto_400Regular',
    textAlign: 'center',
    color: '#64748B',
    fontSize: isMobile ? 13 : 14,
    lineHeight: 22,
  },
  link: {
    color: '#002366',
    fontFamily: 'Inter_700Bold',
  },
});

