import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, Pressable, ScrollView, ImageBackground } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from "../utils/api";

// Import your new feedback components
import AdminAppointmentRow from "../components/AdminAppointmentTable";
import PatientDetailModal from "../components/PatientDetailModal";
import { ConfirmModal } from "../components/ConfirmModal";
import { Toast } from "../components/Toast";
import InlineAlert from "../components/InlineAlert";
import StatBox from "../components/StatBox";
import { StatusFilter } from "../components/StatusFilter";
import { useWindowDimensions } from "react-native";
import { Typography } from "../styles/theme";

export default function AdminDashboard({ navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const styles = getStyles(isMobile);

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Feedback State
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [confirmDelete, setConfirmDelete] = useState({ visible: false, id: null });

  // Modal State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });

  // Personnel Management State
  const [personnel, setPersonnel] = useState([]);
  const [showAddPersonnelModal, setShowAddPersonnelModal] = useState(false);
  const [personnelForm, setPersonnelForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    role: "doctor",
    password: "",
  });

  const [activeFilter, setActiveFilter] = useState("All");
  const [sidebarSelection, setSidebarSelection] = useState("Overview");
  const filterOptions = ["All", "Completed", "Cancelled", "Rejected"];

  const [accountFilter, setAccountFilter] = useState("All");
  const accountFilterOptions = ["All", "Patient", "Doctor", "Admin"];

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
      extractPatients(res.data);
    } catch (err) {
      setError("Failed to load appointment records. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const extractPatients = (appointmentData) => {
    const patientMap = {};
    appointmentData.forEach(appt => {
      const patientId = appt.patient;
      if (!patientMap[patientId]) {
        patientMap[patientId] = {
          id: patientId,
          name: appt.patient_name,
          email: appt.patient_email,
          appointmentCount: 0
        };
      }
      patientMap[patientId].appointmentCount += 1;
    });
    setPatients(Object.values(patientMap));
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

      console.log("SENDING:", payload);

      const response = await api.post("/admin/add-personnel/", payload);

      console.log("SUCCESS:", response.data);

      // Optional: reset form after success
      setPersonnelForm({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        contact: "",
        role: "doctor",
        password: "",
      });

      setShowAddPersonnelModal(false);
      loadPersonnel();
      setToast({ visible: true, message: "Account created successfully", type: "success" });
    } catch (error) {
      setToast({ 
        visible: true, 
        message: error.response?.data?.username || "Failed to create account", 
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

  const filteredAppointments = appointments.filter(item => {
    const matchesSearch =
      item.patient_name?.toLowerCase().includes(searchQuery.toLowerCase());

    const now = new Date();
    const appointmentDate = item.dateTime ? new Date(item.dateTime) : null;

    const isOngoing =
      item.status === "Approved" && appointmentDate && appointmentDate <= now;

    let matchesStatus = false;

    if (activeFilter === "All") {
      matchesStatus = true;
    } else if (activeFilter === "Ongoing") {
      matchesStatus = isOngoing;
    } else {
      matchesStatus = item.status === activeFilter;
    }

    return matchesSearch && matchesStatus;
  });

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

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#0052FF" style={{ flex: 1 }} />
    );
  }

  return (
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
          isMobile && {
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-around',
            paddingVertical: 12
          }
        ]}>
          {!isMobile && (
            <Text style={styles.sidebarTitle}>Admin Menu</Text>
          )}

          <View style={{ flexDirection: isMobile ? 'row' : 'column'}}>
          <Pressable
            onPress={() => setSidebarSelection('Overview')}
            style={({ pressed, hovered }) => [
              styles.sidebarItem,
              sidebarSelection === 'Overview' && styles.sidebarItemActive,
              hovered && styles.sidebarItemHover,
              pressed && styles.sidebarItemPressed,
            ]}
          >
            <View style={styles.sidebarItemRow}>
              <MaterialCommunityIcons
                name="view-dashboard-outline"
                size={isMobile ? 14 : 22}
                color={sidebarSelection === 'Overview' ? '#FFFFFF' : '#64748B'}
              />
              <Text style={[styles.sidebarItemText, sidebarSelection === 'Overview' && styles.sidebarItemTextActive]}>Overview</Text>
            </View>
          </Pressable>
          </View>
          <Pressable
            onPress={() => setSidebarSelection('Patients')}
            style={({ pressed, hovered }) => [
              styles.sidebarItem,
              sidebarSelection === 'Patients' && styles.sidebarItemActive,
              hovered && styles.sidebarItemHover,
              pressed && styles.sidebarItemPressed,
            ]}
          >
            <View style={styles.sidebarItemRow}>
              <MaterialCommunityIcons
                name="account-group-outline"
                size={isMobile ? 14 : 22}
                color={sidebarSelection === 'Patients' ? '#FFFFFF' : '#64748B'}
              />
              <Text style={[styles.sidebarItemText, sidebarSelection === 'Patients' && styles.sidebarItemTextActive]}>Patients</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => setSidebarSelection('Personnel')}
            style={({ pressed, hovered }) => [
              styles.sidebarItem,
              sidebarSelection === 'Personnel' && styles.sidebarItemActive,
              hovered && styles.sidebarItemHover,
              pressed && styles.sidebarItemPressed,
            ]}
          >
            <View style={styles.sidebarItemRow}>
              <MaterialCommunityIcons
                name="account-circle"
                size={isMobile ? 12 : 22}
                color={sidebarSelection === 'Personnel' ? '#FFFFFF' : '#64748B'}
              />
              <Text style={[styles.sidebarItemText, sidebarSelection === 'Personnel' && styles.sidebarItemTextActive]}>Accounts</Text>
            </View>
          </Pressable>
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
              data={filteredAppointments}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No records found.</Text>
              }
              ListHeaderComponent={
                <>
                  <View style={styles.header}>
                    <Text style={[
                      styles.title,
                      styles.pageTitle,
                      isMobile && { fontSize: 22, lineHeight: 28 }
                    ]}>
                      System Administration
                    </Text>

                    <InlineAlert
                      message={error}
                      type="error"
                      onClose={() => setError(null)}
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
                    <View style={styles.glassAccent} />
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
                    setSelectedPatient(pt);
                    setDetailVisible(true);
                  }}
                />
              )}
            />
          
          ) : sidebarSelection === 'Patients' ? (
            <FlatList
              data={patients.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()))}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No patients found.</Text>
              }
              ListHeaderComponent={
                <>
                  <View style={styles.header}>
                    <Text style={[styles.title, styles.pageTitle]}>
                      Patients
                    </Text>

                    <View style={styles.searchContainer}>
                      <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
                      <TextInput
                        placeholder="Search patients..."
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>
                    <View style={styles.glassAccent} />
                  </View>

                  <Text style={styles.sectionTitle}>All Patients ({patients.length})</Text>
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
              data={filteredPersonnel}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No personnel records found.</Text>
              }
              ListHeaderComponent={
                <>
                  <View style={styles.header}>
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
                    <View style={styles.glassAccent} />
                  </View>


                  <View style={[styles.row]}>
                      <View style={[styles.flex, { marginRight: 80 } ]}>
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
                  

                  {/* THIS */}
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
                    {item.contact_number && (
                      <Text style={styles.personnelContact}>{item.contact_number}</Text>
                    )}
                  </View>
                  <View style={styles.personnelMeta}>
                    <View style={[styles.roleBadge, item.role === 'doctor' && styles.roleBadgeDoctor]}>
                      <Text style={styles.roleBadgeText}>{item.role || 'Staff'}</Text>
                    </View>
                    <Pressable onPress={() => requestUserDelete(item.id)}>
                      <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              )}
            />
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

      <PatientDetailModal
        visible={detailVisible}
        item={selectedPatient}
        onClose={() => setDetailVisible(false)}
        onAction={() => {}}
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
                {['doctor', 'admin'].map((role) => (
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
    </ImageBackground>
  );
}

const getStyles = (isMobile) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  header: {
    marginBottom: 24,
    padding: 24,
    borderRadius: 28,
    backgroundColor: '#002366',
    borderBottomWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 8,
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
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 7
  },
  sidebar: {
    width: 250,
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    backgroundColor: 'rgba(248,250,252,0.96)',
    backgroundColor: 'white'
  },
  sidebarTitle: {
    ...Typography.header,
    fontSize: isMobile ? 15 : 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 30
  },
  sidebarItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#F8FAFC'
  },
  sidebarItemActive: {
    backgroundColor: '#002366'
  },
  sidebarItemHover: {
    backgroundColor: '#CBD5E1'
  },
  sidebarItemPressed: {
    backgroundColor: '#94A3B8'
  },
  sidebarItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sidebarItemText: {
    ...Typography.title,
    marginLeft: isMobile ? 0 : 14,
    fontSize: isMobile ? 11 : 15,
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
  // Personnel styles
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
  roleBadgeDoctor: {
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
  // Modal styles
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
    top: 0,
    right: -30,
    width: 190,
    height: 190,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  }
});