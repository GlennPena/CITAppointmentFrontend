/* 
  Modal for printable Consultation Report
  Includes: Student Info, Appointment Notes, Consultation Report by Faculty
*/

import React, { useRef, useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Platform, Image, useWindowDimensions } from 'react-native';
import { jsPDF } from "jspdf";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';

import { Typography } from '../styles/theme';
import { Asset } from 'expo-asset';
import api from '../utils/api';


export default function ConsultationReportModal({ visible, onClose, data }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const styles = getStyles(isMobile);

  const qrRef = useRef();
  const [logoUri, setLogoUri] = useState(null);

  useEffect(() => {
    async function prepareAsset() {
      try {
        const asset = Asset.fromModule(require('../assets/ua-logo.png'));
        await asset.downloadAsync();
        setLogoUri(asset.localUri || asset.uri);
      } catch (e) {
        console.error("Logo loading error:", e);
      }
    }
    prepareAsset();
  }, []);

  if (!data) return null;

  const rawBaseUrl = api.defaults.baseURL || "";
  let cleanBaseUrl = rawBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  if (!cleanBaseUrl || cleanBaseUrl.includes('appointment.ua-cit.com')) {
    cleanBaseUrl = "https://citappointmentbackend.onrender.com";
  }
  const verificationUrl = `${cleanBaseUrl}/verify-slip/${data.id}/`;

  const appointmentNotes = data.condition || "No appointment notes provided.";
  const consultationNotes = data.consultation_notes || "No consultation notes recorded.";

  const RATING_LABELS = {
    1: '1 / 5 ★☆☆☆☆ — Very Dissatisfied (Poor)',
    2: '2 / 5 ★★☆☆☆ — Dissatisfied (Below Average)',
    3: '3 / 5 ★★★☆☆ — Neutral',
    4: '4 / 5 ★★★★☆ — Satisfied (Good)',
    5: '5 / 5 ★★★★★ — Very Satisfied (Excellent)',
  };

  const ratingDisplay = data.rating ? RATING_LABELS[data.rating] : null;

  const getQRCodeBase64 = () => {
    return new Promise((resolve) => {
      if (qrRef.current) {
        qrRef.current.toDataURL((base64Data) => {
          resolve(`data:image/png;base64,${base64Data}`);
        });
      } else {
        resolve(null);
      }
    });
  };
  
  const handleAction = async () => {
    try {
      const asset = Asset.fromModule(require('../assets/ua-logo.png'));
      await asset.downloadAsync();
      const logoUri = asset.localUri || asset.uri;

      const qrBase64 = await getQRCodeBase64();

      const appointmentDateObj = data.date_time ? new Date(data.date_time) : null;

      const appointmentDate = appointmentDateObj 
      ? appointmentDateObj.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric', 
          year: 'numeric' 
        })
      : "N/A";

      const appointmentTime = appointmentDateObj
      ? appointmentDateObj.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      : "N/A";

      if (Platform.OS === 'web') {
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
        });

        const pageWidth = 210;
        const endX = 190;
        const leftPadding = 20;

        const primaryBlack = [0, 0, 0];
        const subLabelGray = [100, 116, 139];
        const accentBlue = [0, 35, 102];

        const logoWidth = 16;
        const logoHeight = 16;
        const gap = 4;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        
        const universityName = "University of the Assumption";
        const textWidth = doc.getTextWidth(universityName);
        const totalHeaderWidth = logoWidth + gap + textWidth;
        
        const startXHeader = (pageWidth - totalHeaderWidth) / 2;
        const headerY = 20;

        // LOGO + HEADER
        if (logoUri) {
          try {
            doc.addImage(logoUri, 'PNG', startXHeader, headerY - 10, logoWidth, logoHeight);
          } catch (e) {
            console.error("jsPDF Logo Error:", e);
          }
        }

        doc.setTextColor(...primaryBlack);
        doc.text(universityName, startXHeader + logoWidth + gap, headerY - 2);

        doc.setTextColor(...subLabelGray);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("City of San Fernando, Pampanga", startXHeader + logoWidth + gap, headerY + 2);

        // TITLE
        doc.setTextColor(...accentBlue);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);

        const titleText = "CONSULTATION REPORT";
        const centerX = pageWidth / 2;
        const titleY = 38;

        doc.text(titleText, centerX, titleY, { align: "center" });
        const titleWidth = doc.getTextWidth(titleText);
        doc.line(centerX - (titleWidth / 2), titleY + 1.5, centerX + (titleWidth / 2), titleY + 1.5);

        // STUDENT INFORMATION SECTION
        let currentY = 52;
        const rowSpacing = 10;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...accentBlue);
        doc.text("STUDENT INFORMATION", leftPadding, currentY);
        currentY += 2;
        doc.setDrawColor(...accentBlue);
        doc.line(leftPadding, currentY, endX, currentY);
        currentY += rowSpacing;

        const addPdfRow = (label, value) => {
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...primaryBlack);
          
          const labelText = `${label}:`;
          const labelWidth = doc.getTextWidth(labelText);
          doc.text(labelText, leftPadding, currentY);

          doc.setFont("helvetica", "normal");
          const valueX = leftPadding + labelWidth + 3;
          doc.text(`${value}`, valueX, currentY);

          currentY += rowSpacing; 
        };

        addPdfRow("Name", `${data.first_name || data.student_name} ${data.last_name || ''}`);
        addPdfRow("Course & Section", `${data.course || data.student_course || ''} ${data.year || data.student_year || ''}-${data.section || data.student_section || ''}`);
        addPdfRow("Date of Consultation", appointmentDate);
        addPdfRow("Time", appointmentTime);
        addPdfRow("Service", data.service || "General Consultation");

        // APPOINTMENT NOTES SECTION
        currentY += 5;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...accentBlue);
        doc.text("APPOINTMENT NOTES", leftPadding, currentY);
        currentY += 2;
        doc.line(leftPadding, currentY, endX, currentY);
        currentY += rowSpacing;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...primaryBlack);
        const notesLines = doc.splitTextToSize(appointmentNotes, endX - leftPadding);
        doc.text(notesLines, leftPadding, currentY);
        currentY += (notesLines.length * 5) + 8;

        // CONSULTATION REPORT SECTION
        currentY += 5;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...accentBlue);
        doc.text("CONSULTATION REPORT", leftPadding, currentY);
        currentY += 2;
        doc.line(leftPadding, currentY, endX, currentY);
        currentY += rowSpacing;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...primaryBlack);
        const consultLines = doc.splitTextToSize(consultationNotes, endX - leftPadding);
        doc.text(consultLines, leftPadding, currentY);
        currentY += (consultLines.length * 5) + 8;

        // RATING & EVALUATION SECTION (If available)
        if (ratingDisplay) {
          currentY += 5;
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...accentBlue);
          doc.text("STUDENT RATING & EVALUATION", leftPadding, currentY);
          currentY += 2;
          doc.line(leftPadding, currentY, endX, currentY);
          currentY += rowSpacing;

          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...primaryBlack);
          doc.text(`Rating: ${ratingDisplay}`, leftPadding, currentY);
          currentY += 6;

          if (data.rating_feedback) {
            doc.setFont("helvetica", "normal");
            const feedbackText = `Feedback: ${data.rating_feedback}`;
            const feedbackLines = doc.splitTextToSize(feedbackText, endX - leftPadding);
            doc.text(feedbackLines, leftPadding, currentY);
            currentY += (feedbackLines.length * 5) + 5;
          } else {
            currentY += 5;
          }
        }

        currentY += 10;

        // QR + SIGNATURE FOOTER
        if (qrBase64) {
          doc.addImage(qrBase64, 'PNG', leftPadding, currentY, 25, 25);
          
          doc.setTextColor(...subLabelGray);
          doc.setFontSize(8);
          doc.text("Scan to verify", leftPadding + 12.5, currentY + 30, { align: "center" });
        }

        const sigXStart = 130;
        doc.setTextColor(...primaryBlack);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`${data.faculty_name || ''}`, sigXStart + 30, currentY + 20, { align: "center" });

        doc.line(sigXStart, currentY + 22, endX, currentY + 22);

        doc.setTextColor(...subLabelGray);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("Attending Faculty", sigXStart + 30, currentY + 27, { align: "center" });

        doc.save(`UA_ConsultationReport_${data.last_name || 'Report'}.pdf`);

      } else {
        // MOBILE: HTML-based PDF
        const html = `
          <html>
            <head>
              <style>
                body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #000; }
                .header { display: flex; align-items: center; margin-bottom: 20px; }
                .logo { width: 50px; height: 50px; margin-right: 15px; }
                .uni-name { font-weight: bold; font-size: 18px; margin: 0; }
                .location { color: #5b6675; font-size: 13px; margin: 0; }
                .title { text-align: center; font-weight: 900; font-size: 16px; color: #002366; text-decoration: underline; margin: 30px 0 20px; }
                .section-title { font-weight: bold; font-size: 13px; color: #002366; border-bottom: 2px solid #002366; padding-bottom: 4px; margin: 20px 0 12px; }
                .row { display: flex; margin-bottom: 10px; align-items: flex-end; }
                .label { font-weight: bold; font-size: 13px; width: 170px; }
                .value { flex: 1; font-size: 13px; padding-bottom: 2px; }
                .notes-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.6; margin-bottom: 10px; }
                .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
                .signature-box { text-align: center; width: 200px; }
                .sig-line { border-top: 1px solid #000; margin: 5px 0; }
              </style>
            </head>
            <body>
              <div class="header">
                <img src="${logoUri}" class="logo" />
                <div>
                  <p class="uni-name">University of the Assumption</p>
                  <p class="location">City of San Fernando, Pampanga</p>
                </div>
              </div>

              <div class="title">CONSULTATION REPORT</div>

              <div class="section-title">STUDENT INFORMATION</div>
              <div class="row"><div class="label">Name:</div><div class="value">${data.first_name || data.student_name} ${data.last_name || ''}</div></div>
              <div class="row"><div class="label">Course & Section:</div><div class="value">${data.course || data.student_course || ''} ${data.year || data.student_year || ''}-${data.section || data.student_section || ''}</div></div>
              <div class="row"><div class="label">Date of Consultation:</div><div class="value">${appointmentDate}</div></div>
              <div class="row"><div class="label">Time:</div><div class="value">${appointmentTime}</div></div>
              <div class="row"><div class="label">Service:</div><div class="value">${data.service || 'General Consultation'}</div></div>

              <div class="section-title">APPOINTMENT NOTES</div>
              <div class="notes-box">${appointmentNotes}</div>

              <div class="section-title">CONSULTATION REPORT</div>
              <div class="notes-box">${consultationNotes}</div>

              ${ratingDisplay ? `
                <div class="section-title">STUDENT RATING & EVALUATION</div>
                <div class="notes-box">
                  <strong>Rating:</strong> ${ratingDisplay}
                  ${data.rating_feedback ? `<br><strong>Feedback:</strong> ${data.rating_feedback}` : ''}
                </div>
              ` : ''}

              <div class="footer">
                <div style="text-align: center;">
                  <img src="${qrBase64}" style="width: 80px; height: 80px;" />
                  <p style="font-size: 10px; color: #64748B;">Scan to verify</p>
                </div>
                <div class="signature-box">
                  <p style="font-weight: bold; margin: 0;">${data.faculty_name || 'Faculty Member'}</p>
                  <div class="sig-line"></div>
                  <p style="font-size: 12px; margin: 0;">Attending Faculty</p>
                </div>
              </div>
            </body>
          </html>
        `;
        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error("PDF Generation Error:", error);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          
          {data?.id && (
            <View style={{ position: 'absolute', opacity: 0, left: -1000 }} pointerEvents="none">
              <QRCode
                key={data.id}
                value={verificationUrl}
                getRef={qrRef}
                size={200}
              />
            </View>
          )}

          <Text style={styles.modalTitle}>Consultation Report Preview</Text>
          
          <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.paper}>
              
              {/* HEADER */}
              <View style={styles.previewHeader}>
                {logoUri ? (
                  <Image 
                    source={{ uri: logoUri }} 
                    style={styles.previewLogo} 
                    resizeMode="contain" 
                  />
                ) : (
                  <View style={[styles.previewLogo, { backgroundColor: '#E2E8F0' }]} />
                )}
                
                <View style={styles.headerTextContainer}>
                  <Text style={styles.previewUniName}>University of the Assumption</Text>
                  <Text style={styles.previewLocation}>City of San Fernando, Pampanga</Text>
                </View>
              </View>

              <Text style={styles.previewTitle}>CONSULTATION REPORT</Text>
              
              {/* STUDENT INFORMATION */}
              <Text style={styles.sectionHeading}>STUDENT INFORMATION</Text>
              <View style={styles.sectionDivider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{data.first_name || data.student_name} {data.last_name || ''}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Course & Section:</Text>
                <Text style={styles.infoValue}>{data.course || data.student_course || ''} {data.year || data.student_year || ''}-{data.section || data.student_section || ''}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValue}>
                  {data.date_time ? new Date(data.date_time).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }) : 'N/A'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Time:</Text>
                <Text style={styles.infoValue}>
                  {data.date_time ? new Date(data.date_time).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }) : 'N/A'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Service:</Text>
                <Text style={styles.infoValue}>{data.service || 'General Consultation'}</Text>
              </View>

              {/* APPOINTMENT NOTES */}
              <Text style={[styles.sectionHeading, { marginTop: 16 }]}>APPOINTMENT NOTES</Text>
              <View style={styles.sectionDivider} />
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{appointmentNotes}</Text>
              </View>

              {/* CONSULTATION REPORT */}
              <Text style={[styles.sectionHeading, { marginTop: 16 }]}>CONSULTATION REPORT</Text>
              <View style={styles.sectionDivider} />
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{consultationNotes}</Text>
              </View>

              {/* RATING & EVALUATION (Preview) */}
              {ratingDisplay && (
                <>
                  <Text style={[styles.sectionHeading, { marginTop: 16 }]}>STUDENT RATING & EVALUATION</Text>
                  <View style={styles.sectionDivider} />
                  <View style={styles.notesBox}>
                    <Text style={[styles.notesText, { fontWeight: '700', color: '#D97706' }]}>{ratingDisplay}</Text>
                    {data.rating_feedback ? (
                      <Text style={[styles.notesText, { marginTop: 4 }]}>Feedback: {data.rating_feedback}</Text>
                    ) : null}
                  </View>
                </>
              )}

              {/* FOOTER: QR + SIGNATURE */}
              <View style={styles.previewFooter}>
                 <View style={styles.qrSide}>
                    <QRCode value={verificationUrl} size={60} />
                    <Text style={styles.qrLabel}>Scan to verify</Text>
                 </View>
                 <View style={styles.signatureSide}>
                    <Text style={styles.facultyName}>{data.faculty_name || ''}</Text>
                    <View style={styles.signatureLine} />
                    <Text style={styles.facultyLabel}>Attending Faculty</Text>
                 </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonRow}>
            <Pressable style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnTextCancel}>Close</Text>
            </Pressable>
            <Pressable style={styles.btnDownload} onPress={handleAction}>
              <Text style={styles.btnTextDownload}>
                {Platform.OS === 'web' ? 'Download PDF' : 'Share PDF'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (isMobile) => StyleSheet.create({
  overlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.7)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  modalCard: { 
    width: '100%', 
    maxWidth: 550, 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: isMobile ? 10 : 20, 
    maxHeight: '90%',
  },
  modalTitle: { 
    ...Typography.header, 
    fontSize: isMobile ? 18 : 20, 
    color: '#002366', 
    marginBottom: isMobile ? 10 : 15, 
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  previewScroll: { 
    backgroundColor: '#F1F5F9', 
    borderRadius: 12, 
    padding: 10 
  },
  paper: { 
    backgroundColor: '#FFF', 
    padding: isMobile ? 20 : 30, 
    paddingHorizontal: isMobile ? 24 : 40,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
  },
  previewLogo: {
    width: isMobile ? 36 : 45,
    height: isMobile ? 36 : 45,
    marginRight: 10,
  },
  headerTextContainer: {
    flexShrink: 1, 
    justifyContent: 'center',
  },
  previewUniName: {
    ...Typography.title,
    fontSize: isMobile ? 12 : 15,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: isMobile ? 14 : 18,
  },
  previewLocation: {
    ...Typography.body,
    fontSize: isMobile ? 10 : 11,
    color: '#5b6675',
  },
  previewTitle: {
    ...Typography.title,
    fontSize: isMobile ? 13 : 15,
    fontWeight: '900',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 20,
    color: '#002366',
  },
  sectionHeading: {
    ...Typography.label,
    fontSize: isMobile ? 10 : 11,
    fontWeight: '800',
    color: '#002366',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: '#002366',
    marginBottom: 10,
  },
  infoRow: { 
    flexDirection: 'row', 
    marginBottom: 8,
    alignItems: 'center'
  },
  infoLabel: { 
    ...Typography.body,
    fontSize: isMobile ? 10 : 11, 
    fontWeight: '700', 
    color: '#000000',
    marginRight: 5,
    width: isMobile ? 110 : 140,
  },
  infoValue: { 
    ...Typography.body,
    flex: 1, 
    fontSize: isMobile ? 10 : 11, 
    color: '#000',
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
    ...Typography.body,
    fontSize: isMobile ? 10 : 11,
    color: '#334155',
    lineHeight: 18,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 24,
  },
  qrSide: {
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 4
  },
  signatureSide: {
    alignItems: 'center',
    width: 140
  },
  facultyName: {
    ...Typography.title,
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#000',
    marginVertical: 4
  },
  facultyLabel: {
    fontSize: 9,
    color: '#000'
  },
  buttonRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 16 
  },
  btnCancel: { 
    ...Typography.label,
    flex: 1, 
    padding: isMobile ? 12 : 14, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    alignItems: 'center' 
  },
  btnDownload: { 
    ...Typography.label,
    flex: 2, 
    padding: isMobile ? 12 : 14, 
    borderRadius: 12, 
    backgroundColor: '#002366', 
    alignItems: 'center' 
  },
  btnTextCancel: { 
    fontSize: isMobile ? 12 : 14,
    color: '#64748B', 
    fontWeight: '700' 
  },
  btnTextDownload: { 
    fontSize: isMobile ? 12 : 14,
    color: '#FFF', 
    fontWeight: 'bold' 
  },
});
