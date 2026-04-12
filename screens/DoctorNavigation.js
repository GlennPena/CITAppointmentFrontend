import { useWindowDimensions } from "react-native";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Typography } from "../styles/theme";

import DoctorDashboard from './DoctorDashboard';
import DoctorSchedule from './DoctorSchedule';
import PatientHistory from './PatientHistory';


const Tab = createBottomTabNavigator();


export default function DoctorTabs() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarPosition: isMobile ? 'bottom' : 'left',

        tabBarLabelPosition: 'beside-icon',
        tabBarShowLabel: isMobile ? false : true,

        tabBarStyle: {
          minWidth: isDesktop ? 300 : 220,
          borderRightWidth: isMobile ? 0 : 1,
          borderTopWidth: isMobile ? 1 : 0,
          borderTopColor: '#E2E8F0',
          borderRightColor: '#E2E8F0',
          backgroundColor: 'rgba(248,250,252,0.96)',
          paddingHorizontal: isMobile ? 0 : 12,
          paddingTop: isMobile ? 13 : 20,
          height: isMobile ? 65 : '100%',
        },

        tabBarActiveBackgroundColor: isMobile ? 'transparent' : '#002366',
        tabBarActiveTintColor: isMobile ? '#002366' : '#FFFFFF',
        tabBarInactiveTintColor: '#2b4169',

        tabBarItemStyle: {
          height: 40,
          borderRadius: 12,
          marginVertical: isMobile ? 0 : 10,
          flexDirection: 'column',
          justifyContent: 'center',
          paddingHorizontal: isDesktop ? 14 : 4,
        },
        
        tabBarLabelStyle: {
          ...Typography.title,
          fontSize: isDesktop? 17 : isMobile ? 13 : 15,
          fontWeight: '400',
          paddingVertical: isMobile ? 0 : 10,
          marginLeft: 15,
          paddingLeft: isDesktop ? 20 : 0
        },

        tabBarIcon: ({ color }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'view-dashboard';
          } else if (route.name === 'Schedule') {
            iconName = 'calendar-clock';
          } else if (route.name === 'Patients') {
            iconName = 'account-group';
          }

          return <MaterialCommunityIcons name={iconName} size={isDesktop ? 28 : 26} color={color} style={{ marginLeft: isDesktop ? 30 : 0}}/>;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DoctorDashboard} />
      <Tab.Screen name="Schedule" component={DoctorSchedule} />
      <Tab.Screen name="Patients" component={PatientHistory} />
    </Tab.Navigator>
  );
}