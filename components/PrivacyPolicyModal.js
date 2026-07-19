/*
  Reusable modal that displays the full Data Privacy Policy for the
  CIT Appointment System. Can be triggered from RegistrationScreen
  or any other screen that needs to link to the policy.
*/

import { Modal, View, Text, ScrollView, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { X } from "lucide-react-native";
import { Typography } from "../styles/theme";

export default function PrivacyPolicyModal({ visible, onClose }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const styles = getStyles(isMobile);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>Data Privacy Policy</Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <X size={22} color="#334155" />
            </Pressable>
          </View>

          {/* BODY */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.updated}>Last updated: July 2026</Text>

            <Text style={styles.sectionHeading}>1. Introduction</Text>
            <Text style={styles.paragraph}>
              The CIT Appointment System is operated by the College of
              Information Technology to manage student, faculty, and employee academic appointments. This policy
              explains what personal and academic information we collect when you
              register for an account, why we collect it, and how it is used, stored, and
              protected, in accordance with the Data Privacy Act of 2012 (Republic Act No.
              10173) and its Implementing Rules and Regulations.
            </Text>

            <Text style={styles.sectionHeading}>2. Information We Collect</Text>
            <Text style={styles.paragraph}>
              When you create an account, we collect personal information such as your name,
              date of birth, sex, contact number, email address, and home address. If you are
              registering as a student, we also collect your course, year level, and section.
              Once you begin using the CIT Appointment System to book appointments, we may additionally collect
              academic information you choose to share with faculty and staff, such as
              meeting topics, notes, and appointment history.
            </Text>

            <Text style={styles.sectionHeading}>3. Purpose of Collection</Text>
            <Text style={styles.paragraph}>
              Your information is collected and processed solely to: verify your identity as a
              member of the university; allow you to schedule, reschedule, or cancel academic
              appointments; and allow faculty and staff to prepare for and record meetings
              for continuity of academic progress within the college.
            </Text>

            <Text style={styles.sectionHeading}>4. Legal Basis for Processing</Text>
            <Text style={styles.paragraph}>
              We process your personal information based on your consent, given when you check
              the consent box during registration, and where necessary, to comply with academic
              and administrative obligations of the university under applicable law. Academic
              information may be treated as sensitive personal information under RA 10173 and is
              processed only with your explicit consent.
            </Text>

            <Text style={styles.sectionHeading}>5. Data Sharing</Text>
            <Text style={styles.paragraph}>
              Your information is accessible only to authorized faculty, staff, and system
              administrators who need it to perform their duties. We do not sell your personal
              information. Information may be shared with university offices or external
              authorities only where required by law, or in case of an emergency where
              disclosure is necessary to protect your life or well-being.
            </Text>

            <Text style={styles.sectionHeading}>6. Data Retention</Text>
            <Text style={styles.paragraph}>
              We retain your account and appointment records for as long as you remain a member of
              the university, and for a reasonable period afterward as required for
              recordkeeping, legal, or administrative continuity purposes. You may request deletion of
              your account subject to any retention obligations the college is required to
              observe.
            </Text>

            <Text style={styles.sectionHeading}>7. Your Rights</Text>
            <Text style={styles.paragraph}>
              Under the Data Privacy Act, you have the right to be informed, to access your
              data, to object to processing, to request correction or erasure, to data
              portability, and to file a complaint with the National Privacy Commission.
            </Text>

            <Text style={styles.sectionHeading}>8. Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions or concerns regarding this Privacy Notice or the
              handling of your personal information, please contact the College of
              Information Technology or the appropriate university office for assistance.
            </Text>
          </ScrollView>



        </View>
      </View>
    </Modal>
  );
}

const getStyles = (isMobile) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: isMobile ? 16 : 24,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: isMobile ? '100%' : 560,
    maxHeight: '85%',
    paddingTop: 24,
    paddingHorizontal: isMobile ? 20 : 32,
    paddingRight: 0,
    paddingBottom: isMobile ? 20 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    ...Typography.header,
    fontSize: isMobile ? 18 : 22,
    fontWeight: '700',
    color: '#002366',
  },
  closeButton: {
    padding: 4,
    paddingRight: isMobile ? 20 : 32,
  },
  body: {
    maxHeight: 420,
  },
  bodyContent: {
    paddingBottom: 12,
  },
  updated: {
    ...Typography.caption,
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
  },
  sectionHeading: {
    ...Typography.title,
    fontSize: isMobile ? 14 : 16,
    fontWeight: '600',
    color: '#002366',
    marginTop: 16,
    marginBottom: 6,
  },
  paragraph: {
    ...Typography.body,
    fontSize: isMobile ? 13 : 14,
    lineHeight: isMobile ? 19 : 21,
    color: '#334155',
    textAlign: 'justify',
    paddingRight: isMobile ? 20 : 24,
  },
  disclaimer: {
    ...Typography.caption,
    fontSize: 11,
    lineHeight: 16,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginTop: 24,
  },
  closeFooterButton: {
    backgroundColor: '#002366',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  closeFooterButtonText: {
    ...Typography.label,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: isMobile ? 14 : 15,
  },
});