import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Text, ActivityIndicator } from "react-native";
import api from "../utils/api";
import AppointmentRow from "../components/AppointmentTable";
import PatientDetailModal from "../components/PatientDetailModal";
import CompleteAppointmentModal from "../components/CompleteAppointmentModal";
import { useWindowDimensions, ScrollView } from "react-native";

export default function DoctorSchedule() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const styles = getStyles(isMobile);


  const [appointments, setAppointments] = useState([]);
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [isCompleteModalVisible, setIsCompleteModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, [dateStr]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`appointments/?date=${dateStr}`);
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, newStatus) => {
    try {
      await api.patch(`appointments/${id}/`, { status: newStatus });
      loadData();
    } catch (err) {
      console.error("Failed to update status:", err.response?.data);
      alert("Error: " + (err.response?.data?.detail || "Action failed"));
    }
  };

  const handleOpenCompleteModal = (item) => {
    console.log("Button clicked for patient:", item.patient_name);
    setSelectedItem(item);
    setIsCompleteModalVisible(true);
  };

  const handleConfirmCompletion = async (data) => {
    try {
      // Hits your @action(detail=True, methods=['post']) endpoint
      await api.post(`appointments/${selectedItem.id}/complete_appointment/`, {
        outcome: data.outcome,
        consultation_notes: data.consultation_notes,
      });
      
      setIsCompleteModalVisible(false);
      loadData(); // Refresh list to show 'Completed' status
    } catch (err) {
      console.error("Completion error:", err);
      alert("Failed to save consultation records.");
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    await api.delete(`appointments/${id}/`);
    loadData();
  };

  const TableHeader = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.headerCell, { flex: 1 }]}>Date</Text>
      <Text style={[styles.headerCell, { flex: 1 }]}>Time</Text>
      <Text style={[styles.headerCell, { flex: 2 }]}>Patient</Text>
      <Text style={[styles.headerCell, { flex: 2 }]}>Service</Text>
      <Text style={[styles.headerCell, { flex: 1.5 }]}>Status</Text>
      <Text style={[styles.headerCell, { flex: 2, textAlign: 'right' }]}>Actions</Text>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* 🔵 HEADER CARD */}
      <View style={styles.headerCard}>
        <View>
          <Text style={styles.title}>Doctor Schedule</Text>
          <Text style={styles.subtitle}>
            {new Date().toDateString()}
          </Text>
        </View>

        {/* DATE PICKER */}
        <View style={styles.datePickerBox}>
          <Text style={styles.datePickerLabel}>Change Date</Text>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            style={styles.dateInput}
          />
        </View>
      </View>

      {/* 🔄 LOADING */}
      {loading ? (
        <ActivityIndicator size="large" color="#0052FF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={isMobile ? null : TableHeader}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => (
            <AppointmentRow
              item={item}
              onViewDetails={() => handleViewDetails(item)}
              onAction={handleAction}
              onCompletePress={handleOpenCompleteModal}
              onDelete={handleDelete}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Appointments</Text>
              <Text style={styles.emptyText}>
                There are no scheduled appointments for this date.
              </Text>
            </View>
          }
        />
      )}

      {/* MODALS */}
      <PatientDetailModal 
        visible={isModalVisible} 
        item={selectedItem} 
        onClose={() => setIsModalVisible(false)} 
        onAction={handleAction}
      />

      <CompleteAppointmentModal
        visible={isCompleteModalVisible}
        patientName={selectedItem?.patient_name}
        onClose={() => setIsCompleteModalVisible(false)}
        onConfirm={handleConfirmCompletion}
      />
    </View>
  );
}

const getStyles = (isMobile) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    padding: isMobile ? 10 : 16,
  },

  /* HEADER CARD */
  headerCard: {
    backgroundColor: '#002366',
    padding: isMobile ? 14 : 20,
    borderRadius: 20,
    marginBottom: 20,
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    gap: isMobile ? 10 : 0,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },

  title: {
    color: '#FFFFFF',
    fontSize: isMobile ? 18 : 24,
    fontWeight: '800',
  },

  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontSize: isMobile ? 11 : 13,
    fontWeight: '500',
  },

  /* DATE PICKER */
  datePickerBox: {
    alignItems: isMobile ? 'stretch' : 'flex-end',
    width: isMobile ? '100%' : 'auto',
  },

  datePickerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginBottom: 6,
    fontWeight: '600',
  },

  dateInput: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5F5',
    backgroundColor: '#FFFFFF',
    fontSize: 13,
    cursor: 'pointer',
  },

  /* TABLE HEADER */
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },

  headerCell: {
    fontSize: isMobile ? 10 : 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },

  /* EMPTY STATE */
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    padding: 20,
  },

  emptyTitle: {
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },

  emptyText: {
    fontSize: isMobile ? 12 : 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

