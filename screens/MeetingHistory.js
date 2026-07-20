import { useState, useEffect } from "react";
import { View, TextInput, FlatList, StyleSheet, ActivityIndicator, ScrollView, ImageBackground, useWindowDimensions, Text } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';

import api from "../utils/api";
import MeetingHistoryCard from "../components/MeetingHistoryCard";
import MeetingHistoryModal from "../components/MeetingHistoryModal";
import AppFooter from "../components/AppFooter";

import PaginationControls from "../components/PaginationControls";

export default function MeetingHistory({ navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1200;
  const styles = getStyles(isMobile, isDesktop, width);

  const isFocused = useIsFocused();
  const numColumns = isDesktop ? 2 : 1;

  const [searchQuery, setSearchQuery] = useState("");
  const [allMeetings, setAllMeetings] = useState([]);
  const [loading, setLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  useEffect(() => {
    if (isFocused) {
      loadMeetings();
    }
  }, [isFocused]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`appointments/`);
      // Filter ONLY internal faculty/dean meetings (student is null)
      const internalMeetings = res.data.filter(appt => appt.student === null);
      setAllMeetings(internalMeetings);
    } catch (err) {
      console.error("Failed to load meetings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filter by meeting title or faculty name
  const filteredMeetings = searchQuery.trim()
    ? allMeetings.filter(m => {
      const q = searchQuery.toLowerCase();
      const title = (m.service || "").toLowerCase();
      const host = (m.faculty_name || "").toLowerCase();
      return title.includes(q) || host.includes(q);
    })
    : allMeetings;

  const totalPages = Math.ceil(filteredMeetings.length / ITEMS_PER_PAGE);
  const clampedPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const paginatedMeetings = filteredMeetings.slice(
    (clampedPage - 1) * ITEMS_PER_PAGE,
    clampedPage * ITEMS_PER_PAGE
  );

  const handleOpenDetails = (meeting) => {
    setSelectedMeeting(meeting);
    setModalVisible(true);
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
              placeholder="Search meeting title or host name..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color="#94A3B8"
                onPress={() => setSearchQuery("")}
                style={{ cursor: 'pointer' }}
              />
            )}
          </View>

          {loading && allMeetings.length === 0 ? (
            <ActivityIndicator size="large" color="#002366" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={paginatedMeetings}
              key={numColumns}
              numColumns={numColumns}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
              renderItem={({ item }) => (
                <View style={styles.cardWrapper}>
                  <MeetingHistoryCard
                    meeting={item}
                    onPress={() => handleOpenDetails(item)}
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
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="calendar-blank-outline" size={48} color="#94A3B8" />
                  <Text style={styles.emptyTitle}>
                    {searchQuery.trim() ? "No Results Found" : "No Completed Meetings"}
                  </Text>
                  <Text style={styles.emptyText}>
                    {searchQuery.trim()
                      ? `No meetings match "${searchQuery}".`
                      : "No completed faculty meetings yet."}
                  </Text>
                </View>
              }
            />
          )}

          <MeetingHistoryModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            meeting={selectedMeeting}
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
    color: '#0F172A',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#0D1B2A',
  },
  emptyText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
  }
});
