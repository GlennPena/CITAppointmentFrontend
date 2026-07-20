import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, Pressable, ScrollView, ImageBackground, useWindowDimensions, Animated } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AdminAppointmentRow from "../components/AdminAppointmentTable";
import StudentDetailModal from "../components/StudentDetailModal";
import StatBox from "../components/StatBox";
import InlineAlert from "../components/InlineAlert";
import { ConfirmModal } from "../components/ConfirmModal";
import { Toast } from "../components/Toast";
import { StatusFilter } from "../components/StatusFilter";
import PaginationControls from "../components/PaginationControls";

import api from "../utils/api";
import { Typography } from "../styles/theme";


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

const AnimatedNumber = ({ value, style, startAnimation = true }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!startAnimation) return;

    let startValue = 0;
    const duration = 1500;
    const frames = 30;
    const stepTime = Math.abs(Math.floor(duration / frames));
    const increment = value / frames;

    const timer = setInterval(() => {
      startValue += increment;
      if (startValue >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.ceil(startValue));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, startAnimation]);

  return <Text style={style}>{displayValue}</Text>;
};

const AnimatedBar = ({ percentage, color, startAnimation = true }) => {
  const [widthAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!startAnimation) return;

    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [percentage, startAnimation]);

  return (
    <View style={stylesStatic.progressBarBg}>
      <Animated.View 
        style={[
          stylesStatic.progressBarFill, 
          { 
            backgroundColor: color,
            width: widthAnim.interpolate({
              inputRange: [0, 100],
              outputRange: ['0%', '100%']
            })
          }
        ]} 
      />
    </View>
  );
};

const stylesStatic = StyleSheet.create({
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});


