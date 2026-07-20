import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  ImageBackground,
  Platform,
  ScrollView,
  useWindowDimensions,
  Modal,
  TextInput,
  Alert,
  Animated,
  LayoutAnimation,
  UIManager
} from "react-native";

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import BookingModal from "../components/BookingModal";
import AppointmentCard from "../components/AppointmentCard";
import { StatusFilter } from "../components/StatusFilter";
import { Toast } from "../components/Toast";
import { ConfirmModal } from "../components/ConfirmModal";
import AppFooter from "../components/AppFooter";
import PrivacyPolicyModal from "../components/PrivacyPolicyModal";

import { Typography } from "../styles/theme";
import api from "../utils/api";


const GUTTER = 16;

const THEME = {
  primaryBlue: '#002366',
  slate900: '#0f172a',
  slate600: '#475569',
  slate400: '#94a3b8',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  white: '#ffffff',
  blue50: '#eff6ff',
  glassWhite: 'rgba(255, 255, 255, 0.12)',
};


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
        marginTop: 14,
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
          <MaterialCommunityIcons name="plus-circle" size={20} color={THEME.primaryBlue} />
          <Text style={styles.bookBtnText}>Book Appointment</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
};

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

export default function StudentDashboard({ navigation }) {
  const { width } = useWindowDimensions();

  const isMobile = width < 768;
  const COLUMN_COUNT = isMobile ? 1 : 2;

  const styles = getStyles(isMobile, width);

  const fadeAnim = useState(() => new Animated.Value(0))[0];

  const scrollViewRef = useRef(null);
  const [sectionOffsets, setSectionOffsets] = useState({ upcoming: 0, history: 0 });
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);

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

  const [name, setName] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [facultyList, setFacultyList] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });

  const [upcomingPage, setUpcomingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    setHistoryPage(1);
  }, [filter]);

  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    id: null,
    type: 'delete'
  });

  const [cancelModal, setCancelModal] = useState({ visible: false, id: null, reason: "" });

  useEffect(() => { loadInitialData(); }, []);

  const triggerToast = useCallback((msg, type = 'success') => {
    const messageText = typeof msg === 'object' ? msg.message : msg;
    const messageType = typeof msg === 'object' ? msg.type : type;
    setToast({ visible: true, message: messageText, type: messageType });
  }, []);

  const loadInitialData = async () => {
    try {
      const fn = await AsyncStorage.getItem('first_name');
      setName(fn || "User");

      const [facRes, appRes] = await Promise.all([
        api.get("faculty/"),
        api.get("appointments/")
      ]);

      setFacultyList(facRes.data);
      setAppointments(appRes.data);
    } catch (err) {
      triggerToast("System offline. Failed to sync appointment data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const upcoming = appointments.filter(a => ['pending', 'approved'].includes(a.status.toLowerCase()));
  const history = appointments
    .filter(a => !['pending', 'approved'].includes(a.status.toLowerCase()))
    .filter(a => filter === "All" || a.status.toLowerCase() === filter.toLowerCase());

  const UPCOMING_LIMIT = 10;
  const HISTORY_LIMIT = 10;

  const totalUpcomingPages = Math.ceil(upcoming.length / UPCOMING_LIMIT);
  const totalHistoryPages = Math.ceil(history.length / HISTORY_LIMIT);

  const clampedUpcomingPage = Math.max(1, Math.min(upcomingPage, Math.max(1, totalUpcomingPages)));
  const clampedHistoryPage = Math.max(1, Math.min(historyPage, Math.max(1, totalHistoryPages)));

  const changeUpcomingPage = (newPage) => {
    if (newPage !== clampedUpcomingPage) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setUpcomingPage(newPage);
    }
  };

  const changeHistoryPage = (newPage) => {
    if (newPage !== clampedHistoryPage) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setHistoryPage(newPage);
    }
  };

  const visibleUpcoming = upcoming.slice((clampedUpcomingPage - 1) * UPCOMING_LIMIT, clampedUpcomingPage * UPCOMING_LIMIT);
  const visibleHistory = history.slice((clampedHistoryPage - 1) * HISTORY_LIMIT, clampedHistoryPage * HISTORY_LIMIT);

  const openDeleteConfirm = (id) => {
    setConfirmModal({ visible: true, id, type: 'delete' });
  };

  const openCancelConfirm = (id) => {
    setCancelModal({ visible: true, id, reason: "" });
  };

  const handleConfirmedAction = async () => {
    const { id, type } = confirmModal;
    setConfirmModal({ ...confirmModal, visible: false }); // Hide modal first

    try {
      if (type === 'delete') {
        await api.delete(`appointments/${id}/`);
        triggerToast("Appointment record removed.");
      }
      loadInitialData();
    } catch (err) {
      triggerToast("Action failed. Please try again.", "error");
    }
  };

  const submitCancellation = async () => {
    const { id, reason } = cancelModal;
    if (!reason.trim()) {
      Alert.alert("Required", "Please enter a reason for cancellation.");
      return;
    }

    try {
      setLoading(true);
      setCancelModal({ visible: false, id: null, reason: "" });
      await api.patch(`appointments/${id}/`, {
        status: "Cancelled",
        consultation_notes: `Student Cancellation: ${reason.trim()}`
      });
      triggerToast("Appointment cancelled successfully.");
      loadInitialData();
    } catch (err) {
      triggerToast("Cancellation failed. Please try again.", "error");
      setLoading(false);
    }
  };

  const renderAppointment = ({ item }) => {
    const status = item.status;

    return (
      <View style={styles.cardWrapper}>
        <AppointmentCard item={item} userRole="student">

          {/* PENDING → Cancel button */}
          {status === "Pending" && (
            <AnimatedCancelButton
              onPress={() => openCancelConfirm(item.id)}
              text="Cancel"
              baseColor="#F87171"
              hoverColor="#EF4444"
              style={{ padding: 10, borderRadius: 8 }}
              textStyle={{ fontFamily: Typography.label.fontFamily, color: '#FFF', textAlign: 'center', fontWeight: '700' }}
            />
          )}

          {/* REJECTED / CANCELLED / COMPLETED / EXPIRED → Delete */}
          {["Rejected", "Cancelled", "Completed", "Expired"].includes(status) && (
            <AnimatedCancelButton
              onPress={() => openDeleteConfirm(item.id)}
              text="Delete"
              baseColor="#002366"
              hoverColor="#001540"
              style={{ padding: 10, borderRadius: 8 }}
              textStyle={{ fontFamily: Typography.label.fontFamily, color: '#FFF', textAlign: 'center', fontWeight: '700' }}
            />
          )}

          {/* APPROVED → Display only */}
          {status === "Approved" && (
            <View style={{ padding: 10 }}>
              <Text style={{ fontFamily: Typography.label.fontFamily, textAlign: 'center', color: '#10B981', fontWeight: 'bold' }}>
                Scheduled
              </Text>
            </View>
          )}

        </AppointmentCard>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.primaryBlue} />
        <Text style={styles.loadingText}>Syncing Appointment Records...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ scale: entryScale }] }}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={require('../assets/redox-01.png')}
          style={[styles.container]}
          resizeMode="repeat"
        >
          <View style={styles.centeringWrapper}>
            <FlatList
              key={`grid-${COLUMN_COUNT}`}
              numColumns={COLUMN_COUNT}
              columnWrapperStyle={COLUMN_COUNT > 1 ? styles.columnWrapper : undefined}
              data={visibleUpcoming}
              keyExtractor={item => `up-${item.id}`}
              renderItem={renderAppointment}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="calendar-remove-outline"
                    size={48}
                    color="#092a69"
                  />
                  <Text style={styles.emptyText}>
                    No upcoming appointments.
                  </Text>
                  <Text style={[styles.emptyText, { ...Typography.body, fontSize: 14, marginTop: 4 }]}>
                    Tap "Book Appointment" to schedule one.
                  </Text>
                </View>
              }
              ListHeaderComponent={
                <View style={styles.headerContainer}>
                  <View style={styles.heroBanner}>
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
                    <View style={styles.heroTextContent}>
                      <Text style={styles.heroTitle}>Welcome, {name}!</Text>
                      <Text style={styles.heroSubtitle}>Your academic support starts here. Book an appointment with the Dean or a faculty member.</Text>
                    </View>
                    <AnimatedBookButton
                      onPress={() => setIsVisible(true)}
                      isMobile={isMobile}
                      styles={styles}
                    />
                  </View>

                  <View
                    style={styles.sectionHeader}
                    onLayout={(e) => setSectionOffsets(prev => ({ ...prev, upcoming: e.nativeEvent.layout.y }))}
                  >
                    <View style={styles.iconBox}>
                      <MaterialCommunityIcons name="calendar-clock" size={28} color={THEME.primaryBlue} />
                    </View>
                    <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
                    {upcoming.length > 0 && (
                      <PulsingBadge
                        count={upcoming.length}
                        style={styles.activeBadge}
                        textStyle={styles.activeBadgeText}
                      />
                    )}
                  </View>
                </View>
              }
              ListFooterComponent={
                <View style={styles.footerSection}>
                  <PaginationControls
                    currentPage={clampedUpcomingPage}
                    totalPages={totalUpcomingPages}
                    onPageChange={changeUpcomingPage}
                    styles={styles}
                  />

                  <View
                    style={styles.sectionHeader}
                    onLayout={(e) => setSectionOffsets(prev => ({ ...prev, history: e.nativeEvent.layout.y }))}
                  >
                    <View style={styles.iconBoxGray}>
                      <MaterialCommunityIcons name="history" size={28} color={THEME.primaryBlue} />
                    </View>
                    <Text style={styles.sectionTitle}>Appointment History</Text>
                  </View>

                  <View style={styles.filterContainer}>
                    <StatusFilter
                      options={["All", "Completed", "Rejected", "Cancelled", "Expired"]}
                      activeFilter={filter}
                      onSelect={setFilter}
                    />
                  </View>

                  <FlatList
                    key={`hist-grid-${COLUMN_COUNT}`}
                    numColumns={COLUMN_COUNT}
                    columnWrapperStyle={COLUMN_COUNT > 1 ? styles.columnWrapper : undefined}
                    data={visibleHistory}
                    keyExtractor={item => `hist-${item.id}`}
                    renderItem={renderAppointment}
                    scrollEnabled={false}
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#002366" />
                        <Text style={styles.emptyText}>No previous appointment records found.</Text>
                      </View>
                    }
                  />
                  <PaginationControls
                    currentPage={clampedHistoryPage}
                    totalPages={totalHistoryPages}
                    onPageChange={changeHistoryPage}
                    styles={styles}
                  />
                </View>
              }
            />
          </View>
          <AppFooter
            onScrollToDashboard={() => scrollViewRef.current?.scrollTo({ y: 0, animated: true })}
            onScrollToUpcoming={() => scrollViewRef.current?.scrollTo({ y: sectionOffsets.upcoming, animated: true })}
            onScrollToHistory={() => scrollViewRef.current?.scrollTo({ y: sectionOffsets.history, animated: true })}
            onOpenPrivacyPolicy={() => setPrivacyModalVisible(true)}
          />

          <BookingModal
            isVisible={isVisible}
            onClose={() => setIsVisible(false)}
            facultyList={facultyList}
            onBookingSuccess={(msg) => { triggerToast(msg); loadInitialData(); }}
          />

          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            onHide={() => setToast({ ...toast, visible: false })}
          />

          <ConfirmModal
            visible={confirmModal.visible}
            title="Delete Record?"
            message="This will permanently remove this appointment from your history."
            confirmText="Delete"
            isDestructive={true}
            onConfirm={handleConfirmedAction}
            onCancel={() => setConfirmModal({ ...confirmModal, visible: false })}
          />

          <PrivacyPolicyModal
            visible={privacyModalVisible}
            onClose={() => setPrivacyModalVisible(false)}
          />

          <Modal visible={cancelModal.visible} transparent animationType="fade">
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
                  Cancel Appointment
                </Text>
                <Text style={{ ...Typography.body, fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                  Please provide a reason for cancelling this appointment:
                </Text>
                <TextInput
                  placeholder="e.g. I have a schedule conflict with a class exam."
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
                  value={cancelModal.reason}
                  onChangeText={(txt) => setCancelModal({ ...cancelModal, reason: txt })}
                />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <AnimatedCancelButton
                    onPress={() => setCancelModal({ visible: false, id: null, reason: "" })}
                    text="Go Back"
                    baseColor="#F1F5F9"
                    hoverColor="#E2E8F0"
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                    textStyle={{ fontFamily: Typography.label.fontFamily, color: '#475569', fontWeight: '700', fontSize: 14 }}
                  />
                  <AnimatedCancelButton
                    onPress={submitCancellation}
                    text="Cancel Appt"
                    baseColor="#EF4444"
                    hoverColor="#DC2626"
                    style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                    textStyle={{ fontFamily: Typography.label.fontFamily, color: '#FFF', fontWeight: '700', fontSize: 14 }}
                  />
                </View>
              </View>
            </View>
          </Modal>
        </ImageBackground>
      </ScrollView>
    </Animated.View>
  );
}

