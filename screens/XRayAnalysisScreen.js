import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows } from '../theme';
import { supabase, enqueueOfflineAction } from '../services/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { analyzeOPG } from '../api/analyze';

const XRAY_IMG = require('../assets/images/placeholder.png');
const SHARE_ICON = 'https://www.figma.com/api/mcp/asset/61719cfc-29ee-4e38-a422-1c5d6a967389';

import { scale } from '../utils/responsive';
import {
  FONT_SIZES,
  CONTAINER_PADDING,
  HEADER_HEIGHT,
  BOTTOM_NAV_HEIGHT,
  spacing,
  padding,
  gaps,
  borderRadius,
} from '../constants/layout';

const DETECTED_TEETH = [
  { id: '36', label: 'Lower Left First Molar (36)', color: colors.primary },
  { id: '35', label: 'Lower Left Second Premolar (35)', color: colors.indigo },
  { id: '34', label: 'Lower Left First Premolar (34)', color: '#06b6d4' },
  { id: '37', label: 'Lower Left Second Molar (37)', color: '#8b5cf6' },
  { id: '38', label: 'Lower Left Third Molar (38)', color: '#ec4899' },
  { id: '33', label: 'Lower Left Canine (33)', color: '#f59e0b' },
  { id: '32', label: 'Lower Left Lateral Incisor (32)', color: '#10b981' },
];

const TOOTH_OVERLAYS = [
  { id: '36', left: '42%', top: '58%' },
  { id: '35', left: '45%', top: '60%' },
  { id: '34', left: '49%', top: '62%' },
  { id: '37', left: '53%', top: '62%' },
  { id: '38', left: '57%', top: '58%' },
  { id: '45', left: '64%', top: '52%' },
  { id: '46', left: '72%', top: '52%' },
];

