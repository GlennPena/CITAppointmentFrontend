import { useEffect, useState } from "react";
import { Image, Pressable, Text, StyleSheet, useWindowDimensions } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useFonts, Inter_900Black, Inter_700Bold, Inter_500Medium } from '@expo-google-fonts/inter';
import { Roboto_400Regular } from '@expo-google-fonts/roboto';

import { handleLogout } from "./utils/auth";
import { Typography } from "./styles/theme";

import LoginScreen from "./screens/LoginScreen";
import RegistrationScreen from "./screens/RegistrationScreen";
import PatientDashboard from "./screens/PatientDashboard";
import AdminDashboard from "./screens/AdminDashboard";
import DoctorNavigation from "./screens/DoctorNavigation";


const Stack = createNativeStackNavigator();

// Logout Button Component
const LogoutButton = ({ navigation, isMobile }) => (
  <Pressable
    style={({ pressed }) => [
      styles.logoutButton,
      { marginRight: isMobile ? 10 : 30 },
      pressed && styles.logoutButtonPressed
    ]}
    onPress={() => handleLogout(navigation)}
  >
    <MaterialCommunityIcons name="logout" size={18} color="#ffffff" />
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
  });

  // Check authentication status on app start
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('access_token');
        const rememberMe = await AsyncStorage.getItem('remember_me');
        const role = await AsyncStorage.getItem('user_role');

        if (accessToken && rememberMe === 'true' && role) {
          if (role === 'admin') setInitialRoute("AdminDashboard");
          else if (role === 'doctor') setInitialRoute("DoctorHome");
          else setInitialRoute("PatientDashboard");

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
      <Stack.Navigator initialRouteName={initialRoute}>
        
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegistrationScreen} options={{ headerShown: false }}  />

        <Stack.Screen 
          name="AdminDashboard" 
          component={AdminDashboard} 
          options={({ navigation }) => ({
            headerTitle: () => (
              <Image 
                resizeMode="contain"
                source={require('./assets/ua-clinic-logo.png')} 
                style={{
                width: isMobile ? 120 : 180,
                height: isMobile ? 40 : 60,
                marginLeft: isMobile ? 0 : 20,
              }}
              />
            ),
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
          name="DoctorHome" 
          component={DoctorNavigation} 
          options={({ navigation }) => ({
            headerTitle: () => (
              <Image 
                resizeMode="contain"
                source={require('./assets/ua-clinic-logo.png')} 
                style={{
                  width: isMobile ? 120 : 180,
                  height: isMobile ? 40 : 60,
                  marginLeft: isMobile ? 0 : 20,
                }} 
              />
            ),
            headerTitleAlign: 'left',
            headerRight: () => <LogoutButton navigation={navigation} isMobile={isMobile} />,
            headerStyle: {
              backgroundColor: '#FFFFFF', 
              height: isMobile ? 70 : 90,
            }
          })}
        />

        <Stack.Screen 
          name="PatientDashboard" 
          component={PatientDashboard} 
          options={({ navigation }) => ({
            headerTitle: () => (
              <Image 
                resizeMode="contain"
                source={require('./assets/ua-clinic-logo.png')} 
                style={{
                width: isMobile ? 120 : 180,
                height: isMobile ? 40 : 60,
                marginLeft: isMobile ? 0 : 20,
              }}
              />
            ),
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F87171',
    borderRadius: 5,
    marginRight: 70
  },
  logoutButtonPressed: {
    backgroundColor: '#DC2626',
  },
  logoutButtonText: {
    ...Typography.label,
    color: '#FFFFFF',
    marginLeft: 5,
    fontSize: 12,
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
  },
});

