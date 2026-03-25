import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { colors, radius, shadows } from '../theme';
import { supabase } from '../services/supabase';

const XRAY_IMG = 'https://www.figma.com/api/mcp/asset/c494860f-8dca-4cf4-bba5-56f6cc881bac';
const SHARE_ICON = 'https://www.figma.com/api/mcp/asset/61719cfc-29ee-4e38-a422-1c5d6a967389';

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
  const [gender, setGender] = useState(null); // Gender state

  useEffect(() => {
    if (route.params?.imageUri) {
      setCurrentImageUri(route.params.imageUri);
    }
  }, [route.params?.imageUri]);

  const handleProceed = async () => {
    // Validation: Block calculation if gender is not selected
    if (!gender) {
      Alert.alert("Validation Error", "Gender must be selected before proceeding.");
      return;
    }

    if (route.params?.imageUri) {
      setUploading(true);
      try {
        const fileExt = route.params.imageUri.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}.${fileExt}`;

        // Using fetch to get the blob from uri, works cross platform in RN
        const response = await fetch(route.params.imageUri);
        const blob = await response.blob();

        const { data, error } = await supabase.storage
          .from('radiographs')
          .upload(fileName, blob, {
            contentType: `image/${fileExt}`,
          });

        if (!error) {
           const { data: publicData } = supabase.storage.from('radiographs').getPublicUrl(fileName);
           // Assume patient_id=1 for now, in prod fetch from context/state
           await supabase.from('radiographs').insert({
             patient_id: 1,
             image_url: publicData.publicUrl,
             uploaded_at: new Date().toISOString()
           });
        }
      } catch (err) {
        console.warn('Upload failed:', err);
      } finally {
        setUploading(false);
        navigation?.navigate('StageClassification', { imageUri: route.params.imageUri, gender });
      }
    } else {
      navigation?.navigate('StageClassification', { gender });
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
          <Image source={{ uri: currentImageUri }} style={styles.xrayImg} />

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
          <Text style={styles.infoCardTitle}>Detection Confidence</Text>
          <View style={styles.confidenceRow}>
            <Text style={styles.confidencePct}>97.8</Text>
            <Text style={styles.confidenceUnit}>%</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: '97.8%' }]} />
          </View>
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

        {/* ── Gender Selection ── */}
        <View style={styles.infoCard}>
          <View style={styles.detectedHeader}>
            <Text style={styles.infoCardTitle}>Patient Gender</Text>
            <View style={styles.detectedBadge}>
              <Text style={styles.detectedBadgeText}>Required</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity 
              style={[styles.toothTag, gender === 'Male' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setGender('Male')}
            >
              <Text style={[styles.toothTagText, gender === 'Male' && { color: colors.white }]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toothTag, gender === 'Female' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setGender('Female')}
            >
              <Text style={[styles.toothTagText, gender === 'Female' && { color: colors.white }]}>Female</Text>
            </TouchableOpacity>
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
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  // Top Bar
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  topTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.4 },
  actionBtn: { padding: 8, borderRadius: 20 },
  actionIcon: { width: 20, height: 20, resizeMode: 'contain' },

  // Analysis Header
  analysisHeader: { marginBottom: 12 },
  analysisTitle: { gap: 4, marginBottom: 12 },
  analysisTitleText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  analysisSub: { fontSize: 13, fontWeight: '400', color: colors.textSecondary },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 8,
    paddingHorizontal: 12,
  },
  toggleLabel: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, flex: 1 },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bgInput,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: { backgroundColor: colors.primary },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
    alignSelf: 'flex-start',
    ...shadows.card,
  },
  toggleThumbActive: { alignSelf: 'flex-end' },

  // Viewport
  viewport: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
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
    top: -20,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  detectionLabelText: { fontSize: 10, fontWeight: '500', color: colors.white },
  toothMarker: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
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
  toothMarkerText: { fontSize: 9, fontWeight: '700', color: colors.white },
  toothMarkerTextActive: { color: colors.white },

  viewportControls: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    gap: 8,
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: { fontSize: 16, fontWeight: '700', color: colors.white },

  // Info Cards
  infoCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    ...shadows.card,
    gap: 12,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  confidenceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  confidencePct: { fontSize: 36, fontWeight: '700', color: colors.textPrimary, letterSpacing: -1 },
  confidenceUnit: { fontSize: 20, fontWeight: '700', color: colors.textMuted },
  progressBg: {
    height: 6,
    backgroundColor: colors.bgMuted,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.primary,
  },

  detectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detectedBadge: {
    backgroundColor: colors.primaryExtraLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  detectedBadgeText: { fontSize: 10, fontWeight: '600', color: colors.primary },
  toothTagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  toothTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgMuted,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  toothTagDot: { width: 8, height: 8, borderRadius: 4 },
  toothTagText: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },

  // Action
  actionArea: { marginBottom: 16 },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    gap: 8,
    ...shadows.button,
  },
  proceedBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  proceedBtnArrow: { fontSize: 18, color: colors.white },

  // Bottom Nav
  bottomNav: {
    height: 64,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navTab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, fontWeight: '500', color: colors.textMuted, letterSpacing: 0.3 },
  navLabelActive: { color: colors.primary, fontWeight: '700' },
});
