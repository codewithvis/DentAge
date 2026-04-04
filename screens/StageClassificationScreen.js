import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows } from '../theme';
import { supabase, enqueueOfflineAction, syncOfflineData } from '../services/supabase';
// Note: Using direct database insertion instead of edge function for now

const STAGES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const STAGE_DESCRIPTIONS = {
  A: 'No mineralization visible',
  B: 'Initial mineralization only',
  C: 'Crown 1/3 complete',
  D: 'Crown 2/3 complete',
  E: 'Crown complete, root initiation',
  F: 'Root 1/3 formed',
  G: 'Root 2/3 formed',
  H: 'Root complete, apex open',
};

const XRAY_IMG = require('../assets/images/placeholder.png');

import { scale } from '../utils/responsive';
import {
  FONT_SIZES,
  CONTAINER_PADDING,
  spacing,
  padding,
  gaps,
  borderRadius,
} from '../constants/layout';

export default function StageClassificationScreen({ navigation, route }) {
  const aiData = route.params?.aiData;
  const [saving, setSaving] = useState(false);
  const [retryError, setRetryError] = useState(null);
  const [showRetry, setShowRetry] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    let analysisWithUser = null;
    try {
      // Validation: Ensure AI data is available
      const aiData = route.params?.aiData;
      if (!aiData) {
        Alert.alert("Validation Error", "AI analysis data is missing. Please go back and complete the analysis.");
        setSaving(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Authentication Error", "You must be logged in to save analysis results.");
        setSaving(false);
        return;
      }

      // Step 3: Prepare data for saving to database
      const analysisData = {
        case_id: `CASE-${Date.now()}`,
        patient_id: null, // Default to null for UUID schema
        image_url: route.params?.imageUri,
        dental_age: aiData.estimated_age,
        ai_confidence: aiData.confidence,
        maturity_score: Math.min(100, Math.max(0, ((aiData.estimated_age || 0) / 18) * 100)),
        age_range: aiData.age_range,
        tooth_development_stage: aiData.tooth_development_stage,
        analysis: aiData.analysis
      };

      // Add user_id to the analysis data for RLS
      analysisWithUser = {
        ...analysisData,
        user_id: user.id
      };

      // Step 4: Database Storage - save to analyses table
      const { error: dbError } = await supabase.from('analyses').insert(analysisWithUser);
      if (dbError) {
        console.warn('analyses insert error', dbError);
        throw dbError;
      }

      setRetryError(null);
      setShowRetry(false);
      navigation?.navigate('Results', { analysisData, imageUri: route.params?.imageUri });
    } catch (err) {
      console.warn('Error saving analysis:', err);
      setRetryError(err?.message || 'Unable to save analysis results.');
      setShowRetry(true);

      // Queue offline action with new structure
      await enqueueOfflineAction({
        type: 'saveAnalysis',
        payload: {
          analysisData: analysisWithUser,
        },
      });

      Alert.alert('Analysis failed', err?.message || 'Unable to save analysis results. It has been queued for sync.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgScreen} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation?.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Analysis{'\n'}Review</Text>
            <Text style={styles.headerSub}>AI-powered dental assessment</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.helpBtn}>
          <Text style={styles.helpIcon}>🤖</Text>
          <Text style={styles.helpText}>AI{'\n'}Analysis</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Diagnostic Focus Section ── */}
        <View style={styles.diagnosticCard}>
          {/* X-Ray Preview */}
          <View style={styles.xrayPreview}>
            <Image source={XRAY_IMG} style={styles.xrayImg} />
            <View style={styles.xrayGradient} />
            <View style={styles.xrayLabel}>
              <Text style={styles.xrayLabelText}>Tooth 36 · Distal View</Text>
            </View>
          </View>

          {/* AI Insights */}
          <View style={styles.aiInsights}>
            <View style={styles.aiHeader}>
              <Text style={styles.aiIcon}>✦</Text>
              <Text style={styles.aiTitle}>AI Insights</Text>
            </View>

            <Text style={styles.stageResult}>
              {aiData ? aiData.tooth_development_stage : 'Analysis Pending'}
            </Text>

            {/* Confidence Box */}
            <View style={styles.confidenceBox}>
              <Text style={styles.confidenceDesc}>
                Root development shows crown completion with visible root initiation. 
                Periodontal ligament space is clearly defined. Consistent with late 
                mixed dentition stage of development based on morphological indicators.
              </Text>
              <View style={styles.confidenceRow}>
                <Text style={styles.confidenceLabel}>AI Confidence</Text>
                <Text style={styles.confidenceValue}>
                  {aiData ? Math.round(aiData.confidence * 100) : 'N/A'}%
                </Text>
              </View>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: aiData ? `${aiData.confidence * 100}%` : '0%' }]} />
              </View>
            </View>

            {/* Confirm Button */}
            <TouchableOpacity
              style={styles.confirmBtn}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color={colors.white} /> : (
                <>
                  <Text style={styles.confirmBtnIcon}>✓</Text>
                  <Text style={styles.confirmBtnText}>
                    Confirm Analysis: {aiData ? `${aiData.estimated_age} years` : 'Pending'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {showRetry && (
              <TouchableOpacity
                style={styles.retryBtn}
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={saving}
              >
                <Text style={styles.retryBtnText}>Retry Saving Analysis</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.syncBtn}
              activeOpacity={0.85}
              onPress={async () => {
                setSaving(true);
                try {
                  await syncOfflineData();
                  Alert.alert('Sync completed', 'Offline queue has been processed.');
                  setShowRetry(false);
                  setRetryError(null);
                } catch (e) {
                  console.warn('Sync offline data failed:', e);
                  Alert.alert('Sync error', 'Unable to sync offline data. Please try again later.');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              <Text style={styles.syncBtnText}>{saving ? 'Syncing...' : 'Sync Offline Queue'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── AI Analysis Results ── */}
        <View style={styles.analysisSection}>
          <View style={styles.analysisHeader}>
            <View>
              <Text style={styles.analysisTitle}>AI Analysis{'\n'}Results</Text>
              <Text style={styles.analysisSub}>
                Comprehensive dental development assessment
              </Text>
            </View>
            <View style={styles.analysisConfidence}>
              <Text style={styles.confidenceLabel}>Confidence</Text>
              <Text style={styles.confidenceValue}>
                {aiData ? Math.round(aiData.confidence * 100) : 0}%
              </Text>
            </View>
          </View>

           {aiData && (
             <>
                {/* Estimated Age */}
                <View style={styles.ageResult}>
                  <Text style={styles.ageLabel}>Estimated Dental Age</Text>
                  <Text style={styles.ageValue}>{aiData.estimated_age || 'N/A'} years</Text>
                  <Text style={styles.ageRange}>
                    Age Range: {aiData.age_range || 'N/A'}
                  </Text>
                  <Text style={styles.methodText}>
                    Development Stage: {aiData.tooth_development_stage || 'N/A'}
                  </Text>
                </View>

                {/* Analysis Details */}
                <View style={styles.analysisDetails}>
                  <Text style={styles.detailsTitle}>AI Analysis Summary</Text>
                  <Text style={styles.detailsValue}>
                    {aiData.analysis || 'Analysis not available'}
                  </Text>

                  <Text style={styles.detailsTitle}>Development Stage</Text>
                  <Text style={styles.detailsValue}>
                    {aiData.tooth_development_stage || 'Not available'}
                  </Text>

                  <Text style={styles.detailsTitle}>Confidence Level</Text>
                  <Text style={styles.detailsValue}>
                    {aiData ? `${Math.round(aiData.confidence * 100)}% confidence in assessment` : 'N/A'}
                  </Text>

                  <Text style={styles.detailsTitle}>Methodology</Text>
                  <Text style={styles.detailsValue}>
                    Gemini AI analysis of full OPG radiograph using Demirjian classification criteria
                  </Text>
                </View>
             </>
           )}

          {!aiData && (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>No AI analysis data available</Text>
              <Text style={styles.noDataSubtext}>
                Please go back and complete the radiograph analysis
              </Text>
            </View>
          )}
        </View>

        {/* ── Primary Action ── */}
        <View style={styles.primaryAction}>
          <TouchableOpacity
            style={styles.generateReportBtn}
            onPress={handleSubmit}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={colors.white} /> : (
              <>
                <Text style={styles.generateReportIcon}>📊</Text>
                <Text style={styles.generateReportText}>Generate Dental Age Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={styles.floatingBar}>
        <View style={styles.floatingBarLeft}>
          <View style={styles.floatingIcon}>
            <Text style={styles.floatingIconEmoji}>🤖</Text>
          </View>
          <View>
            <Text style={styles.floatingLabel}>AI Analysis</Text>
            <Text style={styles.floatingValue}>
              {aiData ? `${aiData.estimatedAge?.confidence || 0}%` : 'N/A'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.floatingBtnText}>Generate{'\n'}Report</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgScreen },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: CONTAINER_PADDING, paddingTop: spacing.lg, paddingBottom: spacing.xxl },

  // Header
  header: {
    height: scale(120),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    backgroundColor: colors.bgScreen,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: gaps.lg },
  backBtn: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  backIcon: { fontSize: 18, color: colors.textPrimary },
  headerTitles: { gap: 4 },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.75,
    lineHeight: 30,
  },
  headerSub: { fontSize: 14, fontWeight: '400', color: colors.textSecondary },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    ...shadows.card,
  },
  helpIcon: { fontSize: 13, color: colors.primary },
  helpText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Diagnostic Card
  diagnosticCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    marginBottom: spacing.xxxl,
    ...shadows.card,
  },
  xrayPreview: { height: scale(294), position: 'relative' },
  xrayImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  xrayGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: scale(80),
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  xrayLabel: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  xrayLabelText: { fontSize: FONT_SIZES.xs, fontWeight: '500', color: colors.white },
  aiInsights: { padding: padding.section, gap: gaps.lg },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: gaps.md },
  aiIcon: { fontSize: scale(18), color: colors.primary },
  aiTitle: { fontSize: FONT_SIZES.lg, fontWeight: '600', color: colors.textSecondary },
  stageResult: {
    fontSize: scale(36),
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  confidenceBox: {
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: gaps.lg,
  },
  confidenceDesc: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: scale(20),
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceLabel: { fontSize: FONT_SIZES.sm, fontWeight: '500', color: colors.textSecondary },
  confidenceValue: { fontSize: scale(16), fontWeight: '700', color: colors.primary },
  progressBg: {
    height: spacing.xs,
    backgroundColor: colors.bgInput,
    borderRadius: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: spacing.xs,
    backgroundColor: colors.primary,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    gap: gaps.sm,
    ...shadows.button,
  },
  confirmBtnIcon: { fontSize: scale(16), color: colors.white },
  confirmBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: colors.white },
  retryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.red,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.button,
  },
  retryBtnText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: colors.white,
  },
  syncBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.indigo,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.button,
  },
  syncBtnText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.white,
  },

  // Reference Section
  referenceSection: { marginBottom: spacing.xxl },
  refHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: gaps.lg,
  },
  refTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: scale(26),
    letterSpacing: -0.5,
  },
  refSub: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: scale(18),
  },
  refNav: { flexDirection: 'row', gap: gaps.sm },
  refNavBtn: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: borderRadius.button,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  refNavArrow: { fontSize: scale(16), color: colors.textPrimary, fontWeight: '600' },

  stageCardsRow: { paddingRight: spacing.lg, gap: gaps.lg },
  stageCard: {
    width: scale(200),
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    position: 'relative',
    ...shadows.card,
  },
  stageCardActive: {
    backgroundColor: colors.primaryExtraLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  stageActiveBadge: {
    position: 'absolute',
    top: -spacing.md,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  stageActiveBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: colors.white,
  },
  stageImageBox: {
    width: scale(168),
    height: scale(168),
    backgroundColor: '#f8fafc',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: gaps.md,
  },
  stageImageBoxActive: { backgroundColor: colors.white },
  stageEmoji: { fontSize: scale(48) },
  stageLetter: {
    position: 'absolute',
    bottom: spacing.xs,
    right: spacing.xs,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: colors.textMuted,
    backgroundColor: colors.bgInput,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.button,
  },
  stageLetterActive: { backgroundColor: colors.primaryExtraLight, color: colors.primary },
  stageCardTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stageCardTitleActive: { color: colors.primary },
  stageCardDesc: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: scale(17),
    marginTop: spacing.xs,
  },
  stageCardDescActive: { color: colors.textSecondary },

  // Secondary Actions
  secondaryActions: { gap: gaps.lg, marginBottom: gaps.lg },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    gap: gaps.sm,
  },
  outlineBtnIcon: { fontSize: scale(16) },
  outlineBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '500', color: colors.textSecondary },
  solidBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    ...shadows.button,
  },
  solidBtnText: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: colors.white },

  // Floating Bar
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    padding: spacing.lg,
    ...shadows.hero,
  },
  floatingBarLeft: { flexDirection: 'row', alignItems: 'center', gap: gaps.md },
  floatingIcon: {
    width: spacing.xl,
    height: spacing.xl,
    backgroundColor: colors.primaryExtraLight,
    borderRadius: borderRadius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingIconEmoji: { fontSize: scale(20) },
  floatingLabel: { fontSize: FONT_SIZES.xs, fontWeight: '400', color: colors.textSecondary },
  floatingValue: { fontSize: scale(22), fontWeight: '700', color: colors.textPrimary },
  floatingBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.button,
  },
  floatingBtnText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    lineHeight: scale(20),
  },

  // AI Analysis Section
  analysisSection: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: padding.section,
    marginBottom: gaps.lg,
    ...shadows.card,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: gaps.lg,
  },
  analysisTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: scale(28),
  },
  analysisSub: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  analysisConfidence: {
    alignItems: 'center',
    backgroundColor: colors.primaryExtraLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  confidenceLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: colors.primary,
  },
  confidenceValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: colors.primary,
  },

  // Age Result
  ageResult: {
    backgroundColor: colors.bgMuted,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: gaps.lg,
    alignItems: 'center',
  },
  ageLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  ageValue: {
    fontSize: FONT_SIZES.huge,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  ageRange: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  methodText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '400',
    color: colors.textMuted,
  },

  // Analysis Details
  analysisDetails: {
    gap: gaps.md,
  },
  detailsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  detailsValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: scale(20),
  },
  findingItem: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '400',
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    marginBottom: spacing.xs,
  },

  // No Data State
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  noDataText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  noDataSubtext: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '400',
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Primary Action
  primaryAction: {
    marginBottom: gaps.lg,
  },
  generateReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.card,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: gaps.sm,
    ...shadows.button,
  },
  generateReportIcon: {
    fontSize: FONT_SIZES.lg,
  },
  generateReportText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: colors.white,
  },
});
