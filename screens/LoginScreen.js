import { useState, useEffect, useRef } from "react";
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
  Animated,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import InlineAlert from "../components/InlineAlert";
import { Toast } from "../components/Toast";
import { AppInput } from "../components/AppInput";

import api, { GOOGLE_WEB_CLIENT_ID } from "../utils/api";
import { Typography, Colors } from "../styles/theme";

let isGoogleInitialized = false;


if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
  });
}

// ── Decorative Floating Orb ─────────────────────────────────────────────────
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
      opacity: 0.18,
    }, style, { transform: [{ translateY }] }]} />
  );
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const HoverScaleItem = ({ children, style, scaleTo = 1.05 }) => {
  const [scale] = useState(() => new Animated.Value(1));
  return (
    <AnimatedPressable
      onHoverIn={() => Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true }).start()}
      onHoverOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
};

const BouncingPill = ({ children, bounceTrigger, delay = 0 }) => {
  const [translateY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (bounceTrigger > 0) {
      const timeout = setTimeout(() => {
        translateY.setValue(0);
        Animated.sequence([
          Animated.timing(translateY, { toValue: -3, duration: 250, useNativeDriver: true }),
          Animated.spring(translateY, { toValue: 0, friction: 6, tension: 80, useNativeDriver: true })
        ]).start();
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [bounceTrigger, delay, translateY]);

  return (
    <Animated.View style={{ transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
};

const ShineButton = ({ onPress, loading, styles }) => {
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
      style={[styles.button, loading && { opacity: 0.7 }, { transform: [{ scale }] }]}
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

const TypingText = ({ text, style, typingSpeed = 20, eraseSpeed = 10, pauseDelay = 3000, onTypingComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    let isErasing = false;
    let timeout;

    const tick = () => {
      if (!isErasing) {
        if (i <= text.length) {
          setDisplayedText(text.substring(0, i));
          i++;
          timeout = setTimeout(tick, typingSpeed);
        } else {
          isErasing = true;
          if (onTypingComplete) onTypingComplete();
          timeout = setTimeout(tick, pauseDelay);
        }
      } else {
        if (i >= 0) {
          setDisplayedText(text.substring(0, i));
          i--;
          timeout = setTimeout(tick, eraseSpeed);
        } else {
          isErasing = false;
          timeout = setTimeout(tick, 500);
        }
      }
    };

    tick();
    return () => clearTimeout(timeout);
  }, [text, typingSpeed, eraseSpeed, pauseDelay]);

  useEffect(() => {
    const blink = setInterval(() => setShowCursor(v => !v), 500);
    return () => clearInterval(blink);
  }, []);

  return (
    <View style={{ position: 'relative' }}>
      <Text style={[style, { opacity: 0 }]}>{text}</Text>
      <Text style={[style, { position: 'absolute', top: 0, left: 0 }]}>
        {displayedText}
        <Text style={{ opacity: showCursor ? 1 : 0, color: '#60A5FA' }}>|</Text>
      </Text>
    </View>
  );
};

export default function LoginScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = getStyles(isMobile, width);

  const googleCallbackRef = useRef(handleWebGoogleResponse);
  googleCallbackRef.current = handleWebGoogleResponse;

  const [typingCycles, setTypingCycles] = useState(0);

  const entryAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(entryAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionAnim = useState(() => new Animated.Value(0))[0];

  const triggerTransition = (role) => {
    setIsTransitioning(true);
    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      if (role === "admin") navigation.replace("AdminDashboard");
      else if (role === "faculty" || role === "dean") navigation.replace("FacultyHome");
      else navigation.replace("StudentDashboard");
    });
  };

  const mainOpacity = transitionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const mainScale = transitionAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.96],
  });

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
        triggerTransition(role);
      }, 300);
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
        triggerTransition(user.role);
      }, 300);
    } else if (action === "register") {
      setAlertConfig({ message: "Almost there! Please complete your profile.", type: "success" });
      setTimeout(() => {
        navigation.navigate("Register", { isGoogle: true, googleData: google_info });
      }, 1000);
    }
  };

  const renderGoogleButton = (el) => {
    if (!el || Platform.OS !== 'web' || !GOOGLE_WEB_CLIENT_ID) return;

    const runRender = () => {
      if (!window.google) {
        setTimeout(runRender, 100);
        return;
      }

      if (!isGoogleInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_WEB_CLIENT_ID,
          callback: (res) => googleCallbackRef.current?.(res),
          use_fedcm_for_prompt: false,
        });
        isGoogleInitialized = true;
      }

      el.innerHTML = ""; // Clear old iframe and contents
      window.google.accounts.id.renderButton(el, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 320,
      });
    };

    runRender();
  };

  async function handleWebGoogleResponse(response) {
    setGoogleLoading(true);
    try {
      const backendRes = await api.post("google-auth/", { id_token: response.credential });
      handleBackendResponse(backendRes.data);
    } catch (err) {
      setAlertConfig({ message: "Verification failed with server.", type: "error" });
    } finally {
      setGoogleLoading(false);
    }
  }

  const handleGoogleLogin = async () => {
    setAlertConfig({ message: "", type: "" });
    if (Platform.OS === 'web') {
      if (!GOOGLE_WEB_CLIENT_ID) {
        if (__DEV__) {
          const mockEmail = window.prompt(
            "Google Client ID is not configured in your .env file.\n\nFor local development, enter a mock @ua.edu.ph email to bypass Google verification:",
            "student@ua.edu.ph"
          ) || "admin@ua.edu.ph";
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
      <Animated.View style={{ flex: 1, opacity: entryAnim }}>
        <View style={styles.desktopRoot}>
          <Toast
            visible={!!alertConfig.message}
            message={alertConfig.message}
            type={alertConfig.type}
            onHide={() => setAlertConfig({ message: "", type: "" })}
          />

          <Animated.View style={{ flex: 1, flexDirection: 'row', opacity: mainOpacity, transform: [{ scale: mainScale }] }}>
            {/* LEFT PANEL — Branding */}
            <LinearGradient
              colors={['#001848', '#002B6B', '#003DA5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.leftPanel}
            >
              {/* Decorative orbs */}
              <Orb style={{ width: 320, height: 320, backgroundColor: '#4F8EF7', top: -80, left: -80 }} delay={0} />
              <Orb style={{ width: 260, height: 260, backgroundColor: '#60A5FA', bottom: 40, right: -60 }} delay={1500} />
              <Orb style={{ width: 180, height: 180, backgroundColor: '#93C5FD', top: '45%', left: '30%' }} delay={3000} />

              <View style={styles.leftContent}>
                {/* Logo */}
                <View style={styles.leftLogoRow}>
                  <HoverScaleItem>
                    <Image
                      source={require('../assets/ua-logo.png')}
                      style={styles.uaLogo}
                      resizeMode="contain"
                    />
                  </HoverScaleItem>
                  <HoverScaleItem>
                    <Image
                      source={require('../assets/cit-logo.png')}
                      style={styles.citLogo}
                      resizeMode="contain"
                    />
                  </HoverScaleItem>
                </View>

                {/* Main copy */}
                <Text style={styles.leftTitle}>CIT Appointment</Text>
                <Text style={styles.leftSubtitle}>College of Information Technology</Text>
                <TypingText
                  text="Book, manage, and track your academic appointments with ease — all in one platform."
                  style={styles.leftBody}
                  onTypingComplete={() => setTypingCycles(c => c + 1)}
                />

                {/* Feature pills */}
                <View style={styles.pillRow}>
                  {['Book Appointments', 'Track Appointments', 'Secure & Reliable'].map((f, index) => (
                    <BouncingPill key={f} delay={index * 150} bounceTrigger={typingCycles}>
                      <HoverScaleItem style={styles.pill}>
                        <Text style={styles.pillText}>{f}</Text>
                      </HoverScaleItem>
                    </BouncingPill>
                  ))}
                </View>
              </View>

              {/* Bottom watermark */}
              <Text style={styles.watermark}>University of the Assumption · College of Information Technology</Text>
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
                <View style={[styles.row, { justifyContent: 'space-between', width: '100%' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable
                      onPress={() => setRememberMe(!rememberMe)}
                      style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
                    >
                      {rememberMe && <MaterialCommunityIcons name="check" size={12} color="#fff" />}
                    </Pressable>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </View>
                  <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
                    <Text style={styles.forgotPasswordLink}>Forgot password?</Text>
                  </Pressable>
                </View>

                {/* Sign In CTA */}
                <ShineButton onPress={handleLogin} loading={loading} styles={styles} />

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.divider} />
                </View>

                {Platform.OS === 'web' && GOOGLE_WEB_CLIENT_ID ? (
                  <View style={{ alignItems: 'center', marginVertical: 8 }}>
                    <div ref={renderGoogleButton} style={{ width: '320px', height: '44px' }} />
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
          </Animated.View>

          {isTransitioning && (
            <Animated.View style={[
              StyleSheet.absoluteFillObject,
              {
                opacity: transitionAnim,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
              }
            ]}>
              <LinearGradient
                colors={['#FFFFFF', '#F5F7FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <Animated.View style={{
                alignItems: 'center',
                transform: [{
                  scale: transitionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  })
                }]
              }}>
                <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20, alignItems: 'center' }}>
                  <Image source={require('../assets/ua-logo.png')} style={{ width: 80, height: 80 }} resizeMode="contain" />
                  <Image source={require('../assets/cit-logo.png')} style={{ width: 80, height: 80 }} resizeMode="contain" />
                </View>
                <Text style={{
                  fontFamily: 'Inter_700Bold',
                  color: '#002366',
                  fontSize: 24,
                  marginBottom: 8,
                }}>
                  Welcome back!
                </Text>
                <Text style={{
                  fontFamily: 'Roboto_400Regular',
                  color: '#475569',
                  fontSize: 14,
                  marginBottom: 24,
                }}>
                  Preparing your workspace...
                </Text>
                <ActivityIndicator size="large" color="#002366" />
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </Animated.View>
    );
  }

  // ── MOBILE: navy hero top + white form below ──────────────────────────────
  return (
    <Animated.View style={{ flex: 1, opacity: entryAnim }}>
      <View style={styles.mobileRoot}>
        <Toast
          visible={!!alertConfig.message}
          message={alertConfig.message}
          type={alertConfig.type}
          onHide={() => setAlertConfig({ message: "", type: "" })}
        />

        <Animated.View style={{ flex: 1, opacity: mainOpacity, transform: [{ scale: mainScale }] }}>
          {/* ── HERO SECTION (always navy, no gradient needed) ── */}
          <View style={styles.mobileHero}>
            {/* subtle decorative circle */}
            <Orb style={[styles.mobileHeroOrb, { opacity: 1 }]} delay={0} />
            <View style={styles.mobileLogoRow}>
              <HoverScaleItem>
                <Image
                  source={require('../assets/ua-logo.png')}
                  style={styles.mobileUaLogo}
                  resizeMode="contain"
                />
              </HoverScaleItem>
              <HoverScaleItem>
                <Image
                  source={require('../assets/cit-logo.png')}
                  style={styles.mobileCitLogo}
                  resizeMode="contain"
                />
              </HoverScaleItem>
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

            <View style={[styles.row, { justifyContent: 'space-between', width: '100%' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable
                  onPress={() => setRememberMe(!rememberMe)}
                  style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
                >
                  {rememberMe && <MaterialCommunityIcons name="check" size={12} color="#fff" />}
                </Pressable>
                <Text style={styles.rememberText}>Remember me</Text>
              </View>
              <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={styles.forgotPasswordLink}>Forgot password?</Text>
              </Pressable>
            </View>

            <ShineButton onPress={handleLogin} loading={loading} styles={styles} />

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            {Platform.OS === 'web' && GOOGLE_WEB_CLIENT_ID ? (
              <View style={{ alignItems: 'center', marginVertical: 8 }}>
                <div ref={renderGoogleButton} style={{ width: '320px', height: '44px' }} />
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
        </Animated.View>

        {isTransitioning && (
          <Animated.View style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: transitionAnim,
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
            }
          ]}>
            <LinearGradient
              colors={['#FFFFFF', '#F5F7FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Animated.View style={{
              alignItems: 'center',
              transform: [{
                scale: transitionAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }]
            }}>
              <View style={{ flexDirection: 'row', gap: 15, marginBottom: 20, alignItems: 'center' }}>
                <Image source={require('../assets/ua-logo.png')} style={{ width: 80, height: 80 }} resizeMode="contain" />
                <Image source={require('../assets/cit-logo.png')} style={{ width: 80, height: 80 }} resizeMode="contain" />
              </View>
              <Text style={{
                fontFamily: 'Inter_700Bold',
                color: '#002366',
                fontSize: 24,
                marginBottom: 8,
              }}>
                Welcome back!
              </Text>
              <Text style={{
                fontFamily: 'Roboto_400Regular',
                color: '#475569',
                fontSize: 14,
                marginBottom: 24,
              }}>
                Preparing your workspace...
              </Text>
              <ActivityIndicator size="large" color="#002366" />
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </Animated.View>
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
    padding: 80,
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
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  formTitle: {
    fontFamily: 'Inter_900Black',
    fontSize: 30,
    color: '#0F172A',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  formSubtitle: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
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
    paddingTop: 45,
    paddingBottom: 46,
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
    marginBottom: isMobile ? 22 : 35,
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
  forgotPasswordLink: {
    fontFamily: 'Inter_500Medium',
    color: '#002366',
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
    marginVertical: 16,
    marginTop: 12,
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
    marginBottom: 18,
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

