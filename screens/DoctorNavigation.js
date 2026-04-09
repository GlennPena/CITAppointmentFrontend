import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import your new screen files
import DoctorDashboard from './DoctorDashboard';
import DoctorSchedule from './DoctorSchedule';
import PatientHistory from './PatientHistory';

const Tab = createBottomTabNavigator();

export default function DoctorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'view-dashboard';
          } else if (route.name === 'Schedule') {
            iconName = 'calendar-clock';
          } else if (route.name === 'Patients') {
            iconName = 'account-group';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0052FF',
        tabBarInactiveTintColor: '#94A3B8',
        headerStyle: { backgroundColor: '#F8FAFC' },
        headerTitleStyle: { fontWeight: '800' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DoctorDashboard} />
      <Tab.Screen name="Schedule" component={DoctorSchedule} />
      <Tab.Screen name="Patients" component={PatientHistory} />
    </Tab.Navigator>
  );
}