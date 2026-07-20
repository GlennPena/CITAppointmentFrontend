import { useState, useEffect } from "react";
import { View, TextInput, FlatList, StyleSheet, ActivityIndicator, ScrollView, ImageBackground, useWindowDimensions} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

import api from "../utils/api";

import StudentHistoryCard from "../components/StudentHistoryCard";
import StudentHistoryModal from "../components/StudentHistoryModal";
import AppFooter from "../components/AppFooter";

import PaginationControls from "../components/PaginationControls";

export default function StudentHistory({ navigation }) {

  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;
  const styles = getStyles(isMobile, isDesktop, width);

  const numColumns = isDesktop ? 2 : 1;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [medicalModalVisible, setMedicalModalVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentAppointments, setStudentAppointments] = useState([]);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(students.length / ITEMS_PER_PAGE);
  const clampedPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const paginatedStudents = students.slice(
    (clampedPage - 1) * ITEMS_PER_PAGE,
    clampedPage * ITEMS_PER_PAGE
  );

  const loadStudents = async (query = "") => {
    setLoading(true);
    try {
      const url = query 
        ? `appointments/?status=Completed&search=${query}` 
        : `appointments/?status=Completed`;
      const res = await api.get(url);
      // Filter out internal faculty/dean meetings (student is null)
      const studentOnly = res.data.filter(appt => appt.student !== null);
      setStudents(groupStudents(studentOnly));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const groupStudents = (data) => {
    const map = data.reduce((acc, appt) => {
      const id = appt.student;
      if (!acc[id]) {
        acc[id] = { 
          id: id,
          name: appt.student_name, 
          email: appt.student_email,
          
          sex: appt.student_sex || appt.sex, 
          date_of_birth: appt.student_dob || appt.date_of_birth,
          contact_number: appt.student_phone || appt.contact_number,
          address: appt.student_address || appt.address,
          
          student_course: appt.student_course || appt.course,
          year: appt.student_year || appt.year,
          section: appt.student_section || appt.section,
          
          visitCount: 0 
        };
      }
      acc[id].visitCount += 1;
      return acc;
    }, {});
    return Object.values(map);
  };

  const handleOpenMedicalHistory = async (student) => {
    setSelectedStudent(student);
    setMedicalModalVisible(true);
    setStudentAppointments([]);

    try {
      const res = await api.get(`appointments/?student=${student.id}&status=Completed`);
      const specificData = res.data.filter(appt => appt.student === student.id);
    
      setStudentAppointments(specificData);
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
        <View style={styles.mainWrapper}>
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={24} color="#94A3B8" />
            <TextInput 
              placeholder="Search student name..." 
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.length >= 1 || text.length === 0) loadStudents(text);
              }}
            />
          </View>

          {loading && students.length === 0 ? (
            <ActivityIndicator size="large" color="#002366" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={paginatedStudents}
              key={numColumns}
              numColumns={numColumns}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <StudentHistoryCard 
                    student={item} 
                    onPress={() => handleOpenMedicalHistory(item)} 
                  />
                </View>
              )}
              contentContainerStyle={{ paddingBottom: 30 }}
              ListFooterComponent={
                <PaginationControls
                  currentPage={clampedPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              }
            />
          )}

          <StudentHistoryModal 
            visible={medicalModalVisible}
            onClose={() => setMedicalModalVisible(false)}
            student={selectedStudent}
            appointments={studentAppointments}
          />
        </View>
        <AppFooter userRole="faculty" navigation={navigation} />
      </ImageBackground>
    </ScrollView>
  );
}

const getStyles = (isMobile, isDesktop, width) => StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainWrapper: {
    minHeight: '90vh',
    width: '100%',
    paddingHorizontal: isMobile ? 12 : 50, 
    paddingTop: 16
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    width: '100%',
    height: '100%', 
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