export default function XRayAnalysisScreen({ navigation, route }) {
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [selectedTooth, setSelectedTooth] = useState('36');
  const [uploading, setUploading] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState(XRAY_IMG);
  const [aiData, setAiData] = useState(null);

  useEffect(() => {
    if (route.params?.imageUri) {
      setCurrentImageUri(route.params.imageUri);
    }
  }, [route.params?.imageUri]);

  const handleProceed = async () => {
    if (!route.params?.imageUri) {
      Alert.alert("Error", "No image selected for analysis.");
      return;
    }

    setUploading(true);
    let aiData = null;

    try {
      // Read image as base64 for Gemini API
      let base64Image = '';
      try {
        base64Image = await FileSystem.readAsStringAsync(route.params.imageUri, { encoding: 'base64' });
      } catch(e) {
        console.warn("Failed to read base64 for AI", e);
        Alert.alert('Error', 'Unable to process the selected image.');
        setUploading(false);
        return;
      }

      // Call Gemini API for analysis
      if (base64Image) {
        // Get current user for authentication
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        aiData = await analyzeOPG(base64Image, user.id);
        setAiData(aiData);
        console.log("AI Analysis Successful:", aiData);
      }

    } catch (err) {
      console.log("CLIENT ERROR FULL:", err);
      console.warn('Analysis failed:', err);
      Alert.alert(
        'Analysis Failed',
        'Unable to analyze the radiograph. Please check your connection and try again.',
        [{ text: 'Retry', onPress: () => handleProceed() }, { text: 'Cancel' }]
      );
    } finally {
      setUploading(false);
      if (aiData) {
        navigation?.navigate('StageClassification', { imageUri: route.params.imageUri, aiData });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgScreen} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Radiograph Analysis</Text>
        </View>
        <TouchableOpacity style={styles.actionBtn}>
          <Image source={{ uri: SHARE_ICON }} style={styles.actionIcon} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Analysis Header & Toggle ── */}
        <View style={styles.analysisHeader}>
          <View style={styles.analysisTitle}>
            <Text style={styles.analysisTitleText}>Mandibular Left Arch</Text>
            <Text style={styles.analysisSub}>AI-assisted tooth identification and segmentation</Text>
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>AI Overlay</Text>
            <TouchableOpacity
              style={[styles.toggle, overlayEnabled && styles.toggleActive]}
              onPress={() => setOverlayEnabled(!overlayEnabled)}
            >
              <View style={[styles.toggleThumb, overlayEnabled && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Radiograph Viewport ── */}
        <View style={styles.viewport}>
          <Image source={typeof currentImageUri === 'string' ? { uri: currentImageUri } : currentImageUri} style={styles.xrayImg} />

          {/* AI Overlay Layer */}
          {overlayEnabled && (
            <View style={styles.overlayLayer}>
              {/* Detection bounding box */}
              <View style={styles.detectionBox}>
                <View style={styles.detectionLabel}>
                  <Text style={styles.detectionLabelText}>Target Region</Text>
                </View>
              </View>

              {/* Tooth labels */}
              {TOOTH_OVERLAYS.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.toothMarker,
                    { left: t.left, top: t.top },
                    selectedTooth === t.id && styles.toothMarkerActive,
                  ]}
                  onPress={() => setSelectedTooth(t.id)}
                >
                  <Text style={[styles.toothMarkerText, selectedTooth === t.id && styles.toothMarkerTextActive]}>
                    {t.id}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Viewport Controls */}
          <View style={styles.viewportControls}>
            <TouchableOpacity style={styles.controlBtn}>
              <Text style={styles.controlIcon}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn}>
              <Text style={styles.controlIcon}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn}>
              <Text style={styles.controlIcon}>⟲</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Bento Info Grid ── */}

        {/* Confidence Score */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>AI Analysis Confidence</Text>
          <View style={styles.confidenceRow}>
            <Text style={styles.confidencePct}>{aiData ? Math.round(aiData.confidence * 100) : '--'}</Text>
            <Text style={styles.confidenceUnit}>%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: aiData ? `${aiData.confidence * 100}%` : '0%' }]} />
          </View>
          <Text style={styles.confidenceNote}>
            {aiData ? 'Analysis complete - confidence based on radiographic clarity' : 'Confidence will be calculated after AI analysis'}
          </Text>
        </View>

        {/* Detected Items */}
        <View style={styles.infoCard}>
          <View style={styles.detectedHeader}>
            <Text style={styles.infoCardTitle}>Detected Teeth</Text>
            <View style={styles.detectedBadge}>
              <Text style={styles.detectedBadgeText}>7 found · Click to select</Text>
            </View>
          </View>
          <View style={styles.toothTagsGrid}>
            {DETECTED_TEETH.map((tooth) => (
              <TouchableOpacity
                key={tooth.id}
                style={[
                  styles.toothTag,
                  selectedTooth === tooth.id && { backgroundColor: tooth.color, borderColor: tooth.color },
                ]}
                onPress={() => setSelectedTooth(tooth.id)}
              >
                <View
                  style={[
                    styles.toothTagDot,
                    { backgroundColor: selectedTooth === tooth.id ? colors.white : tooth.color },
                  ]}
                />
                <Text
                  style={[
                    styles.toothTagText,
                    selectedTooth === tooth.id && { color: colors.white },
                  ]}
                >
                  {tooth.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>



        {/* ── Action Button ── */}
        <View style={styles.actionArea}>
          <TouchableOpacity
            style={styles.proceedBtn}
            activeOpacity={0.88}
            onPress={handleProceed}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.proceedBtnText}>Proceed to Stage Classification</Text>
                <Text style={styles.proceedBtnArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {['Dashboard', 'Assessments', 'Settings'].map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={styles.navTab}
            onPress={() => {
              if (tab === 'Dashboard') navigation?.navigate('Home');
              if (tab === 'Settings') navigation?.navigate('Settings');
            }}
          >
            <Text style={[styles.navLabel, i === 1 && styles.navLabelActive]}>{tab.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgScreen },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: CONTAINER_PADDING, paddingTop: spacing.lg, paddingBottom: spacing.xxl },

  // Top Bar
  topBar: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: gaps.md },
  backBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  backArrow: { fontSize: FONT_SIZES.base, color: colors.textPrimary },
  topTitle: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4 },
  actionBtn: { padding: spacing.sm, borderRadius: spacing.xl },
  actionIcon: { width: spacing.xxl, height: spacing.xxl, resizeMode: 'contain' },

  // Analysis Header
  analysisHeader: { marginBottom: gaps.md },
  analysisTitle: { gap: gaps.xs, marginBottom: gaps.md },
  analysisTitleText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  analysisSub: { fontSize: FONT_SIZES.sm, fontWeight: '400', color: colors.textSecondary },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gaps.md,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.button,
    padding: spacing.md,
    paddingHorizontal: spacing.md,
  },
  toggleLabel: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: colors.textSecondary, flex: 1 },
  toggle: {
    width: scale(44),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: colors.bgInput,
    padding: spacing.xs,
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleThumb: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(10),
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    ...shadows.card,
  },
  toggleThumbActive: { alignSelf: 'flex-end' },

  // Viewport
  viewport: {
    height: scale(200),
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: gaps.lg,
    position: 'relative',
  },
  xrayImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlayLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  detectionBox: {
    position: 'absolute',
    left: '40%',
    top: '40%',
    width: '35%',
    height: '36%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 4,
  },
  detectionLabel: {
    position: 'absolute',
    top: spacing.xl * -1,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: borderRadius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detectionLabelText: { fontSize: FONT_SIZES.xs, fontWeight: '500', color: colors.white },
  toothMarker: {
    position: 'absolute',
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -11 }, { translateY: -11 }],
  },
  toothMarkerActive: {
    backgroundColor: colors.primary,
    borderColor: colors.white,
  },
  toothMarkerText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: colors.white },
  toothMarkerTextActive: { color: colors.white },

  viewportControls: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: gaps.sm,
  },
  controlBtn: {
    width: scale(32),
    height: scale(32),
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: { fontSize: FONT_SIZES.base, fontWeight: '700', color: colors.white },

  // Info Cards
  infoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: padding.section,
    marginBottom: gaps.md,
    ...shadows.card,
    gap: gaps.md,
  },
  infoCardTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  confidenceRow: { flexDirection: 'row', alignItems: 'baseline', gap: gaps.xs },
  confidencePct: { fontSize: FONT_SIZES.huge, fontWeight: '700', color: colors.textPrimary, letterSpacing: -1 },
  confidenceUnit: { fontSize: FONT_SIZES.xl, fontWeight: '700', color: colors.textMuted },
  progressBg: {
    height: scale(6),
    backgroundColor: colors.bgMuted,
    borderRadius: scale(3),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: scale(3),
    backgroundColor: colors.primary,
  },
  confidenceNote: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '400',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  detectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detectedBadge: {
    backgroundColor: colors.primaryExtraLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  detectedBadgeText: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: colors.primary },
  toothTagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: gaps.sm },
  toothTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.bgMuted,
    borderRadius: borderRadius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  toothTagDot: { width: scale(8), height: scale(8), borderRadius: scale(4) },
  toothTagText: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: colors.textSecondary },

  // Action
  actionArea: { marginBottom: gaps.lg },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.card,
    paddingVertical: spacing.xl,
    gap: gaps.sm,
    ...shadows.button,
  },
  proceedBtnText: { fontSize: FONT_SIZES.base, fontWeight: '700', color: colors.white },
  proceedBtnArrow: { fontSize: FONT_SIZES.xl, color: colors.white },

  // Bottom Nav
  bottomNav: {
    height: BOTTOM_NAV_HEIGHT,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navTab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: FONT_SIZES.xs, fontWeight: '500', color: colors.textMuted, letterSpacing: 0.3 },
  navLabelActive: { color: colors.primary, fontWeight: '700' },
});

