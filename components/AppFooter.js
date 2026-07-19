import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions, Pressable, Linking, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Typography } from '../styles/theme';

export default function AppFooter({ userRole = 'student', navigation, onScrollToDashboard, onScrollToUpcoming, onScrollToHistory, onOpenPrivacyPolicy }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const openLink = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const HoverLink = ({ text, onPress, iconName }) => {
    const [hovered, setHovered] = useState(false);
    const scale = useState(() => new Animated.Value(1))[0];
    const opacity = useState(() => new Animated.Value(1))[0];

    useEffect(() => {
      Animated.spring(scale, {
        toValue: hovered && onPress ? 1.05 : 1,
        useNativeDriver: true,
      }).start();
      Animated.timing(opacity, {
        toValue: hovered && onPress ? 0.8 : 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }, [hovered, scale, opacity, onPress]);

    return (
      <Pressable
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPress={onPress}
        style={{ marginBottom: 14, minHeight: 18 }}
      >
        <Animated.View style={{ flexDirection: 'row', alignItems: 'center', transform: [{ scale }], opacity, gap: 10 }}>
          {iconName && <MaterialCommunityIcons name={iconName} size={iconName === 'code-tags' ? 16 : 18} color="#ffffffff" />}
          <Text style={styles.linkTextInteractive}>{text}</Text>
        </Animated.View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.mainSection, isMobile && styles.mainSectionMobile]}>

        {/* Brand & Description */}
        <View style={[styles.columnLogo, styles.brandColumn, isMobile && { width: '100%', flex: 0.6, alignItems: 'center', maxWidth: '100%' }]}>
          <View style={styles.logoRow}>
            <Image source={require('../assets/ua-logo.png')} style={styles.logo} resizeMode="contain" />
            <Image source={require('../assets/cit-logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.brandTitle}>CIT Appointment</Text>
          {isMobile && <View style={[styles.divider, { marginTop: 20, marginBottom: 0 }]} />}
        </View>

        {/* Contacts */}
        <View style={[styles.column, isMobile && { width: '100%', alignItems: 'center', maxWidth: '100%', marginTop: 50 }]}>
          <Text style={styles.columnTitle}>Contacts</Text>
          <HoverLink
            text="City of San Fernando, Pampanga, Philippines"
            onPress={() => openLink('https://www.google.com/maps/place/University+of+the+Assumption/@15.0364658,120.6957,17z/data=!4m6!3m5!1s0x3396f76e2c07061b:0xcdd6330abec18cf9!8m2!3d15.0365123!4d120.6978749!16s%2Fg%2F11rr_h3mt?entry=ttu&g_ep=EgoyMDI2MDcxNS4wIKXMDSoASAFQAw%3D%3D')}
            iconName="map-marker-outline"
          />
          <HoverLink text="web.ua.edu.ph" onPress={() => openLink('https://web.ua.edu.ph/')} iconName="web" />
          <HoverLink text="ua-cit.com" onPress={() => openLink('https://ua-cit.com/')} iconName="web" />
          <HoverLink text="University of the Assumption" onPress={() => openLink('https://www.facebook.com/universityoftheassumption')} iconName="facebook" />
        </View>

        {/* Navigations */}
        <View style={[styles.columnNavigation, isMobile && { width: '100%', alignItems: 'center', flex: 1, maxWidth: '100%' }]}>
          <Text style={styles.columnTitle}>Navigations</Text>
          {userRole === 'faculty' ? (
            <>
              <HoverLink text="Dashboard" onPress={() => navigation?.navigate('Dashboard')} />
              <HoverLink text="Schedules" onPress={() => navigation?.navigate('Schedule')} />
              <HoverLink text="Students" onPress={() => navigation?.navigate('Students')} />
              <HoverLink text="Meetings" onPress={() => navigation?.navigate('Meetings')} />
            </>
          ) : (
            <>
              <HoverLink text="Dashboard" onPress={onScrollToDashboard} />
              <HoverLink text="Upcoming Appointments" onPress={onScrollToUpcoming} />
              <HoverLink text="Appointment History" onPress={onScrollToHistory} />
              <HoverLink text="Privacy Policy" onPress={onOpenPrivacyPolicy} />
            </>
          )}
        </View>

        {/* Developers */}
        <View style={[styles.column, isMobile && { width: '100%', alignItems: 'center', maxWidth: '100%' }]}>
          <Text style={styles.columnTitle}>Design & Developed by:</Text>
          <View style={styles.devList}>
            <Text style={{ fontFamily: Typography.body?.fontFamily, fontWeight: '800', color: '#ffffffff', fontSize: 14 }}>
              BITWISE
            </Text>
          </View>
          <HoverLink text="GULLES, R." onPress={() => openLink('https://www.facebook.com/ronian.gulles.662712/')} iconName="code-tags" />
          <HoverLink text="LUGTU, C." onPress={() => openLink('https://www.facebook.com/charoletteee')} iconName="code-tags" />
          <HoverLink text="PEÑA, G." onPress={() => openLink('https://www.facebook.com/ncknprslgnn')} iconName="code-tags" />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomSection}>
        <Text style={styles.copyrightText}>
          © 2026 University of the Assumption. All rights reserved.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#011B51',
    marginTop: 60,
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  mainSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 30,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  mainSectionMobile: {
    flexDirection: 'column',
    gap: 32,
  },
  column: {
    flex: 1,
    maxWidth: 320,
  },
  columnLogo: {
    flex: 0.5,
    maxWidth: 320,
  },
  columnNavigation: {
    flex: 0.6,
    maxWidth: 320,
  },
  brandColumn: {
    flex: 1.5,
    minWidth: 100,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  logo: {
    width: 65,
    height: 65,
  },
  brandTitle: {
    fontFamily: 'ProstoOne_400Regular',
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontFamily: Typography.body?.fontFamily,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 22,
    paddingRight: 20,
  },
  columnTitle: {
    fontFamily: Typography.title?.fontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    minHeight: 18,
  },
  linkText: {
    fontFamily: Typography.body?.fontFamily,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    flex: 1,
  },
  linkTextInteractive: {
    fontFamily: Typography.body?.fontFamily,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    minHeight: 18,
  },
  devList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    minHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 40,
    marginBottom: 24,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  bottomSection: {
    alignItems: 'center',
  },
  copyrightText: {
    fontFamily: Typography.label?.fontFamily,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
});