const getStyles = (isMobile, width) => StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    fontFamily: Typography.subtitle.fontFamily,
    marginTop: 12,
    color: THEME.slate400,
    fontSize: 16,
    fontWeight: '600',
  },
  centeringWrapper: {
    minHeight: '100vh',
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    maxWidth: 2000,
    paddingHorizontal: isMobile ? 12 : 50,
  },
  listContent: {
    paddingTop: GUTTER / 2,
    paddingBottom: 24,
  },
  headerContainer: {
    width: '100%',
  },
  columnWrapper: {
    flexDirection: 'row',
    paddingHorizontal: isMobile ? 8 : GUTTER,
  },
  cardWrapper: {
    maxWidth: isMobile ? '100%' : (((width / 2) - (GUTTER * 1.5)) - 40),
    flex: 1,
    paddingHorizontal: isMobile ? 8 : 10,
    marginBottom: isMobile ? 16 : 20,
  },
  heroBanner: {
    backgroundColor: '#002366',
    marginHorizontal: isMobile ? 8 : GUTTER,
    marginVertical: isMobile ? 16 : 20,
    borderRadius: 24,
    padding: isMobile ? 22 : 40,
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    overflow: 'hidden',
    shadowColor: '#002366',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  glassAccent: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  heroTextContent: {
    flex: 1,
    minWidth: 280,
    zIndex: 2,
  },
  heroTitle: {
    fontFamily: Typography.header.fontFamily,
    color: '#FFFFFF',
    fontSize: isMobile ? 24 : 34,
    letterSpacing: -0.5,
    lineHeight: isMobile ? 30 : 40,
  },
  heroSubtitle: {
    fontFamily: Typography.body.fontFamily,
    color: 'rgba(255,255,255,0.75)',
    fontSize: isMobile ? 13 : 16,
    marginTop: 6,
    lineHeight: isMobile ? 19 : 24,
    fontWeight: '400',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: isMobile ? 12 : GUTTER,
    marginTop: 10,
    marginBottom: 10,
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
  filterContainer: {
    paddingHorizontal: GUTTER,
    marginBottom: 16,
    alignSelf: isMobile ? 'stretch' : 'flex-start',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    padding: isMobile ? 64 : 120,
    width: '100%',
  },
  emptyText: {
    fontFamily: Typography.body.fontFamily,
    textAlign: 'center',
    color: '#94A3B8',
    marginTop: 14,
    fontSize: 15,
    fontWeight: '500',
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
