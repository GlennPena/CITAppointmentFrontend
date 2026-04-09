import React, { useState, useEffect } from "react";
import { View, TextInput, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from "../utils/api";
import PatientHistoryCard from "../components/PatientHistoryCard";
import MedicalHistoryModal from "../components/PatientHistoryModal";

export default function PatientHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [medicalModalVisible, setMedicalModalVisible] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientAppointments, setPatientAppointments] = useState([]);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async (query = "") => {
    setLoading(true);
    try {
      const url = query 
        ? `appointments/?status=Completed&search=${query}` 
        : `appointments/?status=Completed`;
      const res = await api.get(url);

      console.log("RAW DATA FROM DATABASE:", res.data[0]);
      setPatients(groupPatients(res.data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const groupPatients = (data) => {
    const map = data.reduce((acc, appt) => {
      const id = appt.patient;
      if (!acc[id]) {
        acc[id] = { 
          id: id,
          name: appt.patient_name, 
          email: appt.patient_email,
          
          // CRITICAL: These must match what your Serializer sends!
          // If your serializer sends 'patient_sex', keep it. 
          // If it sends 'sex', change appt.patient_sex to appt.sex.
          sex: appt.patient_sex || appt.sex, 
          date_of_birth: appt.patient_dob || appt.date_of_birth,
          contact_number: appt.patient_phone || appt.contact_number,
          address: appt.patient_address || appt.address,
          
          // Academic fields
          year: appt.patient_year || appt.year,
          section: appt.patient_section || appt.section,
          
          visitCount: 0 
        };
      }
      acc[id].visitCount += 1;
      return acc;
    }, {});
    return Object.values(map);
  };

  const handleOpenMedicalHistory = async (patient) => {
    setSelectedPatient(patient);
    setMedicalModalVisible(true);
    setPatientAppointments([]); // Clear old data immediately

    try {
      // 1. Try to fetch from the server
      const res = await api.get(`appointments/?patient=${patient.id}&status=Completed`);
      
      // 2. SAFETY FILTER: Even if the server sends everyone, 
      // we only keep the appointments for this specific patient ID.
      const specificData = res.data.filter(appt => appt.patient === patient.id);
      
      setPatientAppointments(specificData);
    } catch (err) {
      console.error("Error fetching specific history:", err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={22} color="#94A3B8" />
        <TextInput 
          placeholder="Search patient name..." 
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (text.length > 2 || text.length === 0) loadPatients(text);
          }}
        />
      </View>

      {loading && patients.length === 0 ? (
        <ActivityIndicator size="large" color="#0052FF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={patients}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PatientHistoryCard 
              patient={item} 
              onPress={() => handleOpenMedicalHistory(item)} 
            />
          )}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      {/* USE THE NEW HIGH-FIDELITY MODAL */}
      <MedicalHistoryModal 
        visible={medicalModalVisible}
        onClose={() => setMedicalModalVisible(false)}
        patient={selectedPatient}
        appointments={patientAppointments}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    marginBottom: 20 
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 }
});