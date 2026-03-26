import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { colors, radius, shadows } from '../theme';
import { useState } from 'react';

import { openImagePicker } from '../services/expo/imagePicker';
import { sendLocalNotification } from '../services/expo/notifications';
import { useAuth } from '../provider/AuthProvider';
import { useProfile } from '../api/profile';
import { DEFAULT_PROFILE_PHOTO } from '../constants/constants';

const ASSETS = {
  profilePic: 'https://www.figma.com/api/mcp/asset/c0ea0520-82ae-49f1-b629-baa5bff5e830',
  settingsIcon: 'https://www.figma.com/api/mcp/asset/61719cfc-29ee-4e38-a422-1c5d6a967389',
  heroDecor: 'https://www.figma.com/api/mcp/asset/86a90b07-d531-4d4d-b315-cc9d2f0bd311',
  uploadIcon: 'https://www.figma.com/api/mcp/asset/0493bf48-fa1d-4f32-af12-79ab3e600e49',
  analyzeArrow: 'https://www.figma.com/api/mcp/asset/6d62369b-ef0c-448c-b155-d572cf6bbf2d',
  patientIcon: 'https://www.figma.com/api/mcp/asset/321cf6ba-5b09-4f6d-b3e2-d744e31bd881',
  fabIcon: 'https://www.figma.com/api/mcp/asset/1ac15ecc-d2a1-4455-a3d3-3a330fa12f45',
  xrayImg: 'https://www.figma.com/api/mcp/asset/c494860f-8dca-4cf4-bba5-56f6cc881bac',
  reportIcon: 'https://www.figma.com/api/mcp/asset/2b967492-07f0-45c5-85ac-c94485717f14',
  dashIcon: 'https://www.figma.com/api/mcp/asset/76fd9b13-d1af-4740-971d-946f2863e9e3',
  assessIcon: 'https://www.figma.com/api/mcp/asset/63821066-e236-40b7-b5a3-882e75586094',
  settingsNavIcon: 'https://www.figma.com/api/mcp/asset/d04e1c8c-4588-4c97-8808-53a66b050009',
};

const patientData = [
  { id: 1, name: 'Benjamin\nThorne', caseNum: 'Case #8821-DA', chronoAge: '12.4y', dentalAge: '13.1y' },
  { id: 2, name: 'Elara\nVance', caseNum: 'Case #8819-DA', chronoAge: '8.2y', dentalAge: '8.5y' },
  { id: 3, name: 'Julian\nMars', caseNum: 'Case #8815-DA', chronoAge: '10.6y', dentalAge: '10.4y' },
];

