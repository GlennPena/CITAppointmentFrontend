import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../utils/api';
import { Typography } from '../styles/theme';

const RATING_OPTIONS = [
  { value: 1, label: '1 = Very Dissatisfied (Poor)', shortLabel: 'Very Dissatisfied' },
  { value: 2, label: '2 = Dissatisfied (Below Average)', shortLabel: 'Dissatisfied' },
  { value: 3, label: '3 = Neutral', shortLabel: 'Neutral' },
  { value: 4, label: '4 = Satisfied (Good)', shortLabel: 'Satisfied' },
  { value: 5, label: '5 = Very Satisfied (Excellent)', shortLabel: 'Very Satisfied' },
];

export default function RatingModal({ visible, onClose, appointment, onSuccess }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = getStyles(isMobile);

  const [selectedRating, setSelectedRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (appointment) {
      setSelectedRating(appointment.rating || 5);
      setFeedback(appointment.rating_feedback || '');
      setErrorMsg('');
    }
  }, [appointment, visible]);

  if (!appointment) return null;

  const handleSubmit = async () => {
    if (!selectedRating) {
      setErrorMsg('Please select a rating option.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.post(`appointments/${appointment.id}/rate_consultation/`, {
        rating: selectedRating,
        rating_feedback: feedback.trim(),
      });
      if (onSuccess) onSuccess('Rating submitted successfully!');
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit rating. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOption = RATING_OPTIONS.find(opt => opt.value === selectedRating);

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="star-outline" size={28} color="#002366" />
            </View>

            <Text style={styles.title}>Rate Consultation</Text>
            <Text style={styles.subtitle}>
              How was your consultation experience with {appointment.faculty_name || 'the faculty'}?
            </Text>
          </View>

          {!!errorMsg && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Star Selection Row */}
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((starVal) => {
              const isFilled = starVal <= selectedRating;
              return (
                <Pressable
                  key={starVal}
                  onPress={() => setSelectedRating(starVal)}
                  style={styles.starButton}
                >
                  <MaterialCommunityIcons
                    name={isFilled ? 'star' : 'star-outline'}
                    size={36}
                    color={isFilled ? '#F59E0B' : '#CBD5E1'}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.selectedLabelText}>
            {selectedOption ? selectedOption.label : 'Select a rating'}
          </Text>

          {/* Feedback Input */}
          <Text style={styles.inputLabel}>Additional Feedback (Optional)</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Share details about your consultation experience..."
            placeholderTextColor="#94A3B8"
            multiline={true}
            numberOfLines={4}
            value={feedback}
            onChangeText={setFeedback}
          />

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <Pressable style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {appointment.rating ? 'Update Rating' : 'Submit Rating'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (isMobile) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: isMobile ? 12 : 24,
    },
    card: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      padding: isMobile ? 20 : 28,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 15,
      elevation: 10,
    },
    header: {
      alignItems: 'center',
      marginBottom: 20,
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#EFF6FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontFamily: Typography.title?.fontFamily || 'Inter_700Bold',
      fontSize: isMobile ? 18 : 22,
      fontWeight: '800',
      color: '#002366',
      textAlign: 'center',
    },
    subtitle: {
      fontFamily: Typography.body?.fontFamily || 'Roboto_400Regular',
      fontSize: 14,
      color: '#64748B',
      textAlign: 'center',
      marginTop: 4,
      paddingHorizontal: 10,
    },
    errorBox: {
      backgroundColor: '#FEF2F2',
      borderWidth: 1,
      borderColor: '#FCA5A5',
      padding: 10,
      borderRadius: 8,
      marginBottom: 14,
    },
    errorText: {
      color: '#EF4444',
      fontSize: 13,
      textAlign: 'center',
      fontWeight: '600',
    },
    starRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    starButton: {
      padding: 4,
    },
    selectedLabelText: {
      textAlign: 'center',
      fontFamily: Typography.label?.fontFamily || 'Inter_600SemiBold',
      fontSize: 14,
      fontWeight: '700',
      color: '#D97706',
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: '#334155',
      marginBottom: 6,
    },
    textArea: {
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E2E8F0',
      borderRadius: 12,
      padding: 12,
      fontSize: 14,
      color: '#0F172A',
      minHeight: 90,
      textAlignVertical: 'top',
      marginBottom: 24,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
    },
    cancelBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#CBD5E1',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
    },
    cancelBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#64748B',
    },
    submitBtn: {
      flex: 1.5,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: '#002366',
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
