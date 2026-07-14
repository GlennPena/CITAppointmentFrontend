/* 
  Responsible for displaying detailed student information inside a modal, including student profile 
  data, appointment details, and action buttons for approving or rejecting pending appointments. 
*/

import { View, Text, StyleSheet, Modal, Pressable, useWindowDimensions, ScrollView } from 'react-native';
import StatusBadge from './StatusBadge';
import { Typography } from "../styles/theme";

export default function StudentDetailModal({ visible, item, onClose, onAction }) {

  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = getStyles(isMobile);
  
  if (!visible || !item) return null;

  const isMeeting = !item.student_name || item.student_name === "N/A";
  const appointmentDate = new Date(item.date_time);
  const isPast = appointmentDate < new Date();

  const participantsStr = item.participants_detail && item.participants_detail.length > 0
    ? item.participants_detail.map(p => `${p.full_name} (${p.role === 'dean' ? 'Dean' : 'Faculty'})`).join(', ')
    : 'All Faculty & Dean';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>{isMeeting ? "Meeting Details" : "Student Details"}</Text>
          
          <ScrollView 
            style={styles.scrollArea} 
            contentContainerStyle={styles.infoGrid}
            showsVerticalScrollIndicator={false}
          >
            {isMeeting ? (
              <>
                <DetailItem label="Host / Organizer" value={item.faculty_name} styles={styles}/>
                <DetailItem label="Status" value={<StatusBadge status={item.status}/>} styles={styles} />
                <DetailItem label="Meeting Type" value={item.service} styles={styles}/>
                <DetailItem label="Agenda / Discussion" value={item.condition || "No agenda specified"} styles={styles}/>
                <DetailItem label="Participants Invited" value={participantsStr} styles={styles}/>
              </>
            ) : (
              <>
                <DetailItem label="Name" value={item.student_name} styles={styles}/>
                <DetailItem label="Status" value={<StatusBadge status={item.status}/>} styles={styles} />
                <DetailItem label="Service" value={item.service} styles={styles}/>
                <DetailItem label="Appointment Notes" value={item.condition || "No notes specified"} styles={styles}/>
                <DetailItem label="Sex" value={item.student_sex} styles={styles}/>
                <DetailItem label="Course" value={`${item.student_course} ${item.student_year}-${item.student_section}`} styles={styles} />
                <DetailItem label="Email" value={item.student_email} styles={styles}/>
                <DetailItem label="Address" value={item.student_address} styles={styles}/>
                <DetailItem label="Phone" value={item.student_phone} styles={styles}/>
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {item.status?.toLowerCase() === 'pending' && !isPast ? (
              <View style={styles.actionRow}>
                <Pressable style={[styles.btn, styles.approve]} onPress={() => { onAction(item.id, 'Approved'); onClose(); }}>
                  <Text style={styles.btnText}>Approve</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.reject]} onPress={() => { onAction(item.id, 'Rejected'); onClose(); }}>
                  <Text style={styles.btnText}>Reject</Text>
                </Pressable>
              </View>
            ) : (
							<View style={{ padding: 10, alignItems: 'center' }}>
								<Text style={{ color: '#0F172A', fontWeight: 'bold' }}>
									{isPast ? "" : ""}
								</Text>
							</View>
						)}

						<Pressable style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const DetailItem = ({ label, value, styles }) => (
  <View style={styles.detailBox}>
    <Text style={styles.label}>{label}</Text>
    <View>{typeof value === 'string' ? <Text style={styles.value}>{value}</Text> : value}</View>
  </View>
);

const getStyles = (isMobile) => StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  modalCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: isMobile ? 26 :32, 
    width: '90%', 
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: '80%',
  },
  scrollArea: {
    marginVertical: 10,
  },
  title: { 
    ...Typography.header,
    fontSize: isMobile ? 20 : 24, 
    fontWeight: '900', 
    marginBottom: isMobile ? 20 : 24, 
    color: '#002366', 
    textAlign: 'center' 
  },
  infoGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: isMobile ? 5 : 10,
    justifyContent: 'space-between',
  },
  detailBox: {
    minWidth: 140,
    flex: 1,
    marginBottom: 16
  },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: isMobile ? 20 : 24,
    marginBottom: isMobile ? 20 : 24,
    width: '100%'
  },
  lastSection: {
    borderBottomWidth: 0,
    marginBottom: 0
  },
  label: { 
    ...Typography.title,
    fontSize: isMobile ? 10 : 12, 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    letterSpacing: 1.5, 
    color: '#002366',
    marginBottom: 4
  },
  value: { 
    ...Typography.body,
    fontSize: isMobile ? 12 : 14, 
    color: '#1E293B', 
    fontWeight: '500', 
    lineHeight: isMobile ? 14 : 22 
  },
  footer: { 
    marginTop: 10
  },
	actionRow: { 
		flexDirection: 'row',
		gap: 12, 
		marginBottom: 8, 
		zIndex: 10,
	},
	btn: { 
		flex: 1,
		paddingVertical: 16, 
		paddingHorizontal: 20,
		borderRadius: 12, 
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
    justifyContent: 'center',
	},
	approve: { 
    backgroundColor: '#10B981' 
  },
  reject: { 
    backgroundColor: '#ED5757' 
  },
  btnText: { 
    ...Typography.label, 
    lineHeight: 14, 
    color: '#FFF', 
    fontWeight: '700', 
    fontSize: isMobile ? 10 : 16, 
    textAlign: 'center',
  },
  closeBtn: { 
    paddingVertical: 14, 
    paddingHorizontal: 24, 
    alignItems: 'center',
    backgroundColor: '#002366',
    borderRadius: 12,
    marginTop: 8
  },
  closeText: { 
    ...Typography.label, 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: isMobile ? 12 : 16 
  }
});
