/**
 * Layout Constants for DentAge
 * Centralized responsive breakpoints, dimensions, and layout values
 * Ensures consistent spacing, alignment, and sizing across all screens
 */

import { Dimensions } from 'react-native';
import { scale, moderateScale, getResponsiveFontSize } from '../utils/responsive';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ─────────────────────────────────────────────────
// BREAKPOINTS
// ─────────────────────────────────────────────────
export const BREAKPOINTS = {
  small: 380,
  medium: 600,
  large: 768,
  tablet: 1024,
};

// ─────────────────────────────────────────────────
// SPACING SYSTEM (Foundation for all margins/paddings)
// ─────────────────────────────────────────────────
export const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  xxxl: moderateScale(32),
  huge: moderateScale(40),
};

// ─────────────────────────────────────────────────
// STANDARD GAPS (For flexbox gap property)
// ─────────────────────────────────────────────────
export const gaps = {
  xs: spacing.xs,          // 4
  sm: spacing.sm,          // 8
  md: spacing.md,          // 12
  lg: spacing.lg,          // 16
  xl: spacing.xl,          // 20
  section: spacing.xxl,    // 24
  card: spacing.xxxl,      // 32
};

// ─────────────────────────────────────────────────
// PADDING STANDARDS (Horizontal & Vertical)
// ─────────────────────────────────────────────────
export const padding = {
  screenHorizontal: spacing.lg,     // 16
  screenVertical: spacing.lg,       // 16
  card: spacing.xxxl,               // 32
  section: spacing.xxl,             // 24
  input: spacing.lg,                // 16
  button: spacing.lg,               // 16
  component: spacing.md,            // 12
};

// ─────────────────────────────────────────────────
// MARGIN STANDARDS
// ─────────────────────────────────────────────────
export const margins = {
  section: spacing.xxl,              // 24
  card: spacing.xl,                  // 20
  component: spacing.md,             // 12
  small: spacing.sm,                 // 8
};

// ─────────────────────────────────────────────────
// HEADER & STATUS BAR
// ─────────────────────────────────────────────────
export const HEADER_HEIGHT = scale(64);
export const STATUS_BAR_HEIGHT = 0; // SafeAreaView handles this

// ─────────────────────────────────────────────────
// BOTTOM NAVIGATION
// ─────────────────────────────────────────────────
export const BOTTOM_NAV_HEIGHT = scale(80);

// ─────────────────────────────────────────────────
// FAB (Floating Action Button)
// ─────────────────────────────────────────────────
export const FAB_HEIGHT = scale(56);
export const FAB_X_MARGIN = spacing.xxl;
export const FAB_BOTTOM_MARGIN = scale(100);

// ─────────────────────────────────────────────────
// STANDARD CONTAINER PADDING (responsive)
// ─────────────────────────────────────────────────
export const CONTAINER_PADDING = padding.screenHorizontal;

// Legacy exports for backward compatibility
export const SECTION_MARGIN = margins.section;
export const CARD_PADDING = padding.card;
export const INPUT_PADDING = padding.input;

// ─────────────────────────────────────────────────
// TYPOGRAPHY SIZES
// ─────────────────────────────────────────────────
export const FONT_SIZES = {
  xs: getResponsiveFontSize(12),
  sm: getResponsiveFontSize(14),
  base: getResponsiveFontSize(16),
  lg: getResponsiveFontSize(18),
  xl: getResponsiveFontSize(20),
  xxl: getResponsiveFontSize(24),
  xxxl: getResponsiveFontSize(30),
  huge: getResponsiveFontSize(40),
};

// ─────────────────────────────────────────────────
// ICON SIZES
// ─────────────────────────────────────────────────
export const ICON_SIZES = {
  xs: scale(16),
  sm: scale(20),
  md: scale(24),
  lg: scale(32),
  xl: scale(40),
};

