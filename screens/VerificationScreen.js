import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Image, useWindowDimensions, Platform } from 'react-native';
import { Typography } from '../styles/theme';
import api from '../utils/api';

export default function VerificationScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [docType, setDocType] = useState('slip'); // 'slip' or 'meeting'

  useEffect(() => {
    async function fetchVerification() {
      try {
        let pathname = '';
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          pathname = window.location.pathname;
        }

        const isMeeting = pathname.includes('/verify-meeting-report/');
        setDocType(isMeeting ? 'meeting' : 'slip');

        const match = pathname.match(/\/(verify-slip|verify-meeting-report)\/(\d+)/);
        const docId = match ? match[2] : null;

        if (!docId) {
          setData({ not_found: true });
          setLoading(false);
          return;
        }

        const endpoint = isMeeting
          ? `verify-meeting-report/${docId}/?format=json`
          : `verify-slip/${docId}/?format=json`;

        let rawBaseUrl = api.defaults.baseURL || "";
        let cleanBaseUrl = rawBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
        if (!cleanBaseUrl || cleanBaseUrl.startsWith('/') || cleanBaseUrl.includes('localhost') || cleanBaseUrl.includes('127.0.0.1')) {
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            cleanBaseUrl = window.location.origin;
          } else {
            cleanBaseUrl = "https://appointment.ua-cit.com";
          }
        }

        const fetchUrl = `${cleanBaseUrl}/${endpoint}`;
        const response = await fetch(fetchUrl, {
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          const json = await response.json();
          setData(json);
        } else {
          setData({ not_found: true, appointment_id: docId });
        }
      } catch (err) {
        console.error("Verification fetch error:", err);
        setData({ not_found: true });
      } finally {
        setLoading(false);
      }
    }

    fetchVerification();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#002366" />
        <Text style={{ marginTop: 12, color: '#64748B', fontSize: 14 }}>Verifying document authenticity...</Text>
      </View>
    );
  }

  const isNotFound = !data || data.not_found;

  return (
    <ScrollView style={styles.scrollWrapper} contentContainerStyle={styles.container}>
      <View style={[styles.card, isMobile && styles.cardMobile]}>
        
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <Image source={require('../assets/ua-logo.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.uniInfo}>
            <Text style={styles.uniName}>University of the Assumption</Text>
            <Text style={styles.location}>City of San Fernando, Pampanga</Text>
          </View>
        </View>

        <Text style={styles.docTitle}>
          {docType === 'meeting' ? 'Faculty Meeting Report' : 'Consultation Report'}
        </Text>

        {isNotFound ? (
          <View style={styles.unverifiedBadge}>
            <Text style={styles.unverifiedTitle}>⚠️ Verification Failed</Text>
            <Text style={styles.unverifiedSub}>
              No record found for Document ID #{data?.appointment_id || ''}. The QR link or ID may be invalid or expired.
            </Text>
          </View>
        ) : (
          <>
            {/* VERIFIED BADGE */}
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>
                ✓ Verified — This {docType === 'meeting' ? 'meeting report' : 'consultation report'} is authentic.
              </Text>
            </View>

            {docType === 'slip' ? (
              <>
                {/* STUDENT INFORMATION */}
                <Text style={styles.sectionTitle}>Student Information</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Name:</Text>
                  <Text style={styles.value}>{data.full_name}</Text>
                </View>
                {data.student_course ? (
                  <View style={styles.row}>
                    <Text style={styles.label}>Course & Section:</Text>
                    <Text style={styles.value}>{data.student_course} {data.student_year}-{data.student_section}</Text>
                  </View>
                ) : null}
                <View style={styles.row}>
                  <Text style={styles.label}>Date:</Text>
                  <Text style={styles.value}>{data.date}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Time:</Text>
                  <Text style={styles.value}>{data.time}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Service:</Text>
                  <Text style={styles.value}>{data.service}</Text>
                </View>

                {/* APPOINTMENT NOTES */}
                <Text style={styles.sectionTitle}>Appointment Notes</Text>
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{data.appointment_notes}</Text>
                </View>

                {/* CONSULTATION REPORT */}
                <Text style={styles.sectionTitle}>Consultation Report</Text>
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{data.consultation_notes}</Text>
                </View>

                {/* RATING & EVALUATION */}
                {data.rating ? (
                  <>
                    <Text style={styles.sectionTitle}>Student Rating & Evaluation</Text>
                    <View style={styles.notesBox}>
                      <Text style={[styles.notesText, { fontWeight: '700', color: '#D97706' }]}>
                        Rating: {data.rating_display}
                      </Text>
                      {data.rating_feedback ? (
                        <Text style={[styles.notesText, { marginTop: 4 }]}>Feedback: {data.rating_feedback}</Text>
                      ) : null}
                    </View>
                  </>
                ) : null}

                {/* SIGNATURE */}
                <View style={styles.signatureContainer}>
                  <View style={styles.signatureBlock}>
                    <Text style={styles.docName}>{data.faculty_name || 'Attending Faculty'}</Text>
                    <Text style={styles.docLabel}>Attending Faculty</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* MEETING INFORMATION */}
                <Text style={styles.sectionTitle}>Meeting General Information</Text>
                <View style={styles.row}>
                  <Text style={styles.label}>Meeting Title:</Text>
                  <Text style={styles.value}>{data.service}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Host / Organizer:</Text>
                  <Text style={styles.value}>{data.faculty_name}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Date Scheduled:</Text>
                  <Text style={styles.value}>{data.date}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Time:</Text>
                  <Text style={styles.value}>{data.time}</Text>
                </View>

                {/* AGENDA */}
                <Text style={styles.sectionTitle}>Agenda / Details</Text>
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{data.agenda}</Text>
                </View>

                {/* PARTICIPANTS */}
                <Text style={styles.sectionTitle}>Attendance List</Text>
                {data.participants && data.participants.length > 0 ? (
                  data.participants.map((p, index) => (
                    <View key={index} style={styles.participantRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '600', color: '#0F172A', fontSize: 13 }}>{p.full_name}</Text>
                        <Text style={{ fontSize: 11, color: '#64748B' }}>{p.role}</Text>
                      </View>
                      <View style={[styles.badge, p.attended ? styles.badgeAttended : styles.badgeAbsent]}>
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>
                          {p.attended ? '✓ Attended' : '✗ Absent'}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={{ color: '#94A3B8', fontSize: 12, marginVertical: 8 }}>No participants listed.</Text>
                )}

                {/* SIGNATURE */}
                <View style={styles.signatureContainer}>
                  <View style={styles.signatureBlock}>
                    <Text style={styles.docName}>{data.faculty_name || 'Organizer'}</Text>
                    <Text style={styles.docLabel}>Organizer / Attending Host</Text>
                  </View>
                </View>
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollWrapper: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 36,
    borderRadius: 20,
    width: '100%',
    maxWidth: 580,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardMobile: {
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 48,
    height: 48,
    marginRight: 12,
  },
  uniInfo: {
    justifyContent: 'center',
  },
  uniName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  location: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
    textDecorationLine: 'underline',
    color: '#002366',
    marginVertical: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  verifiedBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  verifiedText: {
    fontWeight: '700',
    color: '#15803D',
    fontSize: 13,
  },
  unverifiedBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  unverifiedTitle: {
    fontWeight: '700',
    color: '#DC2626',
    fontSize: 15,
  },
  unverifiedSub: {
    color: '#991B1B',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#002366',
    letterSpacing: 0.8,
    borderBottomWidth: 2,
    borderBottomColor: '#002366',
    paddingBottom: 4,
    marginTop: 18,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'baseline',
  },
  label: {
    fontWeight: '700',
    color: '#000',
    fontSize: 13,
    minWidth: 140,
  },
  value: {
    flex: 1,
    color: '#1E293B',
    fontSize: 13,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeAttended: {
    backgroundColor: '#10B981',
  },
  badgeAbsent: {
    backgroundColor: '#EF4444',
  },
  signatureContainer: {
    marginTop: 30,
    alignItems: 'flex-end',
  },
  signatureBlock: {
    alignItems: 'center',
    width: 180,
  },
  docName: {
    fontWeight: '800',
    fontSize: 13,
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    width: '100%',
    textAlign: 'center',
    paddingBottom: 2,
  },
  docLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
});
