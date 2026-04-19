import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground, 
  Image, 
  useWindowDimensions,
  Platform
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import InlineAlert from "../components/InlineAlert";
import { AppInput } from "../components/AppInput";

import api, { GOOGLE_WEB_CLIENT_ID } from "../utils/api";
import { Typography } from "../styles/theme";


if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID, 
    offlineAccess: true,
  });
}

export default function LoginScreen({ navigation }) {
  
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const styles = getStyles(isMobile);

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
        else if (role === "doctor") navigation.replace("DoctorHome");
        else navigation.replace("PatientDashboard");
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
      // Save tokens and user info
      await AsyncStorage.setItem('access_token', tokens.access);
      await AsyncStorage.setItem('user_role', user.role);
      await AsyncStorage.setItem('first_name', user.first_name);
      await AsyncStorage.setItem('last_name', user.last_name);

      setAlertConfig({ message: "Welcome back!", type: "success" });

      setTimeout(() => {
        if (user.role === "admin") navigation.replace("AdminDashboard");
        else if (user.role === "doctor") navigation.replace("DoctorHome");
        else navigation.replace("PatientDashboard");
      }, 800);

    } else if (action === "register") {
      setAlertConfig({ message: "Almost there! Please complete your profile.", type: "success" });

      setTimeout(() => {
        navigation.navigate("Register", { 
          isGoogle: true, 
          googleData: google_info 
        });
      }, 1000);
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      const initializeGoogle = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_WEB_CLIENT_ID,
            callback: handleWebGoogleResponse, 
            use_fedcm_for_prompt: true,
          });
        }
      };

      if (window.google) {
        initializeGoogle();
      } else {
        const interval = setInterval(() => {
          if (window.google) {
            initializeGoogle();
            clearInterval(interval);
          }
        }, 1000);
      }
    }
  }, []);

  const handleWebGoogleResponse = async (response) => {
    console.log("Full Google Response:", response); 
    setGoogleLoading(true);
    
    try {
      const backendRes = await api.post("google-auth/", { 
        id_token: response.credential 
      });
      
      console.log("Backend response received:", backendRes.data);
      handleBackendResponse(backendRes.data);
    } catch (err) {
      console.error("Backend Auth Error:", err);
      setAlertConfig({ message: "Verification failed with server.", type: "error" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAlertConfig({ message: "", type: "" });

    if (Platform.OS === 'web') {
      if (window.google) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setAlertConfig({ 
            message: "Please allow third-party sign-in in your browser settings.", 
            type: "error" 
          });
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
        console.error("Google Sign-In Error:", error);
        setAlertConfig({ message: "Sign-in failed", type: "error" });
      } finally {
        setGoogleLoading(false);
      }
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/redox-01.png')} 
      style={styles.container}
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

        <Text style={styles.header}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your UA Clinic account</Text>

        <InlineAlert message={alertConfig.message} type={alertConfig.type} />
        
        {/* USERNAME */}
        <View style={styles.inputWrapper}>
          <AppInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            setError={(val) => setAlertConfig({ ...alertConfig, message: val })}
          />
        </View>

        {/* PASSWORD */}
        <View style={styles.inputWrapper}>
          <AppInput
            label="Password"
            value={password}
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
            setError={(val) => setAlertConfig({ ...alertConfig, message: val })}
          />
        </View>

        {/* REMEMBER ME */}
        <View style={styles.row}>
          <Pressable
            onPress={() => setRememberMe(!rememberMe)}
            style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
          >
            {rememberMe && <Text style={styles.checkmark}>✓</Text>}
          </Pressable>
          <Text style={styles.rememberText}>Remember Me</Text>
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
        
        {/* DIVIDER */}
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.divider} />
        </View>
        
        {/* GOOGLE SIGN IN */}
        <TouchableOpacity 
          style={styles.googleButton} 
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator color="#444" />
          ) : (
            <View style={styles.googleContent}>
              <Image 
                source={require('../assets/google-logo.png')} 
                style={{ width: 23, height: 23 }} 
              />
              <Text style={styles.googleButtonText}>Continue with UA Email</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* SECURITY NOTE */}
        <Text style={styles.securityText}>
          Your information is securely protected
        </Text>

        {/* REGISTER */}
        <Pressable onPress={() => navigation.navigate("Register")}>
          <Text style={styles.registerText}>
            Don't have an account? <Text style={styles.link}>Register here</Text>
          </Text>
        </Pressable>

      </View>
    </ImageBackground>
  );
}

const getStyles = (isMobile) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    width: '100%',
    height: '100%', 
    paddingHorizontal: isMobile ? 20 : 40,
  },
  logo: {
    width: isMobile ? 220 : 500,
    height: isMobile ? 80 : 130,
    marginBottom: isMobile ? 20 : 30,
  },
  card: {
    width: '100%',
    maxWidth: isMobile ? 380 : 448,
    backgroundColor: '#FFFFFF',
    borderRadius: isMobile ? 24 : 40,
    ...(isMobile
      ? {}
      : {
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 8,
          shadowColor: '#E2E8F0',
        }),
    padding: isMobile ? 20 : 40,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  header: {
    ...Typography.header,
    alignItems: 'center',
    fontSize: isMobile ? 26 : 36,
    fontWeight: '1000',
    textAlign: 'center',
    color: '#002366',
    letterSpacing: 0.5,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: isMobile ? 13 : 15,
    fontWeight: '400',
    textAlign: 'center',
    color: '#888', 
    marginBottom: isMobile ? 20 : 40,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    height: 50,
    marginVertical: 10
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: isMobile ? 20 : 30,
  },
  checkbox: {
    width: 18,
    height: 18,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#ddd6d6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#002366',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
  },
  rememberText: {
    ...Typography.body,
    marginLeft: 8,
    color: '#888',
    fontSize: isMobile ? 12 : 14,
  },
  button: {
    width: '100%',
    backgroundColor: '#002366',
    paddingVertical: isMobile ? 12 : 16,
    borderRadius: 16,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    shadowColor: '#002366',
    transition: 'all'
  },
  buttonText: {
    ...Typography.label,
    textAlign: 'center',
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: isMobile ? 14 : 16,
  },
  securityText: {
    ...Typography.body,
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 10
  },
  registerText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: 15,
    color: '#666',
    fontSize: isMobile ? 12 : 14,
  },
  link: {
    fontWeight: '600',
    color: '#002366',
  },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: isMobile ? 12 : 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleButtonText: {
    marginLeft: 10,
    fontSize:  isMobile ? 12 : 15,
    color: '#475569',
    fontFamily: 'Inter_500Medium',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: isMobile ? 14: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#94A3B8',
    fontSize: 12,
  },
});