// ─────────────────────────────────────────────────
// BUTTON SIZES & STYLES
// ─────────────────────────────────────────────────
export const BUTTON_HEIGHT = scale(56);
export const BUTTON_HEIGHT_SM = scale(44);
export const BUTTON_PADDING_H = padding.button;
export const BUTTON_PADDING_V = spacing.lg;

// ─────────────────────────────────────────────────
// INPUT & FORM SIZES
// ─────────────────────────────────────────────────
export const INPUT_HEIGHT = scale(56);
export const INPUT_HEIGHT_SM = scale(44);
export const INPUT_PADDING_H = padding.input;
export const INPUT_PADDING_V = spacing.lg;

// ─────────────────────────────────────────────────
// BORDER RADIUS SYSTEM
// ─────────────────────────────────────────────────
export const borderRadius = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  card: moderateScale(24),
  button: moderateScale(12),
  input: moderateScale(12),
  avatar: moderateScale(999), // Fully rounded
};

// ─────────────────────────────────────────────────
// CARD & COMPONENT DIMENSIONS
// ─────────────────────────────────────────────────
export const CARD_MIN_HEIGHT = scale(200);
export const HERO_CARD_HEIGHT = scale(240);
export const PATIENT_CARD_HEIGHT = scale(140);

// ─────────────────────────────────────────────────
// PROFILE & AVATAR SIZES
// ─────────────────────────────────────────────────
export const AVATAR_SIZE_LG = scale(96);
export const AVATAR_SIZE_MD = scale(48);
export const AVATAR_SIZE_SM = scale(32);

// ─────────────────────────────────────────────────
// COMMON ALIGNMENT & FLEXBOX PRESETS
// ─────────────────────────────────────────────────
export const layouts = {
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  columnCenter: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
};
export const AVATAR_BORDER_WIDTH = scale(2);

// ─────────────────────────────────────────────────
// INPUT FIELD SIZES
// ─────────────────────────────────────────────────
//export const INPUT_HEIGHT = scale(56);
export const INPUT_FONT_SIZE = getResponsiveFontSize(16);
export const INPUT_ICON_SIZE = scale(18);

// ─────────────────────────────────────────────────
// SPACING PAIRS (horizontal & vertical)
// ─────────────────────────────────────────────────
export const CARD_SPACING = {
  horizontal: CONTAINER_PADDING,
  vertical: scale(16),
};

export const ELEMENT_SPACING = {
  horizontal: scale(8),
  vertical: scale(12),
};

// ─────────────────────────────────────────────────
// DIMENSIONS
// ─────────────────────────────────────────────────
export const WINDOW_WIDTH = screenWidth;
export const WINDOW_HEIGHT = screenHeight;

// Calculate available height (minus header and bottom nav)
export const SCROLL_VIEW_HEIGHT = WINDOW_HEIGHT - HEADER_HEIGHT - BOTTOM_NAV_HEIGHT;

// ─────────────────────────────────────────────────
// GET RESPONSIVE VALUES (Dynamic based on screen)
// ─────────────────────────────────────────────────

/**
 * Get responsive line height for typography
 */
export const getLineHeight = (fontSize: number): number => {
  return fontSize * 1.5;
};

/**
 * Get responsive shadow elevation for cards
 */
export const getCardElevation = (): number => {
  if (screenWidth < 380) {
    return 2;
  } else if (screenWidth < 768) {
    return 2;
  } else {
    return 1;
  }
};

/**
 * Get responsive border radius
 */
export const getBorderRadius = (baseRadius: number): number => {
  return moderateScale(baseRadius, 0.3);
};

/**
 * Get gap between flex items
 */
export const getFlexGap = (baseGap: number = 12): number => {
  return moderateScale(baseGap, 0.5);
};

/**
 * Get responsive list item height
 */
export const getListItemHeight = (): number => {
  if (screenWidth < 380) {
    return scale(120);
  } else {
    return scale(140);
  }
};
