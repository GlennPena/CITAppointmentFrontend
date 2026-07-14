import { useState, useEffect, useCallback } from "react";
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
   Alert
 } from "react-native";
 import AsyncStorage from '@react-native-async-storage/async-storage';
 import { MaterialCommunityIcons } from '@expo/vector-icons';
 
 import BookingModal from "../components/BookingModal";
 import AppointmentCard from "../components/AppointmentCard";
 import { StatusFilter } from "../components/StatusFilter";
 import { Toast } from "../components/Toast";
 import { ConfirmModal } from "../components/ConfirmModal";
 
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
 
 
 export default function StudentDashboard() {
   const { width } = useWindowDimensions();
 
   const isMobile = width < 768;
   const COLUMN_COUNT = isMobile ? 1 : 2;
 
   const styles = getStyles(isMobile, width);
 
 
   const [name, setName] = useState("");
   const [isVisible, setIsVisible] = useState(false);
   const [facultyList, setFacultyList] = useState([]);
   const [appointments, setAppointments] = useState([]);
   const [loading, setLoading] = useState(true);
   const [filter, setFilter] = useState("All");
   const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
 
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
             <Pressable
               style={{ backgroundColor: '#F87171', padding: 10, borderRadius: 8 }}
               onPress={() => openCancelConfirm(item.id)}
             >
               <Text style={{ color: '#FFF', textAlign: 'center' }}>
                 Cancel
               </Text>
             </Pressable>
           )}
 
           {/* REJECTED / CANCELLED / COMPLETED / EXPIRED → Delete */}
           {["Rejected", "Cancelled", "Completed", "Expired"].includes(status) && (
             <Pressable
               style={{ backgroundColor: '#002366', padding: 10, borderRadius: 8 }}
               onPress={() => openDeleteConfirm(item.id)}
             >
               <Text style={{ ...Typography.label, color: '#FFF', textAlign: 'center', fontWeight:'400' }}>
                 Delete
               </Text>
             </Pressable>
           )}
 
           {/* APPROVED → Display only */}
           {status === "Approved" && (
             <View style={{ padding: 10 }}>
               <Text style={{ textAlign: 'center', color: '#10B981', fontWeight: 'bold' }}>
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
     <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
           data={upcoming}
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
                 <View style={styles.glassAccent} />
                   <View style={styles.heroTextContent}>
                     <Text style={styles.heroTitle}>Welcome, {name}!</Text>
                     <Text style={styles.heroSubtitle}>Your academic support starts here. Book an appointment with the Dean or a faculty member.</Text>
                   </View>
                   <Pressable 
                     style={({ pressed }) => [
                       styles.bookBtn,
                       pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
                     ]} 
                     onPress={() => setIsVisible(true)}
                     >
                     <MaterialCommunityIcons name="plus-circle" size={20} color={THEME.primaryBlue} />
                     <Text style={styles.bookBtnText}>Book Appointment</Text>
                   </Pressable>
                 </View>
 
               <View style={styles.sectionHeader}>
                 <View style={styles.iconBox}>
                   <MaterialCommunityIcons name="calendar-clock" size={28} color={THEME.primaryBlue} />
                 </View>
                 <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
                 {upcoming.length > 0 && (
                   <View style={styles.activeBadge}>
                     <Text style={styles.activeBadgeText}>{upcoming.length} ACTIVE</Text>
                   </View>
                 )}
               </View>
             </View>
           }
           ListFooterComponent={
             <View style={styles.footerSection}>
               <View style={styles.sectionHeader}>
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
                 data={history}
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
             </View>
           }
         />
       </View>
 
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
             <Text style={{ ...Typography.header, fontSize: 18, fontWeight: '800', color: '#002366', marginBottom: 8 }}>
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
                 color: '#1E293B',
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
               <Pressable
                 style={{ flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                 onPress={() => setCancelModal({ visible: false, id: null, reason: "" })}
               >
                 <Text style={{ color: '#475569', fontWeight: '700', fontSize: 14 }}>Go Back</Text>
               </Pressable>
               <Pressable
                 style={{ flex: 1, backgroundColor: '#EF4444', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
                 onPress={submitCancellation}
               >
                 <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Cancel Appt</Text>
               </Pressable>
             </View>
           </View>
         </View>
       </Modal>
     </ImageBackground>
     </ScrollView>
   );
 }
 
 const getStyles = (isMobile, width) => StyleSheet.create({
   scrollContainer: {
     flexGrow: 1,
     justifyContent: 'center',
   },
   container: {
     flex: 1,
     alignItems: 'center',
     justifyContent: 'center',
     backgroundColor: '#F8FAFC',
     width: '100%',
     height: '100%', 
     paddingHorizontal: isMobile ? 12 : 50
   },
   loadingContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: THEME.white,
   },
   loadingText: {
     marginTop: 12,
     color: THEME.slate400,
     fontSize: 16,
     fontWeight: '600',
   },
   centeringWrapper: {
     flex: 1,
     width: '100%',
     alignSelf: 'center',
     maxWidth: 2000,
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
     backgroundColor: THEME.primaryBlue,
     marginHorizontal: isMobile ? 8 : GUTTER,
     marginTop: GUTTER / 2,
     borderRadius: 24,
     padding: isMobile ? 20 : 40,
     flexDirection: isMobile ? 'column' : 'row',
     alignItems: isMobile ? 'flex-start' : 'center',
     justifyContent: 'space-between',
     flexWrap: 'wrap',
     overflow: 'hidden',
     borderWidth: 1,
     borderColor: THEME.slate100,
     ...Platform.select({
       ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
       android: { elevation: 1 },
     }),
   },
   glassAccent: {
     position: 'absolute',
     top: -20,
     right: -20,
     width: 180,
     height: 180,
     borderRadius: 75,
     backgroundColor: THEME.glassWhite,
   },
   heroTextContent: {
     flex: 1,
     minWidth: 280,
     zIndex: 2,
   },
   heroTitle: {
     ...Typography.header,
     color: THEME.white,
     fontSize: isMobile ? 24 : 36,
     fontWeight: '900',
     letterSpacing: -0.5,
     lineHeight: isMobile ? 28 : 36,
   },
   heroSubtitle: {
     ...Typography.caption,
     color: THEME.white,
     fontSize: isMobile ? 14 : 18,
     marginTop: 6,
     opacity: 0.85,
     lineHeight: isMobile ? 18 : 20,
     fontWeight: '500',
     letterSpacing: 0.1,
   },
   bookBtn: {
     backgroundColor: THEME.white,
     paddingHorizontal: 18,
     paddingVertical: 12,
     borderRadius: 14,
     flexDirection: 'row',
     alignItems: 'center',
     zIndex: 2,
     borderWidth: 1,
     borderColor: THEME.slate100,
     ...Platform.select({
       ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
       android: { elevation: 1 },
     }),
     width: isMobile ? '100%' : 'auto',
     justifyContent: 'center',
     marginTop: 12,
   },
   bookBtnText: {
     ...Typography.label,
     color: THEME.primaryBlue,
     fontWeight: '800',
     fontSize: 16,
     marginLeft: 6,
     letterSpacing: 0.1
   },
   sectionHeader: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingHorizontal: isMobile ? 12 : GUTTER,
     marginTop: 32,
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
     ...Typography.title,
     fontSize: isMobile ? 18 : 22,
     fontWeight: '800',
     color: THEME.slate900,
     marginLeft: isMobile ? 0 :10,
     letterSpacing: -0.4,
   },
   activeBadge: {
     backgroundColor: THEME.primaryBlue,
     paddingHorizontal: 10,
     paddingVertical: 4,
     borderRadius: 8,
     marginLeft: 8,
   },
   activeBadgeText: {
     color: '#fff',
     fontSize: 10,
     fontWeight: '900',
   },
   filterContainer: {
     paddingHorizontal: GUTTER,
     marginBottom: 20,
     alignSelf: isMobile ? 'stretch' : 'flex-start',
   },
   emptyContainer: {
     flex: 1,
     alignItems: 'center',
     padding: isMobile ? 20 : 40,
     width: '100%',
   },
   emptyText: {
     ...Typography.body,
     textAlign: 'center',
     color: THEME.slate400,
     marginTop: 16,
     fontSize: 16,
     fontWeight: '500',
   },
 });
