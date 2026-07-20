import React, { useRef, useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Platform, Image, useWindowDimensions } from 'react-native';
import { jsPDF } from "jspdf";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';

import { Typography } from '../styles/theme';
import { Asset } from 'expo-asset';
import api from '../utils/api';

export default function MeetingReportModal({ visible, onClose, data }) {
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

  if (!data || data.status !== "Completed") return null;

  const rawBaseUrl = api.defaults.baseURL || "";
  let cleanBaseUrl = rawBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  if (!cleanBaseUrl || cleanBaseUrl.includes('appointment.ua-cit.com')) {
    cleanBaseUrl = "https://citappointmentbackend.onrender.com";
  }
  const verificationUrl = `${cleanBaseUrl}/verify-meeting-report/${data.id}/`;

  const agendaText = data.condition || "No agenda details provided.";
  const participantsList = data.participants_attendance || [];

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

  const handleDownload = async () => {
    try {
      const qrBase64 = await getQRCodeBase64();
      const meetingDateObj = data.date_time ? new Date(data.date_time) : null;

      const meetingDate = meetingDateObj
        ? meetingDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : "N/A";

      const meetingTime = meetingDateObj
        ? meetingDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "N/A";

      if (Platform.OS === 'web') {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pageWidth = 210;
        const endX = 190;
        const leftPadding = 20;

        const primaryBlack = [0, 0, 0];
        const subLabelGray = [100, 116, 139];
        const accentBlue = [0, 35, 102];

        // LOGO + HEADER
        if (logoUri) {
          try {
            doc.addImage(logoUri, 'PNG', 20, 10, 16, 16);
          } catch (e) {
            console.error("jsPDF logo insertion error:", e);
          }
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(...primaryBlack);
        doc.text("University of the Assumption", 40, 18);
        doc.setTextColor(...subLabelGray);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("City of San Fernando, Pampanga", 40, 23);

        // TITLE
        doc.setTextColor(...accentBlue);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("FACULTY MEETING REPORT", pageWidth / 2, 38, { align: "center" });
        doc.line(pageWidth / 2 - 35, 40, pageWidth / 2 + 35, 40);

        // MEETING INFORMATION SECTION
        let currentY = 50;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("MEETING GENERAL INFORMATION", leftPadding, currentY);
        doc.line(leftPadding, currentY + 2, endX, currentY + 2);
        currentY += 10;

        const addRow = (label, val) => {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...primaryBlack);
          doc.text(`${label}:`, leftPadding, currentY);
          doc.setFont("helvetica", "normal");
          doc.text(`${val}`, leftPadding + 40, currentY);
          currentY += 8;
        };

        addRow("Meeting Title", data.service);
        addRow("Organizer/Host", data.faculty_name);
        addRow("Date Scheduled", meetingDate);
        addRow("Time Scheduled", meetingTime);

        // AGENDA
        currentY += 4;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...accentBlue);
        doc.text("MEETING AGENDA / NOTES", leftPadding, currentY);
        doc.line(leftPadding, currentY + 2, endX, currentY + 2);
        currentY += 8;

        doc.setFont("helvetica", "normal");
        doc.setTextColor(...primaryBlack);
        doc.setFontSize(10);
        const splitAgenda = doc.splitTextToSize(agendaText, endX - leftPadding);
        doc.text(splitAgenda, leftPadding, currentY);
        currentY += (splitAgenda.length * 5) + 8;

        // PARTICIPANTS ATTENDANCE TABLE
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...accentBlue);
        doc.text("PARTICIPANTS ATTENDANCE RECORD", leftPadding, currentY);
        doc.line(leftPadding, currentY + 2, endX, currentY + 2);
        currentY += 8;

        // Table Header
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...primaryBlack);
        doc.text("Participant Name", leftPadding, currentY);
        doc.text("Department Role", leftPadding + 70, currentY);
        doc.text("Attendance Status", leftPadding + 130, currentY);
        doc.line(leftPadding, currentY + 2, endX, currentY + 2);
        currentY += 8;

        // Table Rows
        doc.setFont("helvetica", "normal");
        participantsList.forEach((p) => {
          doc.text(p.full_name, leftPadding, currentY);
          doc.text(p.role === 'dean' ? 'Dean' : 'Faculty', leftPadding + 70, currentY);

          doc.setFont("helvetica", "bold");
          if (p.attended) {
            doc.setTextColor(16, 185, 129); // Green
            doc.text("Attended", leftPadding + 130, currentY);
          } else {
            doc.setTextColor(239, 68, 68); // Red
            doc.text("Absent", leftPadding + 130, currentY);
          }
          doc.setTextColor(...primaryBlack);
          doc.setFont("helvetica", "normal");
          currentY += 7;
        });

        // QR / Footer
        currentY += 10;
        if (qrBase64) {
          doc.addImage(qrBase64, 'PNG', leftPadding, currentY, 20, 20);
          doc.setFontSize(7);
          doc.setTextColor(...subLabelGray);
          doc.text("Scan to verify", leftPadding + 10, currentY + 24, { align: "center" });
        }

        // Host Signature
        const sigX = 130;
        doc.setTextColor(...primaryBlack);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(data.faculty_name || "", sigX + 25, currentY + 12, { align: "center" });
        doc.line(sigX, currentY + 14, endX, currentY + 14);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...subLabelGray);
        doc.text("Organizer / Attending Host", sigX + 25, currentY + 18, { align: "center" });

        doc.save(`UA_MeetingReport_${data.id}.pdf`);
      } else {
        // MOBILE PDF
        const participantRows = participantsList.map(p => `
          <tr>
            <td>${p.full_name}</td>
            <td style="text-transform: capitalize;">${p.role}</td>
            <td style="font-weight: bold; color: ${p.attended ? '#10B981' : '#EF4444'};">
              ${p.attended ? 'Attended' : 'Absent'}
            </td>
          </tr>
        `).join('');

        const html = `
          <html>
            <head>
              <style>
                body { font-family: 'Helvetica', sans-serif; padding: 30px; color: #000; }
                .header { display: flex; align-items: center; margin-bottom: 20px; }
                .logo { width: 50px; height: 50px; margin-right: 15px; }
                .uni-name { font-weight: bold; font-size: 18px; margin: 0; }
                .location { color: #5b6675; font-size: 13px; margin: 0; }
                .title { text-align: center; font-weight: 900; font-size: 16px; color: #002366; text-decoration: underline; margin: 25px 0 15px; }
                .section-title { font-weight: bold; font-size: 13px; color: #002366; border-bottom: 2px solid #002366; padding-bottom: 4px; margin: 20px 0 12px; }
                .info-row { display: flex; margin-bottom: 8px; }
                .label { font-weight: bold; font-size: 13px; width: 140px; }
                .value { flex: 1; font-size: 13px; }
                .notes-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; font-size: 13px; line-height: 1.6; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border-bottom: 1px solid #E2E8F0; padding: 8px; text-align: left; font-size: 12px; }
                th { background-color: #F8FAFC; color: #002366; }
                .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 30px; }
                .signature-box { text-align: center; width: 180px; }
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

              <div class="title">FACULTY MEETING REPORT</div>

              <div class="section-title">MEETING GENERAL INFORMATION</div>
              <div class="info-row"><div class="label">Meeting Title:</div><div class="value">${data.service}</div></div>
              <div class="info-row"><div class="label">Organizer/Host:</div><div class="value">${data.faculty_name}</div></div>
              <div class="info-row"><div class="label">Date Scheduled:</div><div class="value">${meetingDate}</div></div>
              <div class="info-row"><div class="label">Time Scheduled:</div><div class="value">${meetingTime}</div></div>

              <div class="section-title">MEETING AGENDA / NOTES</div>
              <div class="notes-box">${agendaText}</div>

              <div class="section-title">PARTICIPANTS ATTENDANCE RECORD</div>
              <table>
                <thead>
                  <tr>
                    <th>Participant Name</th>
                    <th>Department Role</th>
                    <th>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${participantRows || '<tr><td colspan="3" style="text-align: center;">No participants associated.</td></tr>'}
                </tbody>
              </table>

              <div class="footer">
                <div style="text-align: center;">
                  <img src="${qrBase64}" style="width: 70px; height: 70px;" />
                  <p style="font-size: 9px; color: #64748B; margin: 2px 0 0;">Scan to verify</p>
                </div>
                <div class="signature-box">
                  <p style="font-weight: bold; margin: 0;">${data.faculty_name || ''}</p>
                  <div class="sig-line"></div>
                  <p style="font-size: 11px; margin: 0;">Organizer / Attending Host</p>
                </div>
              </div>
            </body>
          </html>
        `;

        const { uri } = await Print.printToFileAsync({ html });
        await Sharing.shareAsync(uri);
      }
    } catch (e) {
      console.error("PDF Export error:", e);
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

          <Text style={styles.modalTitle}>Meeting Report Preview</Text>

          <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.paper}>
              {/* HEADER */}
              <View style={styles.previewHeader}>
                {logoUri && (
                  <Image source={{ uri: logoUri }} style={styles.previewLogo} resizeMode="contain" />
                )}
                <View style={styles.headerTextContainer}>
                  <Text style={styles.previewUniName}>University of the Assumption</Text>
                  <Text style={styles.previewLocation}>City of San Fernando, Pampanga</Text>
                </View>
              </View>

              <Text style={styles.previewTitle}>FACULTY MEETING REPORT</Text>

              {/* MEETING GENERAL INFO */}
              <Text style={styles.sectionHeading}>MEETING GENERAL INFORMATION</Text>
              <View style={styles.sectionDivider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Meeting Title:</Text>
                <Text style={styles.infoValue}>{data.service}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Host/Organizer:</Text>
                <Text style={styles.infoValue}>{data.faculty_name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date & Time:</Text>
                <Text style={styles.infoValue}>
                  {data.date_time ? new Date(data.date_time).toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric'
                  }) : 'N/A'} at {data.date_time ? new Date(data.date_time).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit'
                  }) : 'N/A'}
                </Text>
              </View>

              {/* AGENDA */}
              <Text style={[styles.sectionHeading, { marginTop: 16 }]}>MEETING AGENDA / NOTES</Text>
              <View style={styles.sectionDivider} />
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{agendaText}</Text>
              </View>

              {/* ATTENDANCE TABLE */}
              <Text style={[styles.sectionHeading, { marginTop: 16 }]}>PARTICIPANTS ATTENDANCE RECORD</Text>
              <View style={styles.sectionDivider} />

              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Participant Name</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Role</Text>
                  <Text style={[styles.tableHeaderCell, { flex: 1.5, textAlign: 'right' }]}>Status</Text>
                </View>
                {participantsList.length === 0 ? (
                  <Text style={styles.emptyTableText}>No participants recorded.</Text>
                ) : (
                  participantsList.map((p, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2, fontWeight: '700' }]}>{p.full_name}</Text>
                      <Text style={[styles.tableCell, { flex: 1, textTransform: 'capitalize' }]}>{p.role}</Text>
                      <Text style={[
                        styles.tableCell,
                        { flex: 1.5, textAlign: 'right', fontWeight: 'bold' },
                        p.attended ? { color: '#10B981' } : { color: '#EF4444' }
                      ]}>
                        {p.attended ? 'Attended' : 'Absent'}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              {/* FOOTER */}
              <View style={styles.previewFooter}>
                <View style={styles.qrSide}>
                  <QRCode value={verificationUrl} size={50} />
                  <Text style={styles.qrLabel}>Scan to verify</Text>
                </View>
                <View style={styles.signatureSide}>
                  <Text style={styles.facultyName}>{data.faculty_name || ''}</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.facultyLabel}>Organizer / Attending Host</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonRow}>
            <Pressable style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnTextCancel}>Close</Text>
            </Pressable>
            <Pressable style={styles.btnDownload} onPress={handleDownload}>
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
    padding: isMobile ? 10 : 20
  },
  modalCard: {
    width: '90%',
    maxWidth: 550,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: isMobile ? 16 : 24,
    maxHeight: '90%',
  },
  modalTitle: {
    ...Typography.header,
    fontSize: isMobile ? 18 : 20,
    color: '#002366',
    marginBottom: isMobile ? 10 : 15,
    textAlign: 'center',
  },
  previewScroll: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 10
  },
  paper: {
    backgroundColor: '#FFF',
    padding: isMobile ? 16 : 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  previewLogo: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  headerTextContainer: {
    flexShrink: 1,
  },
  previewUniName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#000000',
  },
  previewLocation: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 10,
    color: '#64748B',
  },
  previewTitle: {
    fontFamily: 'Inter_900Black',
    fontSize: 14,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginVertical: 14,
    color: '#002366',
  },
  sectionHeading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#002366',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sectionDivider: {
    height: 1.5,
    backgroundColor: '#002366',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  infoLabel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#000',
    width: 100,
  },
  infoValue: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 11,
    color: '#334155',
    flex: 1,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  notesText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
  },
  table: {
    width: '100%',
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#002366',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 5,
  },
  tableCell: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 11,
    color: '#334155',
  },
  emptyTableText: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 10,
  },
  previewFooter: {
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between',
    alignItems: isMobile ? 'center' : 'flex-end',
    marginTop: 20,
    gap: isMobile ? 24 : 0,
  },
  qrSide: {
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
  signatureSide: {
    alignItems: 'center',
    width: 130,
  },
  facultyName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#000',
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#000',
    marginVertical: 4,
  },
  facultyLabel: {
    fontSize: 8,
    color: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  btnCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  btnDownload: {
    flex: 2,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#002366',
    alignItems: 'center',
  },
  btnTextCancel: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#64748B',
  },
  btnTextDownload: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#FFF',
  },
});
