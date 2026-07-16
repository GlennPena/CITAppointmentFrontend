/* 
  Modal for printable early dismissal slip
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


export default function DismissalSlipModal({ visible, onClose, data }) {
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
  const cleanBaseUrl = rawBaseUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");
  const verificationUrl = `${cleanBaseUrl}/verify-slip/${data.id}/`;

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
    console.log("DEBUG: Appointment Data Object:", data);
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

      let timeOutStr = "--:-- --";
      if (appointmentDateObj) {
        const timeOutDate = new Date(appointmentDateObj);
        timeOutDate.setHours(timeOutDate.getHours() + 1);

        timeOutStr = timeOutDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
      }

      if (Platform.OS === 'web') {
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a5",
        });

        const pageWidth = 148;
        const endX = 130;

        const leftPadding = 18;

        const primaryBlack = [0, 0, 0];
        const subLabelGray = [100, 116, 139];

        const logoWidth = 16;
        const logoHeight = 16;
        const gap = 4;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);

        const universityName = "University of the Assumption";
        const textWidth = doc.getTextWidth(universityName);
        const totalHeaderWidth = logoWidth + gap + textWidth;

        const startXHeader = (pageWidth - totalHeaderWidth) / 2;
        const headerY = 18;

        // RENDERING PART
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

        doc.setTextColor(...primaryBlack);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);

        const titleText = "EARLY DISMISSAL SLIP";
        const titleWidth = doc.getTextWidth(titleText);
        const centerX = pageWidth / 2;
        const titleY = 35;


        doc.text(titleText, centerX, titleY, { align: "center" });

        const lineStartX = centerX - (titleWidth / 2);
        const lineEndX = centerX + (titleWidth / 2);

        doc.line(lineStartX, titleY + 1, lineEndX, titleY + 1);

        let currentY = 55;
        const rowSpacing = 14;
        const textLinePadding = 1.5;

        const addPdfRow = (label, value) => {
          doc.setFontSize(12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...primaryBlack);

          const labelText = `${label}:`;
          const labelWidth = doc.getTextWidth(labelText);
          doc.text(labelText, leftPadding, currentY);


          doc.setFont("helvetica", "normal");
          const valueX = leftPadding + labelWidth + 2;
          doc.text(`${value}`, valueX, currentY);

          doc.line(valueX, currentY + textLinePadding, endX, currentY + textLinePadding);

          currentY += rowSpacing;
        };

        addPdfRow("Name of Student", `${data.first_name} ${data.last_name}`);
        addPdfRow("Year and Section", `${data.course} ${data.year || ''}-${data.section || ''}`);
        addPdfRow("Time-Out", timeOutStr);
        addPdfRow("Remarks", "");
        addPdfRow("Date", appointmentDate);

        currentY += 10;
        if (qrBase64) {
          doc.addImage(qrBase64, 'PNG', leftPadding, currentY, 25, 25);

          doc.setTextColor(...subLabelGray);
          doc.setFontSize(9);
          doc.text("Scan to verify", leftPadding + 12, currentY + 30, { align: "center" });
        }

        const sigXStart = 85;
        doc.setTextColor(...primaryBlack);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${data.faculty_name || ''}`, sigXStart + 22.5, currentY + 20, { align: "center" });

        doc.line(sigXStart, currentY + 22, endX, currentY + 22);

        doc.setTextColor(...subLabelGray);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Faculty Member", sigXStart + 22.5, currentY + 27, { align: "center" });

        doc.save(`UA_Slip_${data.last_name}.pdf`);

      } else {
        const html = `
          <html>
            <head>
              <style>
                body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #000; }
                .header { display: flex; align-items: center; margin-bottom: 30px; }
                .logo { width: 50px; height: 50px; margin-right: 15px; }
                .uni-name { font-weight: bold; font-size: 18px; margin: 0; }
                .location { color: #5b6675; font-size: 13px; margin: 0; }
                .title { text-align: center; font-weight: 900; font-size: 16px; text-decoration: underline; margin: 40px 0; }
                .row { display: flex; margin-bottom: 20px; align-items: flex-end; }
                .label { font-weight: bold; font-size: 14px; width: 140px; }
                .value { flex: 1; border-bottom: 1px solid #000; font-size: 14px; padding-bottom: 2px; }
                .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; }
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

              <div class="title">EARLY DISMISSAL SLIP</div>

              <div class="row"><div class="label">Name of Student:</div><div class="value">${data.first_name} ${data.last_name}</div></div>
              <div class="row"><div class="label">Year and Section:</div><div class="value">${data.course} ${data.year || ''}-${data.section || ''}</div></div>
              <div class="row"><div class="label">Time-Out:</div><div class="value">${currentTime}</div></div>
              <div class="row"><div class="label">Remarks:</div><div class="value"></div></div>
              <div class="row"><div class="label">Date:</div><div class="value">${currentDate}</div></div>

              <div class="footer">
                <div style="text-align: center;">
                  <img src="${qrBase64}" style="width: 80px; height: 80px;" />
                  <p style="font-size: 10px; color: #64748B;">Scan to verify</p>
                </div>
                <div class="signature-box">
                  <p style="font-weight: bold; margin: 0;">${data.faculty_name || 'Faculty Member'}</p>
                  <div class="sig-line"></div>
                  <p style="font-size: 12px; margin: 0;">Faculty Member</p>
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

          <View style={{ position: 'absolute', opacity: 0, left: -1000 }} pointerEvents="none">
            <QRCode
              value={verificationUrl}
              getRef={qrRef}
              size={200}
            />
          </View>

          <Text style={styles.modalTitle}>Slip Preview</Text>

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

              <Text style={styles.previewTitle}>EARLY DISMISSAL SLIP</Text>

              {/* INFO ROWS */}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name of Student:</Text>
                <Text style={styles.infoValueUnderlined}>{data.first_name} {data.last_name}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Year and Section:</Text>
                <Text style={styles.infoValueUnderlined}>{data.course} {data.year || ''}-{data.section || ''}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Time-Out:</Text>
                <Text style={styles.infoValueUnderlined}>
                  {data.date_time ? (() => {
                    const d = new Date(data.date_time);
                    d.setHours(d.getHours() + 1); // Add the 1 hour buffer
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  })() : '--:-- --'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Remarks:</Text>
                <Text style={styles.infoValueUnderlined}></Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValueUnderlined}>
                  {data.date_time ? new Date(data.date_time).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  }) : 'N/A'}
                </Text>
              </View>

              <View style={styles.previewFooter}>
                <View style={styles.qrSide}>
                  <QRCode value={verificationUrl} size={60} />
                  <Text style={styles.qrLabel}>Scan to verify</Text>
                </View>
                <View style={styles.signatureSide}>
                  <Text style={styles.facultyName}>{data.faculty_name || ''}</Text>
                  <View style={styles.signatureLine} />
                  <Text style={styles.facultyLabel}>Faculty Member</Text>
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
    maxWidth: 500,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: isMobile ? 10 : 20,
    maxHeight: '90%',
  },
  modalTitle: {
    ...Typography.header,
    fontSize: isMobile ? 20 : 22,
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
    padding: isMobile ? 20 : 40,
    paddingHorizontal: isMobile ? 30 : 60,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  previewLogo: {
    width: isMobile ? 40 : 50,
    height: isMobile ? 40 : 50,
    marginRight: 12,
    justifyContent: 'left'
  },
  headerTextContainer: {
    flexShrink: 1,
    justifyContent: 'center',
  },
  previewUniName: {
    ...Typography.title,
    fontSize: isMobile ? 12 : 16,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: isMobile ? 12 : 18,
  },
  previewLocation: {
    ...Typography.body,
    fontSize: isMobile ? 10 : 12,
    color: '#5b6675',
  },
  previewTitle: {
    ...Typography.title,
    fontSize: isMobile ? 12 : 14,
    fontWeight: '900',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 25,
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end'
  },
  infoLabel: {
    ...Typography.body,
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    marginRight: 5,
    lineHeight: 20,
  },
  infoValueUnderlined: {
    ...Typography.body,
    lineHeight: 18,
    letterSpacing: 1,
    flex: 1,
    fontSize: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    color: '#000',
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 30,
  },
  qrSide: {
    alignItems: 'center',
  },
  qrLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4
  },
  signatureSide: {
    alignItems: 'center',
    width: 140
  },
  facultyName: {
    ...Typography.title,
    fontSize: 12,
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
    fontSize: 10,
    color: '#000'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20
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
    fontSize: isMobile ? 12 : 'none',
    color: '#64748B',
    fontWeight: '700'
  },
  btnTextDownload: {
    fontSize: isMobile ? 12 : 'none',
    color: '#FFF',
    fontWeight: 'bold'
  },
});