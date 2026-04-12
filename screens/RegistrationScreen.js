import { useState } from "react";
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

import api from "../utils/api";
import { Typography } from "../styles/theme";


export default function RegistrationScreen({ navigation }) {
  const { width } = useWindowDimensions();

  const isMobile = width < 480;
  const isTablet = width >= 480 && width < 1024;

  const styles = getStyles(isMobile, isTablet);

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

  const [alertConfig, setAlertConfig] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleRegister = async () => {
    const {
      username, first_name, last_name, email, password, confirmPassword,
      date_of_birth, sex, contact_number, address, course, year, section
    } = formData;

    if (!username || !email || !password || !first_name || !last_name || !course ||
      !year || !section || !date_of_birth || !sex || !contact_number || !address || !confirmPassword) {
      setAlertConfig({ message: "Please fill in all fields.", type: "error" });
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

      const response = await api.post("register/", dataToSend);

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
            <Text style={styles.heroSubtitle}>Join UA Clinic Appointment System</Text>
          </View>

          <InlineAlert message={alertConfig.message} type={alertConfig.type} />

          {/* PERSONAL */}
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Personal Information</Text>

          <View style={[styles.row, isMobile && styles.rowMobile]}>
            <View style={styles.flex}>
              <AppInput 
                label="First Name" 
                value={formData.first_name} 
                onChangeText={(v) => updateField("first_name", v)} />
            </View>
            <View style={[styles.flex]}>
              <AppInput 
                label="Last Name" 
                value={formData.last_name} 
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
            onChangeText={(v) => updateField("email", v)} />

          <AppInput 
            label="Address"
            value={formData.address}
            onChangeText={(v) => updateField("address", v)} />

          {/* ACADEMIC */}
          <Text style={styles.sectionTitle}>Academic Information</Text>
          <AppInput 
            label="Course"
            value={formData.course}
            onChangeText={(v) => updateField("course", v)} />

          <View style={styles.row}>
            <View style={styles.flex}>
              <AppInput 
                label="Year" 
                value={formData.year}
                onChangeText={(v) => updateField("year", v)} />
            </View>
            <View style={[styles.flex]}>
              <AppInput 
                label="Section"
                value={formData.section}
                onChangeText={(v) => updateField("section", v)} />
            </View>
          </View>

          {/* PASSWORD */}
          <Text style={styles.sectionTitle}>Account Information</Text>
          <AppInput 
            label="Username"
            value={formData.username}
            onChangeText={(v) => updateField("username", v)} />
          <AppInput label="Password" value={formData.password} secureTextEntry onChangeText={(v) => updateField("password", v)} />
          <AppInput label="Confirm Password" value={formData.confirmPassword} secureTextEntry onChangeText={(v) => updateField("confirmPassword", v)} />

          {/* BUTTON */}
          <Pressable
            style={[styles.button, styles.buttonPrimary, loading && { opacity: 0.7 }]}
            onPress={handleRegister}
            disabled={loading}
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
});