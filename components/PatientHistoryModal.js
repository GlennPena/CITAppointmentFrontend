import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { Typography } from "../styles/theme";

const { height } = Dimensions.get('window');

export default function MedicalHistoryModal({ visible, onClose, patient, appointments }) {
  if (!patient) return null;

  // Get the most recent visit date from the appointments array
  const lastVisitDate = appointments.length > 0 
    ? new Date(appointments[0].date_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) 
    : "No record";

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
            
            {/* STICKY HEADER */}
            <View style={styles.header}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Avatar name={patient.name} size={50} />
                <View style={{ marginLeft: 15 }}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  {/* Dynamically use patient email and ID */}
                  <Text style={styles.patientSub}>{patient.email || 'No email'}</Text>
                </View>
              </View>
              <Pressable onPress={onClose} hitSlop={15}>
                <MaterialCommunityIcons name="close" size={26} color="#94A3B8" />
              </Pressable>
            </View>

            <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
              
              {/* LAST VISIT & STATUS */}
              <View style={styles.topStats}>
                <View>
                  <Text style={styles.labelCaps}>LAST VISIT</Text>
                  <Text style={styles.statValueText}>{lastVisitDate}</Text>
                </View>
              </View>

              {/* PERSONAL INFORMATION SECTION */}
              <View style={styles.infoGrid}>
                <View style={styles.gridBox}>
                  <Text style={styles.labelCaps}>DATE OF BIRTH</Text>
                  <Text style={styles.dataText}>{patient.date_of_birth || "Not set"}</Text>
                </View>
                <View style={styles.gridBox}>
                  <Text style={styles.labelCaps}>GENDER</Text>
                  {/* Changed from .gender to .sex */}
                  <Text style={styles.dataText}>{patient.sex || "Not set"}</Text>
                </View>
                <View style={styles.gridBox}>
                  <Text style={styles.labelCaps}>PHONE</Text>
                  {/* Changed from .phone_number to .contact_number */}
                  <Text style={styles.dataText}>{patient.contact_number || "No contact"}</Text>
                </View>
                <View style={styles.gridBox}>
                  <Text style={styles.labelCaps}>COURSE/YEAR/SECTION</Text>
                  {/* Using your Academic fields */}
                  <Text style={styles.dataText}>{patient.patient_course} {patient.year} - {patient.section || "N/A"}</Text>
                </View>
              </View>

              <View style={styles.fullWidthBox}>
                <Text style={styles.labelCaps}>ADDRESS</Text>
                <Text style={styles.dataText}>{patient.address || "No address provided"}</Text>
              </View>

              {/* PAST VISITS SECTION */}
              <View style={[styles.sectionTitleContainer]}>
                <MaterialCommunityIcons name="history" size={20} color="#002366" />
                <Text style={styles.sectionTitleText}>Consultation History</Text>
              </View>

              <View style={styles.heavyDivider} />

            {appointments.length === 0 ? (
              <Text style={styles.emptyMsg}>No past visit records available for this patient.</Text>
            ) : (
              appointments.map((appt, index) => (
                <View key={index} style={styles.consultationCard}>
                  {/* DATE AND SERVICE HEADER */}
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.iconDateRow}>
                      <MaterialCommunityIcons name="calendar-outline" size={16} color="#64748B" />
                      <Text style={styles.cardDateText}>
                        {new Date(appt.date_time).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                  <View style={styles.serviceTag}>
                    <Text style={styles.serviceTagText}>{appt.service}</Text>
                  </View>
                </View>
                
                <Text style={styles.doctorSubText}>Attended by <Text style={{fontWeight: '800'}}>Dr. {appt.doctor_name}</Text></Text>

                <Text style={[styles.labelTiny, { color: '#002366' }]}>INITIAL COMPLAINT</Text>
                <View style={styles.noteBackground}>
                  <Text style={[styles.noteContent, { marginTop: 2, textTransform: 'Capitalize' }]}>
                    {appt.condition}
                  </Text>
                </View>
                
                {/* NEW: OUTCOME SECTION */}
                <Text style={styles.labelTiny}>OUTCOME</Text>
                <Text style={styles.outcomeMain}>{appt.outcome || "No outcome provided."}</Text>

                {/* NEW: DOCTOR'S CONSULTATION NOTES */}
                <Text style={styles.labelTiny}>DOCTOR'S NOTES</Text>
                <View style={styles.noteBackground}>
                  <Text style={styles.noteContent}>
                    "{appt.consultation_notes || "No specific notes recorded."}"
                  </Text>
                </View>
              </View>
            ))
          )}
            <View style={{ height: 50 }} />
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.primaryActionBtn}>
              <Text style={styles.primaryActionText}>Close History</Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: { 
    backgroundColor: '#FFFFFF', 
    width: '100%', 
    maxWidth: 700,
    maxHeight: '90%', 
    height: height * 0.8,
    borderRadius: 20, 
    overflow: 'hidden',  
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    flexDirection: 'column',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    zIndex: 10
  },
  patientName: { ...Typography.header, fontSize: 22, fontWeight: '800', color: '#0F172A', lineHeight: 18, },
  patientSub: { ...Typography.body, fontSize: 13, color: '#64748B', marginTop: 2 },
  scrollBody: { paddingHorizontal: 30, },
  topStats: { ...Typography.body, flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 12 },
  labelCaps: { ...Typography.header, fontSize: 12, fontWeight: '800', color: '#002366', letterSpacing: 0.5, marginBottom: 4 },
  labelTiny: { ...Typography.header, fontSize: 12, fontWeight: '800', color: '#002366', marginTop: 12 },
  statValueText: { ...Typography.body, fontSize: 16, fontWeight: '700', color: '#1E293B' },
  sectionTitleContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 25 },
  sectionTitleText: { ...Typography.header, fontSize: 16, fontWeight: '800', color: '#002366', marginLeft: 8 },
  heavyDivider: { height: 1.3, backgroundColor: '#1E293B', marginVertical: 12 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridBox: { width: '50%', marginBottom: 15 },
  fullWidthBox: { width: '100%', marginBottom: 15 },
  dataText: { ...Typography.body, fontSize: 14, color: '#1E293B', fontWeight: '400' },
  consultationCard: { padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#1E293B'},
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 10},
  iconDateRow: { flexDirection: 'row', alignItems: 'center' },
  cardDateText: { ...Typography.header, fontSize: 15, fontWeight: '800', color: '#1E293B', marginLeft: 6 },
  serviceTag: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  serviceTagText: { ...Typography.header, color: '#002366', fontSize: 13, fontWeight: '800' },
  doctorSubText: { ...Typography.caption, fontSize: 13, color: '#64748B', marginBottom: 10},
  outcomeMain: { ...Typography.body, fontSize: 12, fontWeight: '400', color: '#1E293B', backgroundColor: '#F8FAFC', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginTop: 6 },
  noteBackground: { backgroundColor: '#F8FAFC',paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginTop: 8 },
  noteContent: { ...Typography.body, fontStyle: 'italic', color: '#475569', fontSize: 12, lineHeight: 20},
  footer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFFFFF', },
  cancelLink: { marginRight: 25 },
  cancelLinkText: { color: '#475569', fontWeight: '800', fontSize: 15 },
  primaryActionBtn: {  backgroundColor: '#002366', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,},
  primaryActionText: { ...Typography.label, color: '#FFF', fontWeight: '800', fontSize: 14, lineHeight: 14,  letterSpacing: 0.1,  },
  emptyMsg: { textAlign: 'center', color: '#94A3B8', marginTop: 20 },
});