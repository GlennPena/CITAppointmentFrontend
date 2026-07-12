import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ImageBackground, 
  Image,
  useWindowDimensions
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { AppInput } from "../components/AppInput";
import InlineAlert from "../components/InlineAlert";
import { Toast } from "../components/Toast";
import PrivacyPolicyModal from "../components/PrivacyPolicyModal";

import api from "../utils/api";
import { Typography } from "../styles/theme";


export default function RegistrationScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const isTablet = width >= 480 && width < 1024;
  const styles = getStyles(isMobile, isTablet);

  const googleData = route.params?.googleData;
  const isGoogle = route.params?.isGoogle || false;

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
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

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

  const handleRegister = async () => {
    const {
      username, first_name, last_name, email, password, confirmPassword,
      date_of_birth, sex, contact_number, address, course, year, section
    } = formData;

    const academicFields = ["course", "year", "section"];
    const requiredFields = Object.keys(formData).filter((field) => {
      if (isStaff && academicFields.includes(field)) return false;
      return true;
    });
    const hasEmpty = requiredFields.some(field => !formData[field]);

    if (hasEmpty) {
      setAlertConfig({ message: "Please fill in all fields.", type: "error" });
      return;
    }

    if (!email.toLowerCase().endsWith("@ua.edu.ph")) {
      setAlertConfig({ message: "Please use your official UA email address.", type: "error" });
      return;
    }

    if (password !== confirmPassword) {
      setAlertConfig({ message: "Passwords do not match.", type: "error" });
      return;
    }

    setLoading(true);
    setAlertConfig({ message: "", type: "" });

    try {
      const { confirmPassword, ...dataToSend } = formData;

      // Send "N/A" for academic fields when registering as Staff/Employee
      if (isStaff) {
        dataToSend.course = "N/A";
        dataToSend.year = "N/A";
        dataToSend.section = "N/A";
      }

      const payload = isGoogle ? { ...dataToSend, is_google: true } : dataToSend;

      const response = await api.post("register/", payload);

      const { tokens, user } = response.data;
      const { access, refresh } = tokens;
      const { role, first_name, last_name } = user;

      await AsyncStorage.setItem("access_token", access);
      await AsyncStorage.setItem("refresh_token", refresh);
      await AsyncStorage.setItem("user_role", role);
      await AsyncStorage.setItem("first_name", first_name || "");
      await AsyncStorage.setItem("last_name", last_name || "");

      setToast({ visible: true, message: "Account created successfully!", type: "success" });

      Alert.alert(
        "Success!",
        "Your account has been created successfully. You will be redirected shortly.",
        [{ text: "OK" }]
      );

      setTimeout(() => {
        if (role === "admin") navigation.replace("AdminDashboard");
        else if (role === "doctor") navigation.replace("DoctorHome");
        else navigation.replace("PatientDashboard");
      }, 2000);

    } catch (error) {
      console.error("Registration error:", error);
      const backendError = error.response?.data
        ? Object.values(error.response.data)[0]
        : "Registration failed.";
      console.log("Setting error alert:", String(backendError));
      setAlertConfig({ message: String(backendError), type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <PrivacyPolicyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <ImageBackground 
        source={require('../assets/redox-01.png')} 
        style={[styles.screenWrapper, styles.container]}
        resizeMode="repeat"
      >

        {/* HEADER */}
        <Image 
          source={require('../assets/ua-clinic-logo.png')}
          style={styles.logo} 
          resizeMode="contain"
        />
 
        {/* CARD */}
        <View style={styles.card}>

          {/* HEADER */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Create Account</Text>
            <Text style={styles.heroSubtitle}>
              {isGoogle ? "Complete your UA Google Profile" : "Join UA Clinic Appointment System"}
            </Text>
          </View>

          <InlineAlert message={alertConfig.message} type={alertConfig.type} />

          {/* PERSONAL */}
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Personal Information</Text>

          <View style={[styles.row, isMobile && styles.rowMobile]}>
            <View style={styles.flex}>
              <AppInput 
                label="First Name" 
                value={formData.first_name} 
                editable={!isGoogle}
                style={isGoogle ? styles.readOnlyInput : null}
                onChangeText={(v) => updateField("first_name", v)} />
            </View>
            <View style={[styles.flex]}>
              <AppInput 
                label="Last Name" 
                value={formData.last_name} 
                editable={!isGoogle}
                style={isGoogle ? styles.readOnlyInput : null}
                onChangeText={(v) => updateField("last_name", v)} />
            </View>
          </View>


          {/* DOB AND SEX */}
          <View style={[styles.row, isMobile && styles.rowMobile]}>
            <View style={styles.flex}>
              <AppInput 
                style={styles.input}
                label="Date of Birth"
                value={formData.date_of_birth}
                onChangeText={(v) => updateField("date_of_birth", v)}
              />
            </View>

            <View style={[styles.flex, styles.genderWrapper]}>
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

          {/* CONTACT */}
          <Text style={styles.sectionTitle}>Contact Information</Text>
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

          {/* ACADEMIC */}
          <Text style={styles.sectionTitle}>Academic Information</Text>
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

          {/* ROLE TOGGLE */}
          <Pressable
            style={styles.checkboxRowRight}
            onPress={() => setIsStaff(!isStaff)}
          >
            <View style={[styles.checkbox, isStaff && styles.checkboxChecked]}>
              {isStaff && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              I am an Employee.
            </Text>
          </Pressable>

          {/* PASSWORD */}
          <Text style={styles.sectionTitle}>Account Information</Text>
          <AppInput 
            label="Username"
            value={formData.username}
            onChangeText={(v) => updateField("username", v)} />
          <AppInput label="Password" value={formData.password} secureTextEntry onChangeText={(v) => updateField("password", v)} />
          <AppInput label="Confirm Password" value={formData.confirmPassword} secureTextEntry onChangeText={(v) => updateField("confirmPassword", v)} />

          {/* DATA PRIVACY CONSENT */}
          <View style={styles.consentBox}>
            <Pressable
              style={styles.consentRow}
              onPress={() => setConsentGiven(!consentGiven)}
            >
              <View style={[styles.checkbox, consentGiven && styles.checkboxChecked]}>
                {consentGiven && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
              <Text style={styles.consentText}>
                I have read and agree to the collection, storage, and processing of my personal
                and health-related information by the UA Clinic Appointment System, in accordance
                with the Data Privacy Act of 2012 (RA 10173), solely for the purpose of managing
                and scheduling clinic appointments and related health services within the
                university.{" "}
                <Text
                  style={styles.consentLink}
                  onPress={() => setPrivacyModalVisible(true)}
                >
                  Read full Privacy Policy
                </Text>
              </Text>
            </Pressable>
          </View>

          {/* BUTTON */}
          <Pressable
            style={[
              styles.button, 
              styles.buttonPrimary, 
              (loading || !consentGiven) && { opacity: 0.5 }
            ]}
            onPress={handleRegister}
            disabled={loading || !consentGiven}
          >
            <Text style={styles.buttonPrimaryText}>
              {loading ? "Creating Account..." : "Create Account"}
            </Text>
          </Pressable>

          {/* FOOTER */}
          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.footer}>
              Already have an account? <Text style={styles.link}>Login</Text>
            </Text>
          </Pressable>

        </View>
      </ImageBackground>
    </ScrollView>
    </>
  );
}

const getStyles = (isMobile, isTablet) => StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  buttonPrimary: {
    backgroundColor: '#002366',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimaryText: {
    ...Typography.label,
    textAlign: 'center',
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: isMobile ? 14 : 16,
  },

  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    width: '100%',
    height: '100%', 
    padding: 70
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  visualSide: {
    display: 'none',
    width: '50%',
    backgroundColor: '#2563EB',
    padding: 48,
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  visualText: {
    color: '#FFFFFF',
    fontSize: isMobile ? 24 : 32,
  },
  formSide: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    width: '100%',
    maxWidth: 448
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32
  },
  stepDot: {
    height: 6,
    flex: 1,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    transition: 'all'
  },
  stepDotActive: {
    backgroundColor: '#2563EB'
  },

  logo: {
    width: isMobile ? 180 : isTablet ? 260 : 350,
    height: isMobile ? 70 : 120,
    marginBottom: 30,
  },
  
  card: {
    width: '100%',
    maxWidth: isMobile ? 448 : 650,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    shadowColor: '#E2E8F0',
    padding: 40,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    marginBottom: 40,
  },

  hero: {
    alignItems: "center",
    marginBottom: 20,
  },
  heroTitle: {
    ...Typography.header,
    alignItems: 'center',
    fontSize: isMobile ? 26 : 32,
    fontWeight: '1000',
    textAlign: 'center',
    color: '#002366',
  },
  heroSubtitle: {
    ...Typography.caption,
    fontSize: isMobile ? 12 : 14,
    fontWeight: '400',
    textAlign: 'center',
    color: '#888', 
    marginBottom: 20
  },


  sectionTitle: {
    ...Typography.title,
    fontSize: isMobile ? 16 : 18,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: '#002366',
    marginTop: 30
  },

  row: {
    flexDirection: "row",
    alignItems: 'flex-end',
    gap: 15
  },
  flex: {
    flex: 1,
  },
  rowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 0
  },

  genderWrapper: {
    justifyContent: 'flex-end', 
    paddingBottom: 12,                     
  },

  chip: {
    flex: 1,
    height: 50,      
    borderRadius: 12, 
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center", 
    marginTop: 12
  },
  chipSelected: {
    backgroundColor: "#002366",
  },
  chipText: {
    ...Typography.body,
    color: "#64748B",
    fontSize: isMobile ? 14 : 16,
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: isMobile ? 14 : 16,
  },

  button: {
    backgroundColor: "#002366",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: isMobile ? 13 : 16,
  },

  footer: {
   ...Typography.body,
    textAlign: 'center',
    marginTop: 15,
    color: '#666',
    fontSize: isMobile ? 12 : 14,
  },
  link: {
    color: "#002366",
    fontWeight: "bold",
  },
  input: {
    fontSize: isMobile ? 14 : 16,
  },

  readOnlyInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B', 
    borderColor: '#E2E8F0',
  },

  disabledInput: {
    backgroundColor: '#E5E7EB',
    color: '#9CA3AF',
    borderColor: '#D1D5DB',
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 10,
  },
  checkboxRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#002366',
    borderColor: '#002366',
  },
  checkboxMark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    ...Typography.body,
    fontSize: isMobile ? 13 : 15,
    color: '#334155',
  },

  consentBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginTop: 24,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  consentText: {
    ...Typography.body,
    flex: 1,
    fontSize: isMobile ? 12 : 13,
    lineHeight: isMobile ? 18 : 20,
    color: '#475569',
    textAlign: 'justify',
  },
  consentLink: {
    color: '#002366',
    fontWeight: 'bold',
  },
});