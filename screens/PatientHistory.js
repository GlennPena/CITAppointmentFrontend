import { useState, useEffect } from "react";
import { View, TextInput, FlatList, StyleSheet, ActivityIndicator, ScrollView, ImageBackground, useWindowDimensions} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

import api from "../utils/api";

import PatientHistoryCard from "../components/PatientHistoryCard";
import MedicalHistoryModal from "../components/PatientHistoryModal";

export default function PatientHistory() {

  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;
  const styles = getStyles(isMobile, isDesktop, width);

  const numColumns = isDesktop ? 2 : 1;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);

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
          
          sex: appt.patient_sex || appt.sex, 
          date_of_birth: appt.patient_dob || appt.date_of_birth,
          contact_number: appt.patient_phone || appt.contact_number,
          address: appt.patient_address || appt.address,
          
          patient_course: appt.patient_course || appt.course,
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
    setPatientAppointments([]);

    try {
      const res = await api.get(`appointments/?patient=${patient.id}&status=Completed`);
      const specificData = res.data.filter(appt => appt.patient === patient.id);
    
      setPatientAppointments(specificData);
    } catch (err) {
      console.error("Error fetching specific history:", err);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

      <ImageBackground 
        source={require('../assets/redox-01.png')} 
        style={[styles.container]}
        resizeMode="repeat"
      >
        <View>
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={24} color="#94A3B8" />
            <TextInput 
              placeholder="Search patient name..." 
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.length >= 1 || text.length === 0) loadPatients(text);
              }}
            />
          </View>

          {loading && patients.length === 0 ? (
            <ActivityIndicator size="large" color="#002366" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={patients}
              key={numColumns}
              numColumns={numColumns}
              keyExtractor={(item) => item.id.toString()}
              columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <PatientHistoryCard 
                    patient={item} 
                    onPress={() => handleOpenMedicalHistory(item)} 
                  />
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 30 }}
            />
          )}

          <MedicalHistoryModal 
            visible={medicalModalVisible}
            onClose={() => setMedicalModalVisible(false)}
            patient={selectedPatient}
            appointments={patientAppointments}
          />
        </View>
      </ImageBackground>
    </ScrollView>
  );
}

const getStyles = (isMobile, isDesktop, width) => StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    width: '100%',
    height: '100%', 
    paddingHorizontal: isMobile ? 12 : 50, 
    paddingTop: 16
  },
  searchContainer: { 
    marginTop: 16,
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
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontSize: 16, 
    color: '#858181',
    fontStyle: 'italic',
    outlineStyle: 'none'
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 20, 
    paddingHorizontal: isDesktop ? 50 : 10
  },
  cardWrapper: {
    maxWidth: isDesktop ? (((width / 2) - (145 * 1.5)) - 40) : '100%',
    flex: 1,
    paddingHorizontal: isMobile ? 8 : 10,
    marginBottom: isMobile ? 16 : 20,
  },
});