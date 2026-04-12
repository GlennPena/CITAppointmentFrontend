import { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Text, ActivityIndicator, Pressable, ScrollView, ImageBackground, useWindowDimensions} from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';

import AppointmentRow from "../components/AppointmentTable";
import PatientDetailModal from "../components/PatientDetailModal";
import CompleteAppointmentModal from "../components/CompleteAppointmentModal";

import api from "../utils/api";
import { Typography } from "../styles/theme";


export default function DoctorSchedule() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;
  const styles = getStyles(isMobile, isDesktop);

  const [appointments, setAppointments] = useState([]);
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false); 
  const [selectedItem, setSelectedItem] = useState(null);

  const [isCompleteModalVisible, setIsCompleteModalVisible] = useState(false);

  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    loadData();
  }, [dateStr, sortOrder]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`appointments/?date=${dateStr}`);
      
      let data = res.data;

      data.sort((a, b) => {
        const timeA = new Date(a.date_time);
        const timeB = new Date(b.date_time);
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });

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
      alert("Error: " + (err.response?.data?.detail || "Action failed"));
    }
  };

  const handleOpenCompleteModal = (item) => {
    setSelectedItem(item);
    setIsCompleteModalVisible(true);
  };

  const handleConfirmCompletion = async (data) => {
    try {
      await api.post(`appointments/${selectedItem.id}/complete_appointment/`, {
        outcome: data.outcome,
        consultation_notes: data.consultation_notes,
      });
      
      setIsCompleteModalVisible(false);
      loadData(); 
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

      <View style={{ flex: 1.5 }}>
        <Text style={styles.headerCell}>Date</Text>
      </View>

      <View style={{ flex: 1.5 }}>
        <Text style={styles.headerCell}>Time</Text>
      </View>

      <View style={{ flex: 2 }}>
        <Text style={styles.headerCell}>Patient</Text>
      </View>

      <View style={{ flex: 2 }}>
        <Text style={styles.headerCell}>Service</Text>
      </View>

      <View style={{ flex: 2 }}>
        <Text style={styles.headerCell}>Condition</Text>
      </View>

      <View style={{ flex: 1.5 }}>
        <Text style={styles.headerCell}>Status</Text>
      </View>

      <View style={{ flex: 2 }}>
        <Text style={[styles.headerCell, {textAlign: 'right', paddingRight:10 }]}>Actions</Text>
      </View>
  </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

      <ImageBackground 
        source={require('../assets/redox-01.png')} 
        style={[styles.container]}
        resizeMode="repeat"
      >

      <View style={styles.mainWrapper} contentContainerStyle={{ padding: 25 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Today's Schedule</Text>

            <Text style={styles.dateSubtext}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <View style={styles.glassAccent} />
        </View>
        
        <View style={styles.filterRow}>
          <View style={styles.filterGroup}>
            <View style={styles.datePickerBox}>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                style={styles.dateInput}
              />
            </View>

            <Pressable 
              style={styles.sortBtn} 
              onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            >
              <MaterialCommunityIcons 
                name={sortOrder === 'newest' ? "sort-calendar-descending" : "sort-calendar-ascending"} 
                size={22} 
                color="#000000" 
              />
            </Pressable>
          </View>
        </View>
      
        <ScrollView horizontal={!isDesktop} showsHorizontalScrollIndicator={!isDesktop}>
          <View style={{ width: '100%' }}>
            {loading ? (
              <ActivityIndicator size="large" color="#0052FF" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={appointments}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={TableHeader}
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
          </View>
        </ScrollView>

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
      </ImageBackground>
    </ScrollView>
  );
}

const getStyles = (isMobile, isDesktop) => StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    width: '100%',
    height: '100%', 
    paddingHorizontal: isMobile ? 12 : 50, 
    paddingTop: 16
  },
  header: {
    marginBottom: 24,
    marginTop: 16,
    padding: isMobile ? 30 : 36,
    borderRadius: 28,
    backgroundColor: '#002366',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 8,
    width: '100%',

    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'flex-start' : 'center',
    gap: isMobile ? 10 : 0,
  },
  pageTitle: {
    ...Typography.header,
    fontSize: isMobile ? 24 : 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  dateSubtext: {
    ...Typography.title,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 18,
    fontWeight: '600'
  },
  glassAccent: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  datePickerBox: {
    flexDirection: 'row', 
    alignItems: 'center',
    marginVertical: 20,
    gap: 12
  },
  datePickerLabel: {
    ...Typography.title,
    color: '#002366',
    fontSize: 18,
    fontWeight: '800',
  },
  dateInput: {
    ...Typography.body,
    fontWeight: '600',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    cursor: 'pointer',
    lineHeight: 1,
    outlineStyle: 'none',
    width: 105,
    paddingRight: 8,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#ffffff',
    padding: 6,
    paddingHorizontal: 12

  },
  sortBtnText: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },

  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: isDesktop ? '100%' : 1000,
  },
  headerCell: {
    ...Typography.label,
    fontSize: isMobile ? 10 : 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    paddingLeft: 20
  },

  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    ...Typography.body,
    fontSize: isMobile ? 16 : 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  emptyText: {
    ...Typography.body,
    fontSize: isMobile ? 12 : 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  mainWrapper: {
    width: '100%',
  }
});