export default function AdminDashboard({ navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const styles = getStyles(isMobile);

  const fadeAnim = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const entryScale = fadeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.99, 1],
  });

  const [appointments, setAppointments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [confirmDelete, setConfirmDelete] = useState({ visible: false, id: null });

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });

  // Scroll visibility states
  const [analyticsScrollY, setAnalyticsScrollY] = useState(0);
  const [distributionY, setDistributionY] = useState(1000);
  const { height: screenHeight } = useWindowDimensions();
  const isDistributionVisible = analyticsScrollY + screenHeight > distributionY + 100;

  // Personnel Management State
  const [personnel, setPersonnel] = useState([]);
  const [showAddPersonnelModal, setShowAddPersonnelModal] = useState(false);
  const [personnelForm, setPersonnelForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    role: "faculty",
    password: "",
  });

  const [activeFilter, setActiveFilter] = useState("All");
  const [sidebarSelection, setSidebarSelection] = useState("Overview");
  const filterOptions = ["All", "Completed", "Cancelled", "Rejected"];

  const [accountFilter, setAccountFilter] = useState("All");
  const accountFilterOptions = ["All", "Student", "Faculty", "Dean", "Admin"];

  // Password Reset State
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [resetPasswordForm, setResetPasswordForm] = useState({ password: "", confirmPassword: "" });
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);

  useEffect(() => {
    loadData();
    loadPersonnel();
  }, []);

  const loadData = async () => {
    try {
      setError(null);
      const res = await api.get("appointments/");
      setAppointments(res.data);
      updateStats(res.data);
      extractStudents(res.data);
    } catch (err) {
      setError("Failed to load appointment records. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const extractStudents = (appointmentData) => {
    const studentMap = {};
    appointmentData.forEach(appt => {
      const studentId = appt.student;
      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          id: studentId,
          name: appt.student_name,
          email: appt.student_email,
          appointmentCount: 0
        };
      }
      studentMap[studentId].appointmentCount += 1;
    });
    setStudents(Object.values(studentMap));
  };

  const updateStats = (data) => {
    const now = new Date();

    const ongoing = data.filter(a => {
      const appointmentDate = a.dateTime ? new Date(a.dateTime) : null;
      return a.status === "Approved" && appointmentDate && appointmentDate <= now;
    }).length;

    setStats({
      total: data.length,
      pending: data.filter(a => a.status === 'Pending').length,
      approved: data.filter(a => a.status === 'Approved').length,
      ongoing: ongoing,
    });
  };

  const deleteUser = async (id) => {
    try {
      await api.delete(`users/${id}/`);
      setToast({ visible: true, message: "User deleted successfully", type: "success" });
      loadPersonnel();
    } catch (err) {
      setToast({ visible: true, message: "Failed to delete user", type: "error" });
    }
  };

  const [confirmUserDelete, setConfirmUserDelete] = useState({ visible: false, id: null });

  const requestUserDelete = (id) => {
    setConfirmUserDelete({ visible: true, id });
  };

  const executeUserDelete = () => {
    deleteUser(confirmUserDelete.id);
    setConfirmUserDelete({ visible: false, id: null });
  };

  // DELETE FLOW
  const requestDelete = (id) => {
    setConfirmDelete({ visible: true, id });
  };

  const executeDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ visible: false, id: null });

    try {
      await api.delete(`appointments/${id}/`);
      setToast({ visible: true, message: "Record deleted permanently", type: "success" });
      loadData();
    } catch (err) {
      setToast({ visible: true, message: "Deletion failed", type: "error" });
    }
  };

  // PERSONNEL MANAGEMENT
  const handleAddPersonnel = async () => {
    try {
      const payload = {
        username: personnelForm.username,
        email: personnelForm.email,
        password: personnelForm.password,
        role: personnelForm.role.toLowerCase(),
        first_name: personnelForm.firstName,
        last_name: personnelForm.lastName,
        contact_number: personnelForm.contact,
      };

      const response = await api.post("/admin/add-personnel/", payload);

      // Reset form after success
      setPersonnelForm({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        contact: "",
        role: "faculty",
        password: "",
      });

      setShowAddPersonnelModal(false);
      loadPersonnel();
      setToast({ visible: true, message: "Account created successfully", type: "success" });
    } catch (error) {
      const errData = error.response?.data;
      let msg = "Failed to create account";
      if (errData) {
        if (typeof errData === "string") {
          msg = errData;
        } else if (errData.error) {
          msg = errData.error;
        } else if (typeof errData === "object") {
          const firstKey = Object.keys(errData)[0];
          if (firstKey) {
            const val = errData[firstKey];
            msg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
          }
        }
      }
      setToast({
        visible: true,
        message: msg,
        type: "error"
      });
    }
  };

  const loadPersonnel = async () => {
    try {
      const res = await api.get("users/");
      setPersonnel(res.data);
    } catch (err) {
      console.log("Failed to load personnel");
    }
  };

  const requestPasswordReset = (user) => {
    setSelectedUserForReset(user);
    setResetPasswordForm({ password: "", confirmPassword: "" });
    setShowResetPasswordModal(true);
  };

  const handleResetPassword = async () => {
    const { password, confirmPassword } = resetPasswordForm;
    if (!password) {
      setToast({ visible: true, message: "Password cannot be empty", type: "error" });
      return;
    }
    if (password !== confirmPassword) {
      setToast({ visible: true, message: "Passwords do not match", type: "error" });
      return;
    }
    try {
      await api.patch(`users/${selectedUserForReset.id}/`, { password });
      setToast({ visible: true, message: "Password reset successfully", type: "success" });
      setShowResetPasswordModal(false);
    } catch (err) {
      setToast({ visible: true, message: "Failed to reset password", type: "error" });
    }
  };

  const filteredAppointments = Array.isArray(appointments)
    ? appointments.filter(item => {
      const matchesSearch = item.student_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const now = new Date();
      const appointmentDate = item.date_time ? new Date(item.date_time) : null;

      const isOngoing =
        item.status === "Approved" && appointmentDate && appointmentDate <= now;

      let matchesStatus = false;

      if (activeFilter === "All") {
        matchesStatus = true;
      } else if (activeFilter === "Ongoing") {
        matchesStatus = isOngoing;
      } else {
        matchesStatus = item.status?.toLowerCase() === activeFilter.toLowerCase();
      }

      return matchesSearch && matchesStatus;
    })
    : [];

  const filteredPersonnel = personnel.filter(p => {
    const matchesSearch =
      p.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesRole = false;

    if (accountFilter === "All") {
      matchesRole = true;
    } else {
      matchesRole = p.role?.toLowerCase() === accountFilter.toLowerCase();
    }

    return matchesSearch && matchesRole;
  });

  const RECORDS_PER_PAGE = 10;
  const [overviewPage, setOverviewPage] = useState(1);
  const [studentsPage, setStudentsPage] = useState(1);
  const [personnelPage, setPersonnelPage] = useState(1);

  useEffect(() => {
    setOverviewPage(1);
    setStudentsPage(1);
    setPersonnelPage(1);
  }, [searchQuery, activeFilter, accountFilter, sidebarSelection]);

  const totalOverviewPages = Math.ceil(filteredAppointments.length / RECORDS_PER_PAGE);
  const clampedOverviewPage = Math.min(Math.max(1, overviewPage), Math.max(1, totalOverviewPages));
  const paginatedAppointments = filteredAppointments.slice(
    (clampedOverviewPage - 1) * RECORDS_PER_PAGE,
    clampedOverviewPage * RECORDS_PER_PAGE
  );

  const filteredStudentsList = students.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalStudentPages = Math.ceil(filteredStudentsList.length / RECORDS_PER_PAGE);
  const clampedStudentPage = Math.min(Math.max(1, studentsPage), Math.max(1, totalStudentPages));
  const paginatedStudents = filteredStudentsList.slice(
    (clampedStudentPage - 1) * RECORDS_PER_PAGE,
    clampedStudentPage * RECORDS_PER_PAGE
  );

  const totalPersonnelPages = Math.ceil(filteredPersonnel.length / RECORDS_PER_PAGE);
  const clampedPersonnelPage = Math.min(Math.max(1, personnelPage), Math.max(1, totalPersonnelPages));
  const paginatedPersonnel = filteredPersonnel.slice(
    (clampedPersonnelPage - 1) * RECORDS_PER_PAGE,
    clampedPersonnelPage * RECORDS_PER_PAGE
  );

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#0052FF" style={{ flex: 1 }} />
    );
  }

  const renderAnalyticsView = () => {
    // 1. Calculations
    const totalAppointments = appointments.length;
    const completedCount = appointments.filter(a => a.status === 'Completed').length;
    const pendingCount = appointments.filter(a => a.status === 'Pending').length;
    const cancelledOrRejectedCount = appointments.filter(a => a.status === 'Cancelled' || a.status === 'Rejected').length;

    // Faculty stats
    const facultyStatsMap = {};
    appointments.forEach(appt => {
      if (appt.faculty_name) {
        if (!facultyStatsMap[appt.faculty_name]) {
          facultyStatsMap[appt.faculty_name] = { name: appt.faculty_name, total: 0, completed: 0 };
        }
        facultyStatsMap[appt.faculty_name].total += 1;
        if (appt.status === 'Completed') facultyStatsMap[appt.faculty_name].completed += 1;
      }
    });
    const topFaculty = Object.values(facultyStatsMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Student stats
    const studentStatsMap = {};
    appointments.forEach(appt => {
      if (appt.student_name) {
        if (!studentStatsMap[appt.student_name]) {
          studentStatsMap[appt.student_name] = { name: appt.student_name, email: appt.student_email || "N/A", total: 0 };
        }
        studentStatsMap[appt.student_name].total += 1;
      }
    });
    const topStudents = Object.values(studentStatsMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Service stats
    const serviceStatsMap = {};
    appointments.forEach(appt => {
      const service = appt.service || 'General Consultation';
      serviceStatsMap[service] = (serviceStatsMap[service] || 0) + 1;
    });
    const topServices = Object.entries(serviceStatsMap)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count);

    // Status breakdown with percentages
    const statusChoices = ['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled', 'Expired'];
    const statusStats = statusChoices.map(status => {
      const count = appointments.filter(a => a.status === status).length;
      const percentage = totalAppointments > 0 ? ((count / totalAppointments) * 100).toFixed(0) : 0;
      return { status, count, percentage };
    });

    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.listContent, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => setAnalyticsScrollY(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
      >
        <View style={styles.header}>
          <Orb style={{ width: 120, height: 120, backgroundColor: '#4F8EF7', top: -30, left: -20 }} delay={0} />
          <Orb style={{ width: 180, height: 180, backgroundColor: '#93C5FD', bottom: -50, right: -40 }} delay={1500} />
          <Orb style={{ width: 100, height: 100, backgroundColor: '#60A5FA', top: '20%', right: '48%' }} delay={3000} />
          <Orb style={{ width: 60, height: 60, backgroundColor: '#BFDBFE', bottom: '10%', left: '25%' }} delay={800} />
          <Orb style={{ width: 150, height: 150, backgroundColor: '#3B82F6', top: -40, right: '25%' }} delay={2200} />
          <Text style={[styles.title, styles.pageTitle]}>Reports & Analytics</Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 4 }}>
            Real-time consultation metrics and leaderboard statistics
          </Text>
        </View>

        {/* METRICS ROW */}
        <View style={[styles.statsRow, isMobile && { gap: 10 }]}>
          <StatBox label="Total Consultations" value={totalAppointments} color="#0F172A" icon="file-document-outline" />
          <StatBox label="Completed" value={completedCount} color="#10B981" icon="check-circle-outline" />
          <StatBox label="Pending" value={pendingCount} color="#F59E0B" icon="clock-outline" />
          <StatBox label="Cancelled/Rejected" value={cancelledOrRejectedCount} color="#EF4444" icon="close-circle-outline" />
        </View>

        {/* LEADERBOARDS SIDE-BY-SIDE */}
        <View style={[styles.analyticsRow, isMobile && { flexDirection: 'column' }]}>
          {/* TOP FACULTY */}
          <View style={[styles.analyticsCard, { flex: 1 }]}>
            <View style={styles.analyticsCardHeader}>
              <MaterialCommunityIcons name="trophy-outline" size={20} color="#F59E0B" />
              <Text style={styles.analyticsCardTitle}>Top Faculty (Most Consultations)</Text>
            </View>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View style={styles.analyticsCardBody}>
                {topFaculty.length === 0 ? (
                  <Text style={styles.emptyText}>No consultation data available.</Text>
                ) : (
                  topFaculty.map((item, index) => (
                    <View key={item.name} style={styles.leaderboardRow}>
                      <View style={styles.leaderboardRankContainer}>
                        <Text style={styles.leaderboardRankText}>#{index + 1}</Text>
                      </View>
                      <View style={styles.leaderboardInfo}>
                        <Text style={styles.leaderboardName}>{item.name}</Text>
                        <Text style={styles.leaderboardSub}>Completed: {item.completed} / Total: {item.total}</Text>
                      </View>
                      <AnimatedNumber value={item.total} style={styles.leaderboardCount} />
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>

          {/* TOP STUDENTS */}
          <View style={[styles.analyticsCard, { flex: 1 }]}>
            <View style={styles.analyticsCardHeader}>
              <MaterialCommunityIcons name="account-star-outline" size={20} color="#0052FF" />
              <Text style={styles.analyticsCardTitle}>Top Students (Most Consultations)</Text>
            </View>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View style={styles.analyticsCardBody}>
                {topStudents.length === 0 ? (
                  <Text style={styles.emptyText}>No student data available.</Text>
                ) : (
                  topStudents.map((item, index) => (
                    <View key={item.name} style={styles.leaderboardRow}>
                      <View style={[styles.leaderboardRankContainer, { backgroundColor: '#E0F2FE' }]}>
                        <Text style={[styles.leaderboardRankText, { color: '#0369A1' }]}>#{index + 1}</Text>
                      </View>
                      <View style={styles.leaderboardInfo}>
                        <Text style={styles.leaderboardName}>{item.name}</Text>
                        <Text style={styles.leaderboardSub}>{item.email}</Text>
                      </View>
                      <AnimatedNumber value={item.total} style={styles.leaderboardCount} />
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* SERVICE AND STATUS BREAKDOWNS */}
        <View 
          style={[styles.analyticsRow, isMobile && { flexDirection: 'column' }, { marginTop: 20 }]}
          onLayout={(e) => setDistributionY(e.nativeEvent.layout.y)}
        >
          {/* SERVICE BREAKDOWN */}
          <View style={[styles.analyticsCard, isMobile ? { width: '100%' } : { flex: 1 }]}>
            <View style={styles.analyticsCardHeader}>
              <MaterialCommunityIcons name="medical-bag" size={20} color="#10B981" />
              <Text style={styles.analyticsCardTitle}>Service Distribution</Text>
            </View>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View style={styles.analyticsCardBody}>
                {topServices.length === 0 ? (
                  <Text style={styles.emptyText}>No services logged.</Text>
                ) : (
                  topServices.map((item) => {
                    const percentage = totalAppointments > 0 ? ((item.count / totalAppointments) * 100).toFixed(0) : 0;
                    return (
                      <View key={item.service} style={styles.distributionRow}>
                        <View style={styles.distributionLabelRow}>
                          <Text style={styles.distributionLabel}>{item.service}</Text>
                          <Text style={[Typography.bodySmall, styles.distributionValue]}>
                            <AnimatedNumber value={item.count} startAnimation={isDistributionVisible} /> ({percentage}%)
                          </Text>
                        </View>
                        <AnimatedBar percentage={percentage} color="#10B981" startAnimation={isDistributionVisible} />
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          </View>

          {/* STATUS DISTRIBUTION */}
          <View style={[styles.analyticsCard, isMobile ? { width: '100%' } : { flex: 1 }]}>
            <View style={styles.analyticsCardHeader}>
              <MaterialCommunityIcons name="chart-pie" size={20} color="#7C3AED" />
              <Text style={styles.analyticsCardTitle}>Status Breakdown</Text>
            </View>
            <View style={styles.analyticsCardBody}>
              {statusStats.map(item => {
                let barColor = '#64748B'; // Default
                if (item.status === 'Completed') barColor = '#10B981';
                else if (item.status === 'Approved') barColor = '#059669';
                else if (item.status === 'Pending') barColor = '#F59E0B';
                else if (item.status === 'Cancelled' || item.status === 'Rejected') barColor = '#EF4444';
                else if (item.status === 'Expired') barColor = '#94A3B8';

                return (
                  <View key={item.status} style={styles.distributionRow}>
                    <View style={styles.distributionLabelRow}>
                      <Text style={[Typography.bodyMedium, styles.distributionLabel]}>{item.status}</Text>
                      <Text style={[Typography.bodySmall, styles.distributionValue]}>
                        <AnimatedNumber value={item.count} startAnimation={isDistributionVisible} /> ({item.percentage}%)
                      </Text>
                    </View>
                    <AnimatedBar percentage={item.percentage} color={barColor} startAnimation={isDistributionVisible} />
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ scale: entryScale }] }}>
      <ImageBackground
        source={require("../assets/redox-01.png")}
        style={styles.screenWrapper}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={[
          styles.dashboardLayout,
          isMobile && { flexDirection: 'column' }
        ]}>
          <View style={[
            styles.sidebar,
            isMobile && styles.sidebarMobile,
          ]}>
            {!isMobile && (
              <Text style={styles.sidebarTitle}>Admin Menu</Text>
            )}

            {isMobile ? (
              // Mobile: horizontal scrollable tab bar, icon + label stacked
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.mobileNavScroll}
              >
                {[
                  { key: 'Overview', icon: 'view-dashboard-outline', label: 'Overview' },
                  { key: 'Students', icon: 'account-group', label: 'Students' },
                  { key: 'Personnel', icon: 'account-circle', label: 'Accounts' },
                  { key: 'Analytics', icon: 'chart-bar', label: 'Analytics' },
                ].map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => setSidebarSelection(item.key)}
                    style={({ pressed }) => [
                      styles.mobileNavItem,
                      sidebarSelection === item.key && styles.mobileNavItemActive,
                      pressed && styles.sidebarItemPressed,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={22}
                      color={sidebarSelection === item.key ? '#FFFFFF' : '#64748B'}
                    />
                    <Text style={[
                      styles.mobileNavLabel,
                      sidebarSelection === item.key && styles.mobileNavLabelActive,
                    ]}>{item.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              // Desktop: vertical sidebar items
              <View style={{ flexDirection: 'column' }}>
                {[
                  { key: 'Overview', icon: 'view-dashboard-outline', label: 'Overview' },
                  { key: 'Students', icon: 'account-group', label: 'Students' },
                  { key: 'Personnel', icon: 'account-circle', label: 'Accounts' },
                  { key: 'Analytics', icon: 'chart-bar', label: 'Analytics' },
                ].map((item) => (
                  <Pressable
                    key={item.key}
                    onPress={() => setSidebarSelection(item.key)}
                    style={({ pressed, hovered }) => [
                      styles.sidebarItem,
                      sidebarSelection === item.key ? styles.sidebarItemActive : (hovered && styles.sidebarItemHover),
                      sidebarSelection === item.key && hovered && styles.sidebarItemActiveHover,
                      pressed && styles.sidebarItemPressed,
                    ]}
                  >
                    <View style={styles.sidebarItemRow}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={22}
                        color={sidebarSelection === item.key ? '#FFFFFF' : '#64748B'}
                      />
                      <Text style={[styles.sidebarItemText, sidebarSelection === item.key && styles.sidebarItemTextActive]}>
                        {item.label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={[
            styles.contentArea,
            isMobile && { padding: 12 }
          ]}>
            <Toast
              visible={toast.visible}
              message={toast.message}
              type={toast.type}
              onHide={() => setToast({ ...toast, visible: false })}
            />

            {sidebarSelection === 'Overview' ? (
              <FlatList
                data={paginatedAppointments}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No records found.</Text>
                }
                ListFooterComponent={
                  <PaginationControls
                    currentPage={clampedOverviewPage}
                    totalPages={totalOverviewPages}
                    onPageChange={setOverviewPage}
                  />
                }
                ListHeaderComponent={
                  <>
                    <View style={styles.header}>
                      <Orb style={{ width: 120, height: 120, backgroundColor: '#4F8EF7', top: -30, left: -20 }} delay={0} />
                      <Orb style={{ width: 180, height: 180, backgroundColor: '#93C5FD', bottom: -50, right: -40 }} delay={1500} />
                      <Orb style={{ width: 100, height: 100, backgroundColor: '#60A5FA', top: '20%', right: '48%' }} delay={3000} />
                      <Orb style={{ width: 60, height: 60, backgroundColor: '#BFDBFE', bottom: '10%', left: '25%' }} delay={800} />
                      <Orb style={{ width: 150, height: 150, backgroundColor: '#3B82F6', top: -40, right: '25%' }} delay={2200} />
                      <Text style={[
                        styles.title,
                        styles.pageTitle,
                        isMobile && { fontSize: 22, lineHeight: 28 }
                      ]}>
                        System Administration
                      </Text>

                      <Toast
                        visible={!!error}
                        message={error}
                        type="error"
                        onHide={() => setError(null)}
                      />

                      <View style={styles.searchContainer}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#FFFFFF" />
                        <TextInput
                          placeholder="Search records..."
                          placeholderTextColor="rgba(255,255,255,0.75)"
                          style={styles.searchInput}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                        />
                      </View>
                    </View>


                    <View style={[
                      styles.statsRow,
                      isMobile && { gap: 10 }
                    ]}>
                      <StatBox label="Total" value={stats.total} color="#0F172A" icon="file-document-outline" />
                      <StatBox label="Pending" value={stats.pending} color="#F59E0B" icon="clock-outline" />
                      <StatBox label="Approved" value={stats.approved} color="#10B981" icon="check-circle-outline" />
                    </View>

                    <Text style={styles.sectionTitle}>Records</Text>

                    <View style={styles.filter}>
                      <StatusFilter
                        options={filterOptions}
                        activeFilter={activeFilter}
                        onSelect={setActiveFilter}
                      />
                    </View>
                  </>
                }
                renderItem={({ item }) => (
                  <AdminAppointmentRow
                    item={item}
                    onDelete={requestDelete}
                    onViewDetails={(pt) => {
                      setSelectedStudent(pt);
                      setDetailVisible(true);
                    }}
                  />
                )}
              />

            ) : sidebarSelection === 'Students' ? (
              <FlatList
                data={paginatedStudents}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No students found.</Text>
                }
                ListFooterComponent={
                  <PaginationControls
                    currentPage={clampedStudentPage}
                    totalPages={totalStudentPages}
                    onPageChange={setStudentsPage}
                  />
                }
                ListHeaderComponent={
                  <>
                    <View style={styles.header}>
                      <Orb style={{ width: 120, height: 120, backgroundColor: '#4F8EF7', top: -30, left: -20 }} delay={0} />
                      <Orb style={{ width: 180, height: 180, backgroundColor: '#93C5FD', bottom: -50, right: -40 }} delay={1500} />
                      <Orb style={{ width: 100, height: 100, backgroundColor: '#60A5FA', top: '20%', right: '48%' }} delay={3000} />
                      <Orb style={{ width: 60, height: 60, backgroundColor: '#BFDBFE', bottom: '10%', left: '25%' }} delay={800} />
                      <Orb style={{ width: 150, height: 150, backgroundColor: '#3B82F6', top: -40, right: '25%' }} delay={2200} />
                      <Text style={[styles.title, styles.pageTitle]}>
                        Students
                      </Text>

                      <View style={styles.searchContainer}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                        <TextInput
                          placeholder="Search students..."
                          style={styles.searchInput}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                        />
                      </View>
                    </View>

                    <Text style={styles.sectionTitle}>All Students ({students.length})</Text>
                  </>
                }
                renderItem={({ item }) => (
                  <View style={[
                    styles.patientRow,
                    isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 10 }
                  ]}>
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientName}>{item.name}</Text>
                      <Text style={styles.patientEmail}>{item.email}</Text>
                    </View>
                    <View style={styles.patientMeta}>
                      <MaterialCommunityIcons name="calendar-multiple" size={16} color="#94A3B8" />
                      <Text style={styles.appointmentCount}>{item.appointmentCount} appointments</Text>
                    </View>
                  </View>
                )}
              />
            ) : sidebarSelection === 'Personnel' ? (
              <FlatList
                data={paginatedPersonnel}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No personnel records found.</Text>
                }
                ListFooterComponent={
                  <PaginationControls
                    currentPage={clampedPersonnelPage}
                    totalPages={totalPersonnelPages}
                    onPageChange={setPersonnelPage}
                  />
                }
                ListHeaderComponent={
                  <>
                    <View style={styles.header}>
                      <Orb style={{ width: 120, height: 120, backgroundColor: '#4F8EF7', top: -30, left: -20 }} delay={0} />
                      <Orb style={{ width: 180, height: 180, backgroundColor: '#93C5FD', bottom: -50, right: -40 }} delay={1500} />
                      <Orb style={{ width: 100, height: 100, backgroundColor: '#60A5FA', top: '20%', right: '48%' }} delay={3000} />
                      <Orb style={{ width: 60, height: 60, backgroundColor: '#BFDBFE', bottom: '10%', left: '25%' }} delay={800} />
                      <Orb style={{ width: 150, height: 150, backgroundColor: '#3B82F6', top: -40, right: '25%' }} delay={2200} />
                      <Text style={[styles.title, styles.pageTitle]}>
                        Account Management
                      </Text>

                      <View style={styles.searchContainer}>
                        <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                        <TextInput
                          placeholder="Search Account..."
                          style={styles.searchInput}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                        />
                      </View>
                    </View>


                    <View style={[styles.row]}>
                      <View style={[styles.flex, { marginRight: 80 }]}>
                        <Text style={styles.sectionTitle}>User Accounts ({personnel.length})</Text>
                      </View>

                      <View style={styles.flex}>
                        <Pressable
                          onPress={() => setShowAddPersonnelModal(true)}
                          style={({ pressed }) => [
                            styles.addButton,
                            pressed && styles.addButtonPressed
                          ]}
                        >
                          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                          <Text style={styles.addButtonText}>Add</Text>
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.filter}>
                      <StatusFilter
                        options={accountFilterOptions}
                        activeFilter={accountFilter}
                        onSelect={setAccountFilter}
                      />
                    </View>
                  </>
                }
                renderItem={({ item }) => (
                  <View style={[
                    styles.personnelRow,
                    isMobile && { flexDirection: 'column', alignItems: 'flex-start', gap: 10 }
                  ]}>
                    <View style={styles.personnelInfo}>
                      <Text style={styles.personnelName}>{item.first_name} {item.last_name}</Text>
                      <Text style={styles.personnelEmail}>{item.email}</Text>
                      {!!item.contact_number && (
                        <Text style={styles.personnelContact}>{item.contact_number}</Text>
                      )}
                    </View>
                    <View style={styles.personnelMeta}>
                      <View style={[styles.roleBadge, item.role === 'faculty' && styles.roleBadgeFaculty]}>
                        <Text style={styles.roleBadgeText}>{item.role || 'Staff'}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <Pressable onPress={() => requestPasswordReset(item)}>
                          <MaterialCommunityIcons name="key-variant" size={20} color="#0052FF" />
                        </Pressable>
                        <Pressable onPress={() => requestUserDelete(item.id)}>
                          <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}
              />
            ) : sidebarSelection === 'Analytics' ? (
              renderAnalyticsView()
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={styles.emptyText}>Settings coming soon.</Text>
              </View>
            )}
          </View>
        </View>

        <ConfirmModal
          visible={confirmUserDelete.visible}
          title="Delete User?"
          message="This account will be permanently deleted."
          confirmText="Delete"
          isDestructive={true}
          onConfirm={executeUserDelete}
          onCancel={() => setConfirmUserDelete({ visible: false, id: null })}
        />

        <ConfirmModal
          visible={confirmDelete.visible}
          title="Delete Appointment?"
          message="This action cannot be undone. The record will be permanently removed from the system."
          confirmText="Delete Now"
          isDestructive={true}
          onConfirm={executeDelete}
          onCancel={() => setConfirmDelete({ visible: false, id: null })}
        />

        <StudentDetailModal
          visible={detailVisible}
          item={selectedStudent}
          onClose={() => setDetailVisible(false)}
          onAction={() => { }}
        />

        {/* Add Personnel Modal */}
        {showAddPersonnelModal && (
          <View style={styles.modalOverlay}>
            <View style={[
              styles.modalContent,
              isMobile && { width: '95%', maxHeight: '95%' }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Personnel Account</Text>
                <Pressable onPress={() => setShowAddPersonnelModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#0F172A" />
                </Pressable>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
                <Text style={styles.inputLabel}>Username *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter username"
                  value={personnelForm.username}
                  onChangeText={(text) => setPersonnelForm({ ...personnelForm, username: text })}
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter first name"
                  value={personnelForm.firstName}
                  onChangeText={(text) => setPersonnelForm({ ...personnelForm, firstName: text })}
                />

                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter last name"
                  value={personnelForm.lastName}
                  onChangeText={(text) => setPersonnelForm({ ...personnelForm, lastName: text })}
                />

                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter email"
                  value={personnelForm.email}
                  onChangeText={(text) => setPersonnelForm({ ...personnelForm, email: text })}
                  keyboardType="email-address"
                />

                <Text style={styles.inputLabel}>Contact Number</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter contact number"
                  value={personnelForm.contact}
                  onChangeText={(text) => setPersonnelForm({ ...personnelForm, contact: text })}
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>Role *</Text>
                <View style={styles.roleSelector}>
                  {['faculty', 'dean', 'admin'].map((role) => (
                    <Pressable
                      key={role}
                      onPress={() => setPersonnelForm({ ...personnelForm, role })}
                      style={[
                        styles.roleOption,
                        personnelForm.role === role && styles.roleOptionActive
                      ]}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        personnelForm.role === role && styles.roleOptionTextActive
                      ]}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Password *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter password"
                  value={personnelForm.password}
                  onChangeText={(text) => setPersonnelForm({ ...personnelForm, password: text })}
                  secureTextEntry={true}
                />
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => setShowAddPersonnelModal(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddPersonnel}
                  style={styles.confirmButton}
                >
                  <Text style={styles.confirmButtonText}>Create Account</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Reset Password Modal */}
        {showResetPasswordModal && (
          <View style={styles.modalOverlay}>
            <View style={[
              styles.modalContent,
              isMobile && { width: '95%', maxHeight: '95%' }
            ]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <Pressable onPress={() => setShowResetPasswordModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#0F172A" />
                </Pressable>
              </View>

              <View style={styles.modalBody}>
                <Text style={{ fontSize: 14, color: '#64748B', marginBottom: 16 }}>
                  Resetting password for: <Text style={{ fontWeight: 'bold', color: '#0F172A' }}>{selectedUserForReset?.first_name} {selectedUserForReset?.last_name} ({selectedUserForReset?.username})</Text>
                </Text>

                <Text style={styles.inputLabel}>New Password *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter new password"
                  value={resetPasswordForm.password}
                  onChangeText={(text) => setResetPasswordForm({ ...resetPasswordForm, password: text })}
                  secureTextEntry={true}
                />

                <Text style={styles.inputLabel}>Confirm New Password *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Confirm new password"
                  value={resetPasswordForm.confirmPassword}
                  onChangeText={(text) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: text })}
                  secureTextEntry={true}
                />
              </View>

              <View style={styles.modalFooter}>
                <Pressable
                  onPress={() => setShowResetPasswordModal(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleResetPassword}
                  style={styles.confirmButton}
                >
                  <Text style={styles.confirmButtonText}>Reset Password</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ImageBackground>
    </Animated.View>
  );
}

const getStyles = (isMobile) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    marginBottom: 24,
    paddingVertical: isMobile ? 24 : 30,
    paddingHorizontal: isMobile ? 24 : 40,
    minHeight: 180,
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: '#002366',
    borderBottomWidth: 0,
    shadowColor: '#002366',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  title: {
    ...Typography.header,
    fontSize: isMobile ? 22 : 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  pageTitle: {
    fontSize: isMobile ? 22 : 28,
    lineHeight: 44,
    letterSpacing: -0.6,
    color: '#FFFFFF'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    marginTop: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 16
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: isMobile ? 14 : 16,
    color: '#FFFFFF',
    outlineStyle: 'none',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignSelf: 'center'
  },
  sectionTitle: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 18,
    marginTop: 24,
    width: 900
  },
  dashboardLayout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 24,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sidebar: {
    width: 250,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: 'white'
  },
  sidebarMobile: {
    width: '100%',
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
  },
  mobileNavScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  mobileNavItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 3,
    minWidth: 70,
  },
  mobileNavItemActive: {
    backgroundColor: '#002366',
  },
  mobileNavLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
    textAlign: 'center',
  },
  mobileNavLabelActive: {
    color: '#FFFFFF',
  },
  sidebarTitle: {
    ...Typography.header,
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 30
  },
  sidebarItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: '#F8FAFC'
  },
  sidebarItemActive: {
    backgroundColor: '#002366',
    borderRadius: 14,
  },
  sidebarItemActiveHover: {
    backgroundColor: '#002D80',
    borderRadius: 14,
  },
  sidebarItemHover: {
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
  },
  sidebarItemPressed: {
    backgroundColor: '#CBD5E1',
    borderRadius: 14,
  },
  sidebarItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarItemText: {
    ...Typography.title,
    marginLeft: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#334155'
  },
  sidebarItemTextActive: {
    color: '#FFFFFF'
  },
  contentArea: {
    flex: 1,
    backgroundColor: 'rgba(248,250,252,0.94)',
    padding: 24
  },
  listContent: {
    paddingBottom: 36,
    paddingTop: 8
  },
  emptyText: {
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 20,
    fontSize: isMobile ? 13 : 15,
  },
  screenWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    padding: 20,
    backgroundColor: 'transparent'
  },
  backgroundImage: {
    opacity: 0.28
  },
  dashboardLayout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 7
  },
  patientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12
  },
  patientInfo: {
    flex: 1
  },
  patientName: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6
  },
  patientEmail: {
    fontSize: isMobile ? 13 : 14,
    color: '#64748B'
  },
  patientMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  appointmentCount: {
    fontSize: isMobile ? 12 : 13,
    color: '#64748B',
    fontWeight: '500'
  },
  personnelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12
  },
  personnelInfo: {
    flex: 1
  },
  personnelName: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6
  },
  personnelEmail: {
    fontSize: isMobile ? 13 : 14,
    color: '#64748B',
    marginBottom: 4
  },
  personnelContact: {
    fontSize: isMobile ? 12 : 13,
    color: '#94A3B8'
  },
  personnelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  roleBadge: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 12
  },
  roleBadgeFaculty: {
    backgroundColor: '#DBEAFE'
  },
  roleBadgeText: {
    fontSize: isMobile ? 11 : 12,
    fontWeight: '600',
    color: '#0F172A',
    textTransform: 'capitalize'
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#002366',
    paddingVertical: 14,
    paddingHorizontal: isMobile ? 18 : 30,
    borderRadius: 14,
    gap: 8,
    maxWidth: 150,
    marginLeft: "auto"
  },
  row: {
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: "space-between",
    gap: isMobile ? 0 : 15
  },
  flex: {
    flex: 1,
  },
  rowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 0
  },
  addButtonPressed: {
    opacity: 0.88
  },
  addButtonText: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    width: '92%',
    maxWidth: 640,
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  modalTitle: {
    fontSize: isMobile ? 20 : 22,
    fontWeight: '700',
    color: '#0F172A'
  },
  modalBody: {
    paddingHorizontal: 22,
    paddingVertical: 22,
    maxHeight: 420
  },
  inputLabel: {
    fontSize: isMobile ? 13 : 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 10
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 18,
    fontSize: isMobile ? 13 : 15,
    color: '#0F172A'
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    alignItems: 'center'
  },
  roleOptionActive: {
    backgroundColor: '#002366',
    borderColor: '#002366'
  },
  roleOptionText: {
    fontSize: isMobile ? 12 : 14,
    fontWeight: '600',
    color: '#64748B'
  },
  roleOptionTextActive: {
    color: '#FFFFFF'
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center'
  },
  cancelButtonText: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
    color: '#0F172A'
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#002366',
    alignItems: 'center'
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  filter: {
    alignSelf: isMobile ? 'stretch' : 'flex-start',
  },
  glassAccent: {
    position: 'absolute',
    top: -20,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  analyticsRow: {
    flexDirection: 'row',
    gap: 20,
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  analyticsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  analyticsCardTitle: {
    ...Typography.header,
    fontSize: isMobile ? 15 : 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  analyticsCardBody: {
    gap: isMobile ? 8 : 12,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  leaderboardRankContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leaderboardRankText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontFamily: Typography.header.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  leaderboardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  leaderboardCount: {
    fontFamily: Typography.header.fontFamily,
    fontSize: 16,
    fontWeight: '800',
    color: '#002366',
    marginLeft: 12,
  },
  distributionRow: {
    marginBottom: 14,
  },
  distributionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  distributionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  distributionValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  }
});