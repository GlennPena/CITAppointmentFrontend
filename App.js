import { useEffect, useState } from "react";
import { Image, Pressable, Text, StyleSheet, useWindowDimensions, View, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFonts, Inter_900Black, Inter_700Bold, Inter_500Medium } from '@expo-google-fonts/inter';
import { Roboto_400Regular } from '@expo-google-fonts/roboto';
import { ProstoOne_400Regular } from '@expo-google-fonts/prosto-one';

import { handleLogout } from "./utils/auth";
import { Typography, Colors, Radius } from "./styles/theme";

import LoginScreen from "./screens/LoginScreen";
import RegistrationScreen from "./screens/RegistrationScreen";
import ForgotPasswordScreen from "./screens/ForgotPasswordScreen";
import StudentDashboard from "./screens/StudentDashboard";
import AdminDashboard from "./screens/AdminDashboard";
import FacultyNavigation from "./screens/FacultyNavigation";
import VerificationScreen from "./screens/VerificationScreen";
import api from "./utils/api";


const Stack = createNativeStackNavigator();

// Header Logo Component
const HeaderLogo = ({ isMobile }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: isMobile ? 0 : 50 }}>
    <Image
      source={require('./assets/cit-logo.png')}
      style={{
        width: isMobile ? 35 : 65,
        height: isMobile ? 35 : 65,
        marginRight: 8,
      }}
      resizeMode="contain"
    />
    <Text>
      <Text style={{
        fontSize: isMobile ? 18 : 32,
        color: '#1A3655',
        fontFamily: 'ProstoOne_400Regular',
        letterSpacing: 0.5,
        lineHeight: isMobile ? 22 : 38,
        textShadowColor: '#001D3E',
        textShadowOffset: { width: 0.5, height: 0.5 },
        textShadowRadius: 1,
      }}>
        CIT{'\n'}
      </Text>
      <Text style={{
        fontSize: isMobile ? 12 : 20,
        color: '#1A3655',
        fontFamily: 'ProstoOne_400Regular',
        letterSpacing: 0.5,
        lineHeight: isMobile ? 16 : 24,
        textShadowColor: '#001D3E',
        textShadowOffset: { width: 0.5, height: 0.5 },
        textShadowRadius: 1,
      }}>
        APPOINTMENT
      </Text>
    </Text>
  </View>
);

// Logout Button Component
const LogoutButton = ({ navigation, isMobile }) => (
  <Pressable
    style={({ pressed, hovered }) => [
      styles.logoutButton,
      { marginRight: isMobile ? 10 : 70 },
      (hovered || pressed) && styles.logoutButtonActive
    ]}
    onPress={() => handleLogout(navigation)}
  >
    <MaterialCommunityIcons name="logout" size={16} color={Colors.error} />
    <Text style={styles.logoutButtonText}>Log Out</Text>
  </Pressable>
);


export default function App() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [initialRoute, setInitialRoute] = useState(null);

  const [fontsLoaded] = useFonts({
    'Inter_900Black': Inter_900Black,
    'Inter_700Bold': Inter_700Bold,
    'Inter_500Medium': Inter_500Medium,
    'Roboto_400Regular': Roboto_400Regular,
    'ProstoOne_400Regular': ProstoOne_400Regular,
  });

  // Check authentication status on app start
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          if (pathname.includes('/verify-slip/') || pathname.includes('/verify-meeting-report/')) {
            setInitialRoute("Verification");
            return;
          }
        }

        const accessToken = await AsyncStorage.getItem('access_token');
        const rememberMe = await AsyncStorage.getItem('remember_me');
        const role = await AsyncStorage.getItem('user_role');

        if (accessToken && rememberMe === 'true' && role) {
          if (role === 'admin') setInitialRoute("AdminDashboard");
          else if (role === 'faculty' || role === 'dean') setInitialRoute("FacultyHome");
          else setInitialRoute("StudentDashboard");

        } else {
          const keys = ['access_token', 'refresh_token', 'user_role', 'first_name', 'last_name'];
          await Promise.all(keys.map(key => AsyncStorage.removeItem(key)));
          setInitialRoute("Login");
        }

      } catch (e) {
        console.error("Auth initialization error:", e);
        setInitialRoute("Login");
      }
    };
    checkLoginStatus();
  }, []);

  if (!fontsLoaded || initialRoute === null) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ animation: 'fade' }}>

        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegistrationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Verification" component={VerificationScreen} options={{ headerShown: false }} />

        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
          options={({ navigation }) => ({
            headerTitle: () => <HeaderLogo isMobile={isMobile} />,
            headerLeft: () => null,
            headerTitleAlign: 'left',
            headerRight: () => <LogoutButton navigation={navigation} isMobile={isMobile} />,
            headerStyle: {
              backgroundColor: '#FFFFFF',
              height: isMobile ? 70 : 90,
            }
          })}
        />

        <Stack.Screen
          name="FacultyHome"
          component={FacultyNavigation}
          options={({ navigation }) => ({
            headerTitle: () => <HeaderLogo isMobile={isMobile} />,
            headerTitleAlign: 'left',
            headerRight: () => <LogoutButton navigation={navigation} isMobile={isMobile} />,
            headerStyle: {
              backgroundColor: '#FFFFFF',
              height: isMobile ? 70 : 90,
            }
          })}
        />

        <Stack.Screen
          name="StudentDashboard"
          component={StudentDashboard}
          options={({ navigation }) => ({
            headerTitle: () => <HeaderLogo isMobile={isMobile} />,
            headerLeft: () => null,
            headerTitleAlign: 'left',
            headerRight: () => <LogoutButton navigation={navigation} isMobile={isMobile} />,
            headerStyle: {
              backgroundColor: '#FFFFFF',
              height: isMobile ? 70 : 90,
            }
          })}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.12)',
    borderRadius: Radius.sm,
    marginRight: 70
  },
  logoutButtonActive: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderColor: 'rgba(220, 38, 38, 0.25)',
  },
  logoutButtonText: {
    color: Colors.error,
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_500Medium',
    letterSpacing: 0.2,
  },
});

