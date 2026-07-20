import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, ImageBackground, useWindowDimensions, Modal, TextInput, Alert, Animated } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "../utils/api";
import { Typography } from "../styles/theme";
import Avatar from "../components/Avatar";
import MeetingBookingModal from "../components/MeetingBookingModal";
import AppFooter from "../components/AppFooter";

const PulsingBadge = ({ count, style, textStyle }) => {
  const pulseAnim = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[style, { opacity: pulseAnim }]}>
      <Text style={textStyle}>{count} ACTIVE</Text>
    </Animated.View>
  );
};

const AnimatedPaginationButton = ({ onPress, disabled, iconName, styles }) => {
  const [hovered, setHovered] = useState(false);
  const colorAnim = useState(() => new Animated.Value(0))[0];
  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: hovered && !disabled ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [hovered, disabled, colorAnim]);

  const bgColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#002366']
  });

  const iconColor = disabled ? '#94A3B8' : (hovered ? '#FFFFFF' : '#002366');

  return (
    <AnimatedPressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.pageButton,
        disabled && styles.pageButtonDisabled,
        { backgroundColor: disabled ? '#F8FAFC' : bgColor }
      ]}
    >
      <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
    </AnimatedPressable>
  );
};

const PaginationControls = ({ currentPage, totalPages, onPageChange, styles }) => {
  if (totalPages <= 1) return null;
  return (
    <View style={styles.paginationContainer}>
      <AnimatedPaginationButton
        onPress={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        iconName="chevron-left"
        styles={styles}
      />
      <Text style={styles.pageText}>Page {currentPage} of {totalPages}</Text>
      <AnimatedPaginationButton
        onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        iconName="chevron-right"
        styles={styles}
      />
    </View>
  );
};

export default function FacultyDashboard({ navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;
  const styles = getStyles(isMobile, isDesktop);

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

  const AnimatedCancelButton = ({ onPress, text, style, textStyle, baseColor, hoverColor }) => {
    const [hovered, setHovered] = useState(false);
    const colorAnim = useState(() => new Animated.Value(0))[0];
    const scale = useState(() => new Animated.Value(1))[0];

    useEffect(() => {
      Animated.timing(colorAnim, {
        toValue: hovered ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();

      Animated.spring(scale, {
        toValue: hovered ? 0.98 : 1,
        useNativeDriver: true,
      }).start();
    }, [hovered, colorAnim, scale]);

    const bgColor = colorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [baseColor, hoverColor]
    });

    return (
      <AnimatedPressable
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPress={onPress}
        style={[
          style,
          { backgroundColor: bgColor, transform: [{ scale }] }
        ]}
      >
        <Text style={textStyle}>{text}</Text>
      </AnimatedPressable>
    );
  };

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

  const AnimatedBookButton = ({ onPress, isMobile, styles }) => {
    const [hovered, setHovered] = useState(false);
    const shineAnim = useState(() => new Animated.Value(-1))[0];
    const scale = useState(() => new Animated.Value(1))[0];

    useEffect(() => {
      if (hovered) {
        Animated.spring(scale, { toValue: 1.05, useNativeDriver: true }).start();
        shineAnim.setValue(-1);
        Animated.loop(
          Animated.timing(shineAnim, {
            toValue: 2,
            duration: 700,
            useNativeDriver: true,
          })
        ).start();
      } else {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        shineAnim.stopAnimation();
      }
    }, [hovered, shineAnim, scale]);

    const translateX = shineAnim.interpolate({
      inputRange: [-1, 2],
      outputRange: [-100, 300],
    });

    return (
      <AnimatedPressable
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPress={onPress}
        style={{
          transform: [{ scale }],
          zIndex: 2,
          width: isMobile ? '100%' : 'auto',
          marginTop: isMobile ? 14 : 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 10,
          elevation: 4,
        }}
      >
        <View style={{
          borderRadius: 16,
          padding: 2,
          backgroundColor: 'rgba(255,255,255,0.15)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {hovered && (
            <Animated.View style={{
              position: 'absolute',
              top: -20, bottom: -20, left: 0, width: 80,
              transform: [{ translateX }, { skewX: '-20deg' }],
              zIndex: 0
            }}>
              <LinearGradient
                colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          )}
          <View style={[styles.bookBtn, { marginTop: 0, shadowColor: 'transparent', elevation: 0, width: '100%' }]}>
            <MaterialCommunityIcons name="calendar-plus" size={20} color="#002366" />
            <Text style={styles.bookBtnText}>Book Meeting</Text>
          </View>
        </View>
      </AnimatedPressable>
    );
  };

  const AnimatedNumber = ({ value, style }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      if (!value || value === 0) {
        setDisplayValue(0);
        return;
      }

      let startTime = Date.now();
      const tickDuration = 200; // 200ms per tick (adjust speed here)
      let animationFrame;

      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const currentTick = Math.floor(elapsed / tickDuration);

        if (currentTick < value) {
          setDisplayValue(currentTick);
          animationFrame = requestAnimationFrame(animate);
        } else {
          setDisplayValue(value); // ensure exact finish
        }
      };

      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }, [value]);

    return <Text style={style}>{displayValue}</Text>;
  };

  const StatCard = ({ label, value, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.statInfo, { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>

        <Text style={[styles.statLabel, { fontFamily: 'ProstoOne_400Regular', color: '#002366', fontSize: isDesktop ? 26 : isMobile ? 14 : 20 }]}>{label}</Text>
        <AnimatedNumber value={value} style={[styles.statValue, { color, fontSize: isDesktop ? 48 : isMobile ? 36 : 42, lineHeight: undefined }]} />
      </View>
    </View>
  );

  const [facultyName, setFacultyName] = useState("Faculty");

  const [stats, setStats] = useState({ today: 0, pending: 0, completed: 0, remaining: 0, total: 0 });
  const [nextStudent, setNextStudent] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [disapproveModal, setDisapproveModal] = useState({ visible: false, id: null, reason: "" });
  const [detailsModal, setDetailsModal] = useState({ visible: false, appointment: null });
  const [isBookingVisible, setIsBookingVisible] = useState(false);

  const ITEMS_PER_PAGE = 10;
  const totalPendingPages = Math.ceil(pendingRequests.length / ITEMS_PER_PAGE);
  const clampedPendingPage = Math.min(Math.max(1, pendingPage), Math.max(1, totalPendingPages));
  const paginatedPending = pendingRequests.slice(
    (clampedPendingPage - 1) * ITEMS_PER_PAGE,
    clampedPendingPage * ITEMS_PER_PAGE
  );

  const changePendingPage = (page) => {
    setPendingPage(page);
  };


  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('first_name');

      if (savedName) {
        const formattedName = savedName.charAt(0).toUpperCase() + savedName.slice(1);
        setFacultyName(formattedName);
      } else {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const rawName = parsedUser.first_name || parsedUser.username || "Faculty";
          setFacultyName(rawName.charAt(0).toUpperCase() + rawName.slice(1));
        }
      }

      const res = await api.get("appointments/");
      const data = res.data;
      const now = new Date();
      const todayStr = now.toDateString();

      const todayApps = data.filter(a => new Date(a.date_time).toDateString() === todayStr);
      const completedToday = todayApps.filter(a => a.status.toLowerCase() === 'completed').length;

      setStats({
        today: todayApps.length,
        pending: data.filter(a => a.status.toLowerCase() === 'pending').length,
        completed: data.filter(a => a.status.toLowerCase() === 'completed').length,
        remaining: todayApps.length - completedToday,
        total: data.length
      });

      const upcoming = todayApps
        .filter(a => a.status === 'Approved')
        .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

      setNextStudent(upcoming[0] || null);

      const pending = data
        .filter(a => a.status === 'Pending')
        .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

      setPendingRequests(pending);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (id, action) => {
    if (action === 'Approved') {
      try {
        setLoading(true);
        const res = await api.patch(`appointments/${id}/`, { status: 'Approved' });
        const apptDate = res.data.date_time.split('T')[0];
        setLoading(false);
        loadData();
        Alert.alert("Success", "Appointment approved successfully!", [
          {
            text: "View in Schedule",
            onPress: () => navigation.navigate('Schedule', { date: apptDate, highlightId: id })
          },
          {
            text: "Dismiss",
            style: "cancel"
          }
        ]);
      } catch (err) {
        console.error(err);
        Alert.alert("Error", "Failed to approve appointment.");
        setLoading(false);
      }
    } else {
      setDisapproveModal({ visible: true, id: id, reason: "" });
    }
  };

  const submitDisapproval = async () => {
    const { id, reason } = disapproveModal;
    if (!reason.trim()) {
      Alert.alert("Required", "Please enter a reason for disapproval.");
      return;
    }

    try {
      setLoading(true);
      setDisapproveModal({ visible: false, id: null, reason: "" });
      await api.patch(`appointments/${id}/`, {
        status: 'Rejected',
        consultation_notes: `Faculty Rejection: ${reason.trim()}`
      });
      Alert.alert("Success", "Appointment disapproved.");
      loadData();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to disapprove appointment.");
      setLoading(false);
    }
  };



  if (loading) return <ActivityIndicator size="large" color="#059669" style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        <ImageBackground
          source={require('../assets/redox-01.png')}
          style={[styles.container]}
          resizeMode="repeat"
        >

          <View style={styles.mainWrapper} contentContainerStyle={{ padding: 25 }}>
            <View style={styles.header}>
              {isMobile ? (
                <>
                  <Orb style={{ width: 120, height: 120, backgroundColor: '#4F8EF7', top: -30, left: -20 }} delay={0} />
                  <Orb style={{ width: 180, height: 180, backgroundColor: '#93C5FD', bottom: -50, right: -40 }} delay={1500} />
                </>
              ) : (
                <>
                  <Orb style={{ width: 120, height: 120, backgroundColor: '#4F8EF7', top: -30, left: -20 }} delay={0} />
                  <Orb style={{ width: 180, height: 180, backgroundColor: '#93C5FD', bottom: -50, right: -40 }} delay={1500} />
                  <Orb style={{ width: 100, height: 100, backgroundColor: '#60A5FA', top: '20%', right: '48%' }} delay={3000} />
                  <Orb style={{ width: 60, height: 60, backgroundColor: '#BFDBFE', bottom: '10%', left: '25%' }} delay={800} />
                  <Orb style={{ width: 150, height: 150, backgroundColor: '#3B82F6', top: -40, right: '25%' }} delay={2200} />
                </>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, zIndex: 2 }}>
                <View style={{ flexShrink: 1 }}>
                  <Text style={styles.pageTitle} numberOfLines={1} ellipsizeMode="tail">
                    Welcome, {facultyName}
                  </Text>
                  <Text style={styles.dateSubtext}>
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
                <AnimatedBookButton
                  onPress={() => setIsBookingVisible(true)}
                  isMobile={isMobile}
                  styles={styles}
                />
              </View>
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="Today" value={stats.today} color="#011B51" />
              <StatCard label="Pending" value={stats.pending} color="#011B51" />
              <StatCard label="Completed" value={stats.completed} color="#011B51" />
              <StatCard label="Remaining" value={stats.remaining} color="#011B51" />
            </View>

            <View style={styles.sectionWrapper}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconBox}>
                  <MaterialCommunityIcons name="clipboard-check-outline" size={28} color="#002366" />
                </View>
                <Text style={styles.sectionTitle}>Needs Your Approval</Text>
                {pendingRequests.length > 0 && (
                  <PulsingBadge
                    count={pendingRequests.length}
                    style={styles.activeBadge}
                    textStyle={styles.activeBadgeText}
                  />
                )}
              </View>
              {pendingRequests.length > 0 ? (
                <View>
                  <View style={{ flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: 16, width: '100%', marginBottom: 16 }}>
                    {paginatedPending.map((item) => (
                      <View key={item.id} style={styles.requestCard}>
                        <View style={styles.requestHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Avatar name={item.student_name} size={36} />
                            <Text style={styles.requestName}>{item.student_name}</Text>
                          </View>
                          <Text style={styles.requestDate}>
                            {new Date(item.date_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                        <View style={styles.cardDivider} />

                        <Text style={styles.requestService}>{item.service}</Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#64748B' }}>NOTES PREVIEW:</Text>
                        </View>
                        <View style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginBottom: 12, height: 60, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' }}>
                          <Text style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', lineHeight: 15 }} numberOfLines={3}>
                            {item.condition || "No notes provided."}
                          </Text>
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 'auto' }}>
                          <Pressable onPress={() => setDetailsModal({ visible: true, appointment: item })}>
                            <Text style={{ fontFamily: Typography.label.fontFamily, fontSize: 12, fontWeight: '800', color: '#002366' }}>SEE MORE</Text>
                          </Pressable>

                          <View style={{ flexDirection: 'row', gap: 12 }}>
                            <Pressable
                              style={({ pressed }) => [
                                { backgroundColor: '#10B981', padding: 8, borderRadius: 60, alignItems: 'center', justifyContent: 'center', width: 36, height: 36 },
                                pressed && { opacity: 0.8 }
                              ]}
                              onPress={() => handleQuickAction(item.id, 'Approved')}
                            >
                              <MaterialCommunityIcons name="check" size={24} color="#FFF" />
                            </Pressable>
                            <Pressable
                              style={({ pressed }) => [
                                { backgroundColor: '#EF4444', padding: 8, borderRadius: 60, alignItems: 'center', justifyContent: 'center', width: 36, height: 36 },
                                pressed && { opacity: 0.8 }
                              ]}
                              onPress={() => handleQuickAction(item.id, 'Rejected')}
                            >
                              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                  <PaginationControls
                    currentPage={clampedPendingPage}
                    totalPages={totalPendingPages}
                    onPageChange={changePendingPage}
                    styles={styles}
                  />
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons name="check-decagram-outline" size={46} color="#94A3B8" />
                  <Text style={styles.emptyText}>All caught up! No pending requests.</Text>
                </View>
              )}
            </View>

            <View style={[styles.sectionWrapper, { marginBottom: 60 }]}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconBoxGray}>
                  <MaterialCommunityIcons name="calendar-arrow-right" size={28} color="#002366" />
                </View>
                <Text style={styles.sectionTitle}>Next Appointment</Text>
              </View>

              {nextStudent ? (
                <View style={styles.nextPatientCard}>

                  <View style={styles.cardHeader}>
                    <Avatar
                      name={nextStudent.student_name}
                      size={56}
                      backgroundColor="#002366"
                      textColor="#fff"
                    />
                    <View style={styles.nextInfo}>
                      <Text style={styles.nextName}>{nextStudent.student_name}</Text>
                      <Text style={styles.nextService}>{nextStudent.service}</Text>
                    </View>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeText}>
                        {new Date(nextStudent.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('Schedule')}
                  >
                    <Text style={styles.actionBtnText}>Go to Schedule</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#FFF" />
                  </Pressable>
                </View>
              ) : (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons name="check-decagram-outline" size={40} color="#94A3B8" />
                  <Text style={styles.emptyText}>No upcoming students for today.</Text>
                </View>
              )}
            </View>
          </View>
          <AppFooter userRole="faculty" navigation={navigation} />

        </ImageBackground>
      </ScrollView>

      <Modal visible={detailsModal.visible} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: '#FFF',
            borderRadius: 20,
            padding: 24,
            width: '90%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5
          }}>
            {detailsModal.appointment && (
              <View>
                <Text style={{ ...Typography.header, fontSize: 18, fontWeight: '800', color: '#002366', marginBottom: 16 }}>
                  Appointment Details
                </Text>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>STUDENT NAME</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#1E293B' }}>{detailsModal.appointment.student_name}</Text>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>SERVICE REQUESTED</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#002366' }}>{detailsModal.appointment.service}</Text>
                </View>

                <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 4 }}>NOTES / CONCERN</Text>
                <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', minHeight: 80 }}>
                  <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>
                    {detailsModal.appointment.condition || "No specific notes or concerns provided."}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <Pressable
                style={{ flex: 1, backgroundColor: '#002366', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                onPress={() => setDetailsModal({ visible: false, appointment: null })}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={disapproveModal.visible} transparent animationType="fade">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20
        }}>
          <View style={{
            backgroundColor: '#FFF',
            borderRadius: 20,
            padding: 24,
            width: '90%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5
          }}>
            <Text style={{ ...Typography.header, fontSize: 26, fontWeight: '800', color: '#002366' }}>
              Disapprove Appointment
            </Text>
            <Text style={{ ...Typography.body, fontSize: 13, color: '#64748B', marginBottom: 16 }}>
              Provide a brief explanation or instructions for the student:
            </Text>
            <TextInput
              placeholder="e.g. Please choose another time slot..."
              style={{
                borderWidth: 1.5,
                borderColor: '#E2E8F0',
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                color: '#64748B',
                minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: 20,
                backgroundColor: '#F8FAFC'
              }}
              multiline={true}
              numberOfLines={4}
              value={disapproveModal.reason}
              onChangeText={(txt) => setDisapproveModal(prev => ({ ...prev, reason: txt }))}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <AnimatedCancelButton
                onPress={() => setDisapproveModal({ visible: false, id: null, reason: "" })}
                text="Cancel"
                baseColor="#F1F5F9"
                hoverColor="#E2E8F0"
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                textStyle={{ fontFamily: Typography.label.fontFamily, color: '#475569', fontWeight: '700', fontSize: 14 }}
              />
              <AnimatedCancelButton
                onPress={submitDisapproval}
                text="Confirm"
                baseColor="#EF4444"
                hoverColor="#DC2626"
                style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                textStyle={{ fontFamily: Typography.label.fontFamily, color: '#FFF', fontWeight: '700', fontSize: 14 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <MeetingBookingModal
        isVisible={isBookingVisible}
        onClose={() => setIsBookingVisible(false)}
        onBookingSuccess={() => {
          loadData();
          Alert.alert("Success", "Meeting scheduled successfully!");
        }}
      />
    </View>
  );
}

const getStyles = (isMobile, isDesktop) => StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    width: '100%',
    height: '100%',
  },
  header: {
    marginBottom: 24,
    marginTop: 16,
    padding: isMobile ? 24 : 36,
    borderRadius: 24,
    backgroundColor: '#002366',
    shadowColor: '#002366',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  pageTitle: {
    fontFamily: Typography.header.fontFamily,
    fontSize: isMobile ? 22 : 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  dateSubtext: {
    fontFamily: Typography.body.fontFamily,
    color: 'rgba(255,255,255,0.70)',
    fontSize: isMobile ? 13 : 15,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  bookBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
    width: isMobile ? '100%' : 'auto',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  bookBtnText: {
    fontFamily: Typography.title.fontFamily,
    color: '#002366',
    fontWeight: '800',
    fontSize: 15,
    marginLeft: 7,
    letterSpacing: 0.3,
  },
  glassAccent: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: isDesktop ? 'flex-start' : 'space-between',
    gap: isDesktop ? 24 : isMobile ? 10 : 16,
    paddingHorizontal: isDesktop ? 60 : isMobile ? 0 : 16,
    marginBottom: 20
  },
  statCard: {
    width: isDesktop ? undefined : '48%',
    flex: isMobile ? undefined : 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isDesktop ? 26 : isMobile ? 14 : 18,
    minWidth: isDesktop ? 160 : '45%',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  statLabel: {
    fontFamily: Typography.label.fontFamily,
    color: '#64748B',
    fontSize: isDesktop ? 14 : isMobile ? 11 : 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontFamily: Typography.header.fontFamily,
    fontSize: isDesktop ? 36 : isMobile ? 26 : 30,
    lineHeight: isDesktop ? 40 : 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  sectionWrapper: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    padding: 6,
    borderRadius: 10,
  },
  iconBoxGray: {
    padding: 6,
    borderRadius: 10,
  },
  sectionTitle: {
    fontFamily: Typography.title.fontFamily,
    fontSize: isMobile ? 17 : 20,
    fontWeight: '800',
    color: '#002366',
    marginLeft: 8,
    letterSpacing: -0.4,
  },
  activeBadge: {
    backgroundColor: '#002366',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginLeft: 8,
  },
  activeBadgeText: {
    fontFamily: Typography.label.fontFamily,
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  requestName: {
    fontFamily: Typography.header.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    color: '#002366',
  },
  requestDate: {
    fontFamily: Typography.body.fontFamily,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  requestService: {
    fontSize: 14,
    color: '#002366',
    fontWeight: '800',
    marginBottom: 14,
    fontFamily: Typography.label.fontFamily,
    textTransform: 'uppercase',
  },
  reviewBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontFamily: Typography.body.fontFamily,
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 28,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  nextPatientCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  nextInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nextName: {
    fontSize: isMobile ? 15 : 18,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.3,
  },
  nextService: {
    fontSize: isMobile ? 12 : 13,
    color: '#64748B',
    marginTop: 2,
  },
  timeBadge: {
    backgroundColor: '#002366',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 12,
  },
  timeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: isMobile ? 12 : 13,
    letterSpacing: 0.3,
  },
  actionBtn: {
    backgroundColor: '#002366',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#002366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: isMobile ? 14 : 15,
    letterSpacing: 0.3,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    flex: isMobile ? undefined : 1,
    width: isMobile ? '100%' : undefined,
    minWidth: 280,
    maxWidth: isDesktop ? '32%' : '100%',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  emptyCard: {
    padding: isDesktop ? 100 : isMobile ? 84 : 52,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
  },
  mainWrapper: {
    minHeight: '100vh',
    width: '100%',
    paddingHorizontal: isMobile ? 12 : 50,
    paddingTop: 16,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  pageButton: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pageButtonDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#F1F5F9',
    opacity: 0.5,
  },
  pageText: {
    fontFamily: Typography.label.fontFamily,
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});
