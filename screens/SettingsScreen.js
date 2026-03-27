import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image, Alert,
  Switch,
  Linking,
} from 'react-native';
import { colors, radius, shadows } from '../theme';
import { supabase } from '../services/supabase';
import { useAuth } from '../provider/AuthProvider';
import { useProfile } from '../api/profile';
import { DEFAULT_PROFILE_PHOTO } from '../constants/constants';

const PROFILE_IMG = 'https://www.figma.com/api/mcp/asset/c0ea0520-82ae-49f1-b629-baa5bff5e830';

function ToggleRow({ icon, title, subtitle, value, onChange }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLeft}>
        <View style={styles.toggleIcon}>
          <Text style={styles.toggleIconText}>{icon}</Text>
        </View>
        <View style={styles.toggleTexts}>
          <Text style={styles.toggleTitle}>{title}</Text>
          {subtitle && <Text style={styles.toggleSub}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.bgInput, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function MenuRow({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={styles.menuLabel}>{label}</Text>
      </View>
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [method, setMethod] = useState('Demirjian');

  const { session, loading: sessionLoading } = useAuth();
  const { data: profile, error: profileError, loading: profileLoading } = useProfile(session?.user?.id);

  if (profileLoading || sessionLoading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgScreen} />

      {/* Top App Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Settings</Text>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
          <Text style={styles.moreDots}>•••</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Bento ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Image source={ profile?.profile_photo_url ? { uri: profile.profile_photo_url } 
                  : DEFAULT_PROFILE_PHOTO } style={styles.profileImg} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name}</Text>
            <Text style={styles.profileRole}>Oral & Maxillofacial Radiologist</Text>
            <View style={styles.profileBadge}>
              <Text style={styles.profileBadgeText}>License Verified</Text>
            </View>
          </View>
        </View>

        {/* ── Clinical Preferences ── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionLabel}>Clinical Preferences</Text>

          <View style={styles.sectionCard}>
            {/* Classification Method */}
            <View style={styles.methodRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIcon, { backgroundColor: '#fef3c7' }]}>
                  <Text style={styles.toggleIconText}>🦷</Text>
                </View>
                <View style={styles.toggleTexts}>
                  <Text style={styles.toggleTitle}>Classification Method</Text>
                  <Text style={styles.toggleSub}>Active scoring system</Text>
                </View>
              </View>
              <View style={styles.methodSelector}>
                {['Demirjian', 'Nolla'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodBtn, method === m && styles.methodBtnActive]}
                    onPress={() => setMethod(m)}
                  >
                    <Text style={[styles.methodBtnText, method === m && styles.methodBtnTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <ToggleRow
              icon="📊"
              title="Confidence Threshold"
              subtitle="Flag if AI confidence < 85%"
              value={notifications}
              onChange={setNotifications}
            />
          </View>
        </View>

        {/* ── App Settings ── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionLabel}>App Settings</Text>

          <View style={styles.sectionCard}>
            <ToggleRow
              icon="🌙"
              title="Dark Mode"
              value={darkMode}
              onChange={setDarkMode}
            />
            <View style={styles.divider} />
            <ToggleRow
              icon="🔔"
              title="Push Notifications"
              value={notifications}
              onChange={setNotifications}
            />
            <View style={styles.divider} />
            <View style={styles.linkRow}>
              <View style={styles.toggleLeft}>
                <View style={[styles.toggleIcon, { backgroundColor: '#f0fdf4' }]}>
                  <Text style={styles.toggleIconText}>📱</Text>
                </View>
                <View style={styles.toggleTexts}>
                  <Text style={styles.toggleTitle}>App Version</Text>
                  <Text style={styles.toggleSub}>v2.4.1 · Build 2024.12</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={styles.linkBtnText}>Check Updates</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Support & Legal ── */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionLabel}>Support & Legal</Text>

          <View style={styles.sectionCard}>
            <MenuRow icon="📖" label="User Documentation" onPress={() => { Linking.openURL('https://opg-app.example.com/docs'); }} />
            <View style={styles.menuDivider} />
            <MenuRow icon="📋" label="Privacy Policy" onPress={() => { Linking.openURL('https://opg-app.example.com/privacy'); }} />
            <View style={styles.menuDivider} />
            <MenuRow icon="⚖️" label="Terms of Service" onPress={() => { Linking.openURL('https://opg-app.example.com/terms'); }} />
          </View>
        </View>

        {/* ── Logout ── */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              const { error } = await supabase.auth.signOut()
              if (error) {
                Alert.alert("Failed to sign out");
              }
              else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                });
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutIcon}>→</Text>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
          <Text style={styles.logoutVersion}>DentAge · Clinical Edition</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {[
          { label: 'DASHBOARD', active: false, nav: 'Home' },
          { label: 'SCAN', active: false, nav: 'XRayAnalysis' },
          { label: 'OPG', active: false, nav: 'StageClassification' },
          { label: 'SETTINGS', active: true, nav: 'Settings' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.label}
            style={styles.navTab}
            onPress={() => !tab.active && navigation?.navigate(tab.nav)}
          >
            <Text style={[styles.navLabel, tab.active && styles.navLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgScreen },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16 },

  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  backArrow: { fontSize: 16, color: colors.textPrimary },
  topTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  moreBtn: { padding: 8 },
  moreDots: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, letterSpacing: 2 },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: 32,
    gap: 24,
    marginBottom: 20,
    ...shadows.card,
  },
  profileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.primaryExtraLight,
  },
  profileImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  profileInfo: { flex: 1, gap: 6 },
  profileName: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  profileRole: { fontSize: 13, fontWeight: '400', color: colors.textSecondary, lineHeight: 18 },
  profileBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryExtraLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 4,
  },
  profileBadgeText: { fontSize: 12, fontWeight: '600', color: colors.primary },

  // Section Groups
  sectionGroup: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: 8,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.card,
  },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 20 },
  menuDivider: { height: 1, backgroundColor: colors.border, marginLeft: 60 },

  // Toggle Rows
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryExtraLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIconText: { fontSize: 18 },
  toggleTexts: { gap: 2 },
  toggleTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  toggleSub: { fontSize: 12, fontWeight: '400', color: colors.textSecondary },

  // Method Row
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  methodSelector: { flexDirection: 'row', borderRadius: 10, overflow: 'hidden', gap: 0 },
  methodBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.bgInput,
    borderRadius: 8,
  },
  methodBtnActive: { backgroundColor: colors.primary },
  methodBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  methodBtnTextActive: { color: colors.white },

  // Link Row
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  linkBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  // Menu Rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  menuLabel: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  menuChevron: { fontSize: 20, color: colors.textMuted },

  // Logout
  logoutSection: { alignItems: 'center', gap: 12, marginBottom: 16 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
  },
  logoutIcon: { fontSize: 16, color: '#dc2626' },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#dc2626' },
  logoutVersion: { fontSize: 12, fontWeight: '400', color: colors.textMuted },

  // Bottom Nav
  bottomNav: {
    height: 64,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navTab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 9, fontWeight: '500', color: colors.textMuted, letterSpacing: 0.3 },
  navLabelActive: { color: colors.primary, fontWeight: '700' },
});
