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
  Animated,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppInput } from "../components/AppInput";
import InlineAlert from "../components/InlineAlert";
import { Toast } from "../components/Toast";
import PrivacyPolicyModal from "../components/PrivacyPolicyModal";

import api from "../utils/api";
import { Typography } from "../styles/theme";

// --- Animations from LoginScreen ---
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

const HoverScaleItem = ({ children, style, scaleTo = 1.05, ...props }) => {
  const [scale] = useState(() => new Animated.Value(1));
  return (
    <AnimatedPressable
      onHoverIn={() => Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true }).start()}
      onHoverOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      style={[style, { transform: [{ scale }] }]}
      {...props}
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

const ShineButton = ({ onPress, loading, styles, text = "Next" }) => {
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
            <Text style={styles.buttonText}>{text}</Text>
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

// --- Main Screen ---
export default function RegistrationScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = getStyles(isMobile, width);

  const googleData = route.params?.googleData;
  const isGoogle = route.params?.isGoogle || false;

  const [currentStep, setCurrentStep] = useState(1);
  const [typingCycles, setTypingCycles] = useState(0);

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    date_of_birth: "",
    sex: "",
    contact_number: "",
    email: "",
    address: "",
    course: "",
    year: "",
    section: "",
    password: "",
    confirmPassword: "",
  });

  const [isStaff, setIsStaff] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isGoogle && googleData) {
      setFormData((prev) => ({
        ...prev,
        first_name: googleData.first_name || "",
        last_name: googleData.last_name || "",
        email: googleData.email || "",
      }));

      if (googleData.email && !googleData.email.endsWith("@ua.edu.ph")) {
        setAlertConfig({
          message: "Registration restricted to @ua.edu.ph accounts.",
          type: "error"
        });
      }
    }
  }, [isGoogle, googleData]);

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDateOfBirthChange = (text) => {
    let cleaned = text.replace(/[^\d]/g, '');
    if (cleaned.length > 4) {
      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
    }
    if (cleaned.length > 7) {
      cleaned = cleaned.slice(0, 7) + '-' + cleaned.slice(7, 9);
    }
    updateField("date_of_birth", cleaned);
  };

  const validateStepFormat = () => {
    const step = currentStep;
    let requiredFields = [];
    if (step === 1) requiredFields = ["first_name", "last_name", "date_of_birth", "sex"];
    if (step === 2) requiredFields = ["contact_number", "email", "address"];
    if (step === 3 && !isStaff) requiredFields = ["course", "year", "section"];
    if (step === 4) requiredFields = ["username", "password", "confirmPassword"];

    const hasEmpty = requiredFields.some(field => !formData[field]);
    if (hasEmpty) {
      setAlertConfig({ message: "Please fill in all required fields.", type: "error" });
      return false;
    }

    if (step === 1) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(formData.date_of_birth)) {
        setAlertConfig({ message: "Date of Birth must be YYYY-MM-DD format.", type: "error" });
        return false;
      }
    }

    if (step === 2) {
      if (!formData.email.toLowerCase().endsWith("@ua.edu.ph")) {
        setAlertConfig({ message: "Please use your official UA email address.", type: "error" });
        return false;
      }
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(formData.contact_number) || formData.contact_number.length < 10) {
        setAlertConfig({ message: "Please enter a valid contact number.", type: "error" });
        return false;
      }
    }

    if (step === 4) {
      if (formData.password !== formData.confirmPassword) {
        setAlertConfig({ message: "Passwords do not match.", type: "error" });
        return false;
      }
      if (!consentGiven) {
        setAlertConfig({ message: "You must agree to the Privacy Policy.", type: "error" });
        return false;
      }
    }

    setAlertConfig({ message: "", type: "" });
    return true;
  };

  const handleNext = async () => {
    if (!validateStepFormat()) return;

    if (currentStep === 2 || currentStep === 4) {
      setLoading(true);
      try {
        const payload = currentStep === 2 ? { email: formData.email } : { username: formData.username };
        await api.post("check-availability/", payload);
      } catch (error) {
        setLoading(false);
        const errMsg = error.response?.data?.email || error.response?.data?.username || "Verification failed.";
        setAlertConfig({ message: errMsg, type: "error" });
        return;
      }
      setLoading(false);
    }

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleRegister();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setAlertConfig({ message: "", type: "" });
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const { confirmPassword, ...dataToSend } = formData;

      if (isStaff) {
        dataToSend.course = "N/A";
        dataToSend.year = "N/A";
        dataToSend.section = "N/A";
        dataToSend.role = "faculty";
      } else {
        dataToSend.role = "student";
      }

      const payload = isGoogle ? { ...dataToSend, is_google: true } : dataToSend;

      const response = await api.post("register/", payload);

      const { tokens, user } = response.data;
      const { access, refresh } = tokens;
      const { role, first_name, last_name, id } = user;

      if (id) await AsyncStorage.setItem('user_id', id.toString());
      await AsyncStorage.setItem("access_token", access);
      await AsyncStorage.setItem("refresh_token", refresh);
      await AsyncStorage.setItem("user_role", role);
      await AsyncStorage.setItem("first_name", first_name || "");
      await AsyncStorage.setItem("last_name", last_name || "");

      setAlertConfig({ message: "Account created successfully!", type: "success" });

      setTimeout(() => {
        if (role === "admin") navigation.replace("AdminDashboard");
        else if (role === "faculty" || role === "dean") navigation.replace("FacultyHome");
        else navigation.replace("StudentDashboard");
      }, 1500);

    } catch (error) {
      console.error("Registration error:", error);
      const backendError = error.response?.data
        ? Object.values(error.response.data)[0]
        : "Registration failed.";
      setAlertConfig({ message: String(backendError), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicators = () => (
    <View style={styles.stepIndicatorContainer}>
      {[1, 2, 3, 4].map(step => (
        <View key={step} style={[styles.stepDot, step <= currentStep && styles.stepDotActive]} />
      ))}
    </View>
  );

  const renderFormContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <Text style={styles.formTitle}>Personal Information</Text>
            <Text style={styles.formSubtitle}>Step 1 of 4</Text>
            <View style={styles.inputSection}>
              <AppInput
                label="First Name"
                value={formData.first_name}
                editable={!isGoogle}
                style={isGoogle ? styles.readOnlyInput : null}
                onChangeText={(v) => updateField("first_name", v)} />
              <AppInput
                label="Last Name"
                value={formData.last_name}
                editable={!isGoogle}
                style={isGoogle ? styles.readOnlyInput : null}
                onChangeText={(v) => updateField("last_name", v)} />
              <AppInput 
                label="Date of Birth (YYYY-MM-DD)"
                value={formData.date_of_birth}
                onChangeText={handleDateOfBirthChange}
                maxLength={10}
              />
              <View style={styles.genderWrapper}>
                <View style={styles.row}>
                  {["Male", "Female"].map((option) => (
                    <Pressable
                      key={option}
                      style={[styles.chip, formData.sex === option && styles.chipSelected]}
                      onPress={() => updateField("sex", option)}
                    >
                      <Text style={[styles.chipText, formData.sex === option && styles.chipTextSelected]}>
                        {option}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.formTitle}>Contact Information</Text>
            <Text style={styles.formSubtitle}>Step 2 of 4</Text>
            <View style={styles.inputSection}>
              <AppInput
                label="Contact Number"
                value={formData.contact_number}
                onChangeText={(v) => updateField("contact_number", v)} />
              <AppInput
                label="Email"
                value={formData.email}
                editable={!isGoogle}
                style={isGoogle ? styles.readOnlyInput : null}
                onChangeText={(v) => updateField("email", v)} />
              <AppInput
                label="Address"
                value={formData.address}
                onChangeText={(v) => updateField("address", v)} />
            </View>
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.formTitle}>Academic Information</Text>
            <Text style={styles.formSubtitle}>Step 3 of 4</Text>
            <View style={styles.inputSection}>
              <AppInput
                label="Course"
                value={isStaff ? "" : formData.course}
                editable={!isStaff}
                disabledStyleOverride={styles.disabledInput}
                onChangeText={(v) => updateField("course", v)} />

              <View style={styles.row}>
                <View style={styles.flex}>
                  <AppInput
                    label="Year"
                    value={isStaff ? "" : formData.year}
                    editable={!isStaff}
                    disabledStyleOverride={styles.disabledInput}
                    onChangeText={(v) => updateField("year", v)} />
                </View>
                <View style={[styles.flex]}>
                  <AppInput
                    label="Section"
                    value={isStaff ? "" : formData.section}
                    editable={!isStaff}
                    disabledStyleOverride={styles.disabledInput}
                    onChangeText={(v) => updateField("section", v)} />
                </View>
              </View>

              <Pressable
                style={styles.checkboxRowLeft}
                onPress={() => setIsStaff(!isStaff)}
              >
                <View style={[styles.checkbox, isStaff && styles.checkboxChecked]}>
                  {isStaff && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>I am a Faculty Member</Text>
              </Pressable>
            </View>
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.formTitle}>Account Information</Text>
            <Text style={styles.formSubtitle}>Step 4 of 4</Text>
            <View style={styles.inputSection}>
              <AppInput
                label="Username"
                value={formData.username}
                onChangeText={(v) => updateField("username", v)} />
              <AppInput label="Password" value={formData.password} secureTextEntry onChangeText={(v) => updateField("password", v)} />
              <AppInput label="Confirm Password" value={formData.confirmPassword} secureTextEntry onChangeText={(v) => updateField("confirmPassword", v)} />

              <View style={styles.consentBox}>
                <Pressable
                  style={styles.consentRow}
                  onPress={() => setConsentGiven(!consentGiven)}
                >
                  <View style={[styles.checkbox, consentGiven && styles.checkboxChecked]}>
                    {consentGiven && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                  </View>
                  <Text style={styles.consentText}>
                    I have read and agree to the collection, storage, and processing of my personal
                    and health-related information by the UA Clinic Appointment System, in accordance
                    with the Data Privacy Act of 2012 (RA 10173).{" "}
                    <Text
                      style={styles.consentLink}
                      onPress={() => setPrivacyModalVisible(true)}
                    >
                      Read Privacy Policy
                    </Text>
                  </Text>
                </Pressable>
              </View>
            </View>
          </>
        );
    }
  };

  const renderButtons = () => (
    <View style={styles.buttonContainer}>
      {currentStep > 1 && (
        <HoverScaleItem 
          style={styles.backButton} 
          onPress={handleBack} 
          disabled={loading}
          scaleTo={1.03}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </HoverScaleItem>
      )}
      <View style={{ flex: 1 }}>
        <ShineButton
          onPress={handleNext}
          loading={loading}
          styles={styles}
          text={currentStep === 4 ? "Create Account" : "Next"}
        />
      </View>
    </View>
  );

  // ── DESKTOP LAYOUT ──
  if (!isMobile) {
    return (
      <View style={styles.desktopRoot}>
        <Toast
          visible={!!alertConfig.message}
          message={alertConfig.message}
          type={alertConfig.type}
          onHide={() => setAlertConfig({ message: "", type: "" })}
        />
        <PrivacyPolicyModal
          visible={privacyModalVisible}
          onClose={() => setPrivacyModalVisible(false)}
        />

        <LinearGradient
          colors={['#001848', '#002B6B', '#003DA5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.leftPanel}
        >
          <Orb style={{ width: 320, height: 320, backgroundColor: '#4F8EF7', top: -80, left: -80 }} delay={0} />
          <Orb style={{ width: 260, height: 260, backgroundColor: '#60A5FA', bottom: 40, right: -60 }} delay={1500} />
          <Orb style={{ width: 180, height: 180, backgroundColor: '#93C5FD', top: '45%', left: '30%' }} delay={3000} />

          <View style={styles.leftContent}>
            <View style={styles.leftLogoRow}>
              <HoverScaleItem>
                <Image source={require('../assets/ua-logo.png')} style={styles.uaLogo} resizeMode="contain" />
              </HoverScaleItem>
              <HoverScaleItem>
                <Image source={require('../assets/cit-logo.png')} style={styles.citLogo} resizeMode="contain" />
              </HoverScaleItem>
            </View>

            <Text style={styles.leftTitle}>CIT Appointment</Text>
            <Text style={styles.leftSubtitle}>College of Information Technology</Text>
            <TypingText
              text="Book, manage, and track your academic appointments with ease — all in one platform."
              style={styles.leftBody}
              onTypingComplete={() => setTypingCycles(c => c + 1)}
            />

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
          <Text style={styles.watermark}>University of the Assumption · College of Information Technology</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.rightPanel} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <View style={styles.accentBar} />
            <Text style={styles.formGreeting}>Join CIT Appointment</Text>

            {renderStepIndicators()}
            {renderFormContent()}
            {renderButtons()}

            <Pressable onPress={() => navigation.navigate("Login")} style={{ marginTop: 24 }}>
              <Text style={styles.footerText}>
                Already have an account? <Text style={styles.link}>Sign In</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── MOBILE LAYOUT ──
  return (
    <View style={styles.mobileRoot}>
      <Toast
        visible={!!alertConfig.message}
        message={alertConfig.message}
        type={alertConfig.type}
        onHide={() => setAlertConfig({ message: "", type: "" })}
      />
      <PrivacyPolicyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />

      <View style={styles.mobileHero}>
        <Orb style={{ width: 250, height: 250, backgroundColor: '#4F8EF7', top: -50, right: -50 }} delay={0} />
        <Orb style={{ width: 150, height: 150, backgroundColor: '#93C5FD', bottom: -20, left: -20 }} delay={1500} />

        <View style={styles.leftLogoRow}>
          <HoverScaleItem>
            <Image source={require('../assets/ua-logo.png')} style={styles.mobileLogo} resizeMode="contain" />
          </HoverScaleItem>
          <HoverScaleItem>
            <Image source={require('../assets/cit-logo.png')} style={styles.mobileLogo} resizeMode="contain" />
          </HoverScaleItem>
        </View>
        <Text style={styles.mobileAppName}>CIT APPOINTMENT</Text>
        <Text style={styles.mobileTagline}>Create Account</Text>
      </View>

      <ScrollView
        style={styles.mobileFormScroll}
        contentContainerStyle={styles.mobileFormContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.mobileNotch} />

        {renderStepIndicators()}
        {renderFormContent()}
        {renderButtons()}

        <Pressable onPress={() => navigation.navigate("Login")} style={{ marginTop: 24 }}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.link}>Sign In</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const getStyles = (isMobile, width) => StyleSheet.create({
  // Shared
  row: { flexDirection: "row", alignItems: 'flex-end', gap: 15 },
  flex: { flex: 1 },
  rowMobile: { flexDirection: "column", alignItems: "stretch", gap: 0 },
  genderWrapper: { justifyContent: 'flex-end', paddingBottom: 12 },
  chip: { flex: 1, height: 50, borderRadius: 12, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginTop: 12 },
  chipSelected: { backgroundColor: "#002366" },
  chipText: { color: "#64748B", fontSize: isMobile ? 14 : 16, fontWeight: '500' },
  chipTextSelected: { color: "#fff", fontWeight: "bold" },
  readOnlyInput: { backgroundColor: '#F1F5F9', color: '#64748B', borderColor: '#E2E8F0' },
  disabledInput: { backgroundColor: '#E5E7EB', color: '#9CA3AF', borderColor: '#D1D5DB' },
  checkboxRowRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 12, marginBottom: 12, gap: 10 },
  checkboxRowLeft: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginTop: 12, marginBottom: 12, gap: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: '#002366', borderColor: '#002366' },
  checkboxLabel: { fontSize: isMobile ? 13 : 15, color: '#334155', fontWeight: '500' },
  consentBox: { backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, marginTop: 20, marginBottom: 10 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  consentText: { flex: 1, fontSize: 12, lineHeight: 18, color: '#475569' },
  consentLink: { color: '#002366', fontWeight: 'bold' },

  // Desktop
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
    minHeight: 520,
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
    marginBottom: 10,
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
  },
  inputSection: { gap: 8, marginBottom: 15 },

  buttonContainer: { flexDirection: 'row', gap: 12, marginTop: 10 },
  backButton: { height: 52, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  backButtonText: { color: '#475569', fontSize: 15, fontWeight: '600' },

  // Button
  button: { height: 52, borderRadius: 12, overflow: 'hidden', shadowColor: '#003DA5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFFFFF', letterSpacing: 0.5 },

  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, marginTop: 24 },
  divider: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 16, color: '#94A3B8', fontSize: 12, fontFamily: 'Roboto_400Regular' },

  footerText: { textAlign: 'center', color: '#64748B', fontSize: isMobile ? 13 : 14, lineHeight: 22 },
  link: { color: '#002366', fontFamily: 'Inter_700Bold' },

  // Mobile layout
  mobileRoot: { flex: 1, backgroundColor: '#FFFFFF' },
  mobileHero: { backgroundColor: '#001233', alignItems: 'center', paddingTop: 45, paddingBottom: 46, paddingHorizontal: 24, overflow: 'hidden' },
  mobileLogo: { width: 48, height: 48 },
  mobileAppName: { fontFamily: 'Inter_900Black', fontSize: 22, color: '#FFFFFF', marginTop: 16, letterSpacing: 1 },
  mobileTagline: { fontFamily: 'Roboto_400Regular', fontSize: 13, color: '#93C5FD', marginTop: 4 },
  mobileFormScroll: { flex: 1, marginTop: -20, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  mobileFormContent: { padding: 24, paddingBottom: 60 },
  mobileNotch: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 4, alignSelf: 'center', marginBottom: 24 },

  stepIndicatorContainer: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  stepDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  stepDotActive: { backgroundColor: '#003DA5' },
});