function PatientCard({ patient, onPress }) {
  return (
    <TouchableOpacity style={styles.patientCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.patientLeft}>
        <View style={styles.patientAvatar}>
          <Image source={{ uri: ASSETS.patientIcon }} style={styles.patientAvatarIcon} />
        </View>
        <View>
          <Text style={styles.patientName}>{patient.name}</Text>
          <Text style={styles.patientCase}>{patient.caseNum}</Text>
        </View>
      </View>
      <View style={styles.patientRight}>
        <View style={styles.ageColumn}>
          <Text style={styles.ageLabel}>CHRONOLOGICAL</Text>
          <Text style={styles.ageValue}>{patient.chronoAge}</Text>
        </View>
        <View style={styles.ageColumn}>
          <Text style={[styles.ageLabel, { color: colors.indigo }]}>DENTAL{'\n'}AGE</Text>
          <Text style={[styles.ageValue, { color: colors.indigoDark }]}>{patient.dentalAge}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const {session, loading} = useAuth();
  const {data: profile, error : profileError} = useProfile(session?.user?.id);

  console.log("the user is here" , profile);

  const handleUploadAndAnalyze = async () => {
    try {
      const uri = await openImagePicker();
      if (uri) {
        // Trigger a background notification to simulate the analysis start
        sendLocalNotification("Upload Successful", "The radiograph is queued for Demirjian analysis.");
        navigation?.navigate('XRayAnalysis', { imageUri: uri });
      }
    } catch (error) {
      console.warn('Error picking image:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgScreen} />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.profileBorder}>
            <Image source={ profile?.profile_photo_url ? { uri: profile.profile_photo_url } 
      : DEFAULT_PROFILE_PHOTO } style={styles.profilePic} />
          </View>
        </View>
        <TouchableOpacity style={styles.settingsBtn}>
          <Image source={{ uri: ASSETS.settingsIcon }} style={styles.settingsIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Section ── */}
        <View style={styles.heroSection}>
          {/* Stats Card (top) */}
          <View style={styles.heroCard}>
            <Image source={{ uri: ASSETS.heroDecor }} style={styles.heroDecor} />
            <View style={styles.heroContent}>
              <Text style={styles.heroGreeting}>Morning, Dr. Aris</Text>
              <Text style={styles.heroTitle}>Clinical Precision{'\n'}Tool</Text>
              <View style={styles.heroPills}>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillLabel}>ASSESSMENTS{'\n'}TODAY</Text>
                  <Text style={styles.heroPillValue}>14</Text>
                </View>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillLabel}>AVG.{'\n'}ACCURACY</Text>
                  <Text style={styles.heroPillValue}>98.4%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Scan Card (bottom) */}
          <View style={styles.quickScanCard}>
            <View style={styles.quickScanTop}>
              <Text style={styles.quickScanTitle}>Quick Scan</Text>
              <Image source={{ uri: ASSETS.uploadIcon }} style={styles.quickScanIcon} />
            </View>
            <Text style={styles.quickScanSub}>
              AI ready for high-resolution panoramic upload.
            </Text>
            <TouchableOpacity
              style={styles.analyzeBtn}
              activeOpacity={0.85}
              onPress={handleUploadAndAnalyze}
            >
              <Image source={{ uri: ASSETS.analyzeArrow }} style={styles.analyzeBtnIcon} />
              <Text style={styles.analyzeBtnText}>Analyze X-Ray</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Recent Assessments ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Assessments</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllBtn}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.patientList}>
            {patientData.map((p) => (
              <PatientCard
                key={p.id}
                patient={p}
                onPress={() => navigation?.navigate('StageClassification')}
              />
            ))}
          </View>
        </View>

        {/* ── Recent Activity ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          <View style={styles.activityCard}>
            {/* X-Ray thumbnail */}
            <View style={styles.xrayWrapper}>
              <Image source={{ uri: ASSETS.xrayImg }} style={styles.xrayImg} />
              <View style={styles.xrayInfo}>
                <View>
                  <Text style={styles.xrayName}>Pan-Radiograph A12</Text>
                  <Text style={styles.xrayTime}>Last analyzed 12m ago</Text>
                </View>
                <View style={styles.processedBadge}>
                  <Text style={styles.processedText}>PROCESSED</Text>
                </View>
              </View>
            </View>
            {/* Report line */}
            <View style={styles.reportRow}>
              <Image source={{ uri: ASSETS.reportIcon }} style={styles.reportIcon} />
              <View>
                <Text style={styles.reportTitle}>Report Generated</Text>
                <Text style={styles.reportSub}>Sarah Jenkins · 2h ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom padding for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.88}
        onPress={() => navigation?.navigate('XRayAnalysis')}
      >
        <Image source={{ uri: ASSETS.fabIcon }} style={styles.fabIcon} />
        <Text style={styles.fabText}>Start New Assessment</Text>
      </TouchableOpacity>

      {/* ── Bottom Nav Bar ── */}
      <View style={styles.bottomNav}>
        {[
          { id: 'dashboard', label: 'DASHBOARD', icon: ASSETS.dashIcon },
          { id: 'assessments', label: 'ASSESSMENTS', icon: ASSETS.assessIcon },
          { id: 'settings', label: 'SETTINGS', icon: ASSETS.settingsNavIcon },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.navTab, activeTab === tab.id && styles.navTabActive]}
            onPress={() => {
              setActiveTab(tab.id);
              if (tab.id === 'settings') navigation?.navigate('Settings');
            }}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: tab.icon }}
              style={[styles.navIcon, activeTab === tab.id && styles.navIconActive]}
            />
            <Text style={[styles.navLabel, activeTab === tab.id && styles.navLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgScreen },

  // Top Bar
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(248,250,252,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99,102,241,0.05)',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center' },
  profileBorder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    padding: 2,
    overflow: 'hidden',
  },
  profilePic: { width: '100%', height: '100%', borderRadius: 18 },
  settingsBtn: { padding: 8, borderRadius: 20 },
  settingsIcon: { width: 20, height: 20, resizeMode: 'contain' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Hero
  heroSection: { gap: 16, marginBottom: 24 },
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 32,
    backgroundColor: colors.primary,
    ...shadows.hero,
  },
  heroDecor: {
    position: 'absolute',
    bottom: -16,
    right: -16,
    width: 133,
    height: 133,
    opacity: 0.3,
  },
  heroContent: { gap: 4 },
  heroGreeting: { fontSize: 14, fontWeight: '500', color: '#e0e0ff', opacity: 0.9 },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: -0.75,
    lineHeight: 36,
    marginBottom: 16,
  },
  heroPills: { flexDirection: 'row', gap: 16 },
  heroPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  heroPillLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    lineHeight: 14,
  },
  heroPillValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginTop: 4,
  },

  // Quick Scan
  quickScanCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(198,197,211,0.1)',
    padding: 25,
    ...shadows.card,
  },
  quickScanTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickScanTitle: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  quickScanIcon: { width: 16, height: 20, resizeMode: 'contain' },
  quickScanSub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  analyzeBtnIcon: { width: 9, height: 9, resizeMode: 'contain' },
  analyzeBtnText: { fontSize: 16, fontWeight: '600', color: colors.tealDark },

  // Section
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  viewAllBtn: { fontSize: 14, fontWeight: '600', color: colors.primary },

  // Patient Cards
  patientList: { gap: 12 },
  patientCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 32,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card,
  },
  patientLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  patientAvatar: {
    width: 36,
    height: 48,
    backgroundColor: colors.primaryExtraLight,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientAvatarIcon: { width: 16, height: 16, resizeMode: 'contain' },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  patientCase: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginTop: 4 },
  patientRight: { flexDirection: 'row', gap: 28 },
  ageColumn: { alignItems: 'flex-end', gap: 4 },
  ageLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'right',
    lineHeight: 14,
  },
  ageValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },

  // Activity Card
  activityCard: {
    backgroundColor: '#f1f4f7',
    borderRadius: 40,
    padding: 24,
    gap: 20,
  },
  xrayWrapper: { gap: 12 },
  xrayImg: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  xrayInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xrayName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  xrayTime: { fontSize: 11, fontWeight: '400', color: colors.textSecondary, marginTop: 2 },
  processedBadge: {
    backgroundColor: colors.greenBg,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  processedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.green,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(198,197,211,0.1)',
  },
  reportIcon: { width: 26, height: 26, resizeMode: 'contain' },
  reportTitle: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  reportSub: { fontSize: 10, fontWeight: '400', color: colors.textSecondary, marginTop: 2 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.primary,
    borderRadius: 9999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    ...shadows.fab,
  },
  fabIcon: { width: 15, height: 15, resizeMode: 'contain', tintColor: colors.white },
  fabText: { fontSize: 16, fontWeight: '700', color: colors.white, letterSpacing: -0.4 },

  // Bottom Nav
  bottomNav: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingBottom: 8,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  navTabActive: { backgroundColor: colors.primaryExtraLight },
  navIcon: { width: 18, height: 18, resizeMode: 'contain', opacity: 0.5 },
  navIconActive: { opacity: 1 },
  navLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  navLabelActive: { color: colors.indigoDark },
});
