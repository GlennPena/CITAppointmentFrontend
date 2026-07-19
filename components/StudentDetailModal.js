/* 
  Responsible for displaying detailed student information inside a modal, including student profile 
  data, appointment details, and action buttons for approving or rejecting pending appointments. 
*/

import { View, Text, StyleSheet, Modal, Pressable, useWindowDimensions, ScrollView, Animated } from 'react-native';
import { useState, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import { Typography } from "../styles/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const AnimatedButton = ({ onPress, text, style, textStyle, baseColor, hoverColor }) => {
  const [hovered, setHovered] = useState(false);
  const colorAnim = useState(() => new Animated.Value(0))[0];
  const scale = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    Animated.timing(colorAnim, {
      toValue: hovered ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.spring(scale, {
      toValue: hovered ? 0.98 : 1,
      useNativeDriver: true,
    }).start();
  }, [hovered, colorAnim, scale]);

  const bgColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [baseColor, hoverColor]
  });

  return (
    <AnimatedPressable
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={[
        style,
        { backgroundColor: bgColor, transform: [{ scale }] }
      ]}
    >
      <Text style={textStyle}>{text}</Text>
    </AnimatedPressable>
  );
};

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
          <View style={styles.headerRow}>
            <Text style={styles.title}>{isMeeting ? "Meeting Details" : "Student Details"}</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed, hovered }) => [
                styles.closeIconBtn,
                pressed && { opacity: 0.7 },
                hovered && { opacity: 0.8 }
              ]}
              hitSlop={15}
            >
              <MaterialCommunityIcons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.infoGrid}
            showsVerticalScrollIndicator={false}
          >
            {isMeeting ? (
              <>
                <DetailItem label="Host / Organizer" value={item.faculty_name} styles={styles} />
                <DetailItem label="Status" value={<StatusBadge status={item.status} />} styles={styles} />
                <DetailItem label="Meeting Type" value={item.service} styles={styles} />
                <DetailItem label="Agenda / Discussion" value={item.condition || "No agenda specified"} styles={styles} />
                <DetailItem label="Participants Invited" value={participantsStr} styles={styles} />
              </>
            ) : (
              <>
                <DetailItem label="Name" value={item.student_name} styles={styles} />
                <DetailItem label="Status" value={<StatusBadge status={item.status} />} styles={styles} />
                <DetailItem label="Service" value={item.service} styles={styles} />
                <DetailItem label="Faculty" value={item.faculty_name || "N/A"} styles={styles} />
                <DetailItem label="Course" value={`${item.student_course} ${item.student_year}-${item.student_section}`} styles={styles} />
                <DetailItem label="Email" value={item.student_email} styles={styles} />
                <DetailItem label="Address" value={item.student_address} styles={styles} />
                <DetailItem label="Phone" value={item.student_phone} styles={styles} />
                <DetailItem label="Appointment Notes" value={item.condition || "No notes specified"} styles={styles} />
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {item.status?.toLowerCase() === 'pending' && !isPast ? (
              <View style={styles.actionRow}>
                <AnimatedButton
                  onPress={() => { onAction(item.id, 'Approved'); onClose(); }}
                  text="Approve"
                  baseColor="#10B981"
                  hoverColor="#059669"
                  style={styles.btn}
                  textStyle={styles.btnText}
                />
                <AnimatedButton
                  onPress={() => { onAction(item.id, 'Rejected'); onClose(); }}
                  text="Reject"
                  baseColor="#ED5757"
                  hoverColor="#DC2626"
                  style={styles.btn}
                  textStyle={styles.btnText}
                />
              </View>
            ) : (
              <View style={{ padding: 10, alignItems: 'center' }}>
                <Text style={{ color: '#0F172A', fontWeight: 'bold' }}>
                  {isPast ? "" : ""}
                </Text>
              </View>
            )}
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
    padding: isMobile ? 26 : 32,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: isMobile ? 20 : 24,
  },
  title: {
    ...Typography.header,
    fontSize: isMobile ? 20 : 24,
    fontWeight: '900',
    color: '#002366',
  },
  closeIconBtn: {
    padding: 4,
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
    fontSize: isMobile ? 10 : 16,
    textAlign: 'center',
  }
});
