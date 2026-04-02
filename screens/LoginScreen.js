import React, { useState } from 'react';
import {  View,  Text,  TextInput,  TouchableOpacity,  ScrollView,  StyleSheet,
  StatusBar,  Image,} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, shadows, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { scale, getResponsiveFontSize, moderateScale } from '../utils/responsive';
import { 
  FONT_SIZES, 
  CONTAINER_PADDING, 
  HEADER_HEIGHT, 
  ICON_SIZES,
  spacing as layoutSpacing,
  padding as layoutPadding,
  gaps,
  borderRadius,
} from '../constants/layout';

// Asset URLs from Figma (valid for 7 days)
const ASSETS = {
  toothIcon: 'https://www.figma.com/api/mcp/asset/49d306fa-08c4-463e-bc96-c5d169afefaa',
  emailIcon: 'https://www.figma.com/api/mcp/asset/1c1b2e53-3e5e-49b2-bb70-a787ed7ea3b4',
  lockIcon: 'https://www.figma.com/api/mcp/asset/358a9777-fbb8-4acf-a6d7-13df5b024663',
  eyeIcon: 'https://www.figma.com/api/mcp/asset/d74e0d06-2e09-4a90-82a4-859ff8b10c62',
  arrowIcon: 'https://www.figma.com/api/mcp/asset/78c461cf-e3ce-40e2-bf40-3afcccbb51a2',
};

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      navigation?.replace('Home');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bgScreen} />

      {/* Header bar */}
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <Image source={{ uri: ASSETS.toothIcon }} style={styles.brandIcon} />
          <Text style={styles.brandName}>DentAge</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Login Card */}
        <View style={styles.card}>
          {/* Brand & Welcome */}
          <View style={styles.welcomeSection}>
            <View style={styles.brandRow}>
              <Image source={{ uri: ASSETS.toothIcon }} style={styles.cardBrandIcon} />
              <Text style={styles.cardBrandName}>DentAge</Text>
            </View>
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtitle}>
              Please enter your clinical credentials{'\n'}to continue.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {errorMsg ? <Text style={{color: 'red', marginBottom: 8}}>{errorMsg}</Text> : null}
            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Image source={{ uri: ASSETS.emailIcon }} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="clinician@sanctuary.com"
                  placeholderTextColor={colors.textPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotLink}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Image source={{ uri: ASSETS.lockIcon }} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 48 }]}
                  placeholder="••••••••••••"
                  placeholderTextColor={colors.textPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Image source={{ uri: ASSETS.eyeIcon }} style={styles.eyeIcon} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Device */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setRememberDevice(!rememberDevice)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberDevice && styles.checkboxActive]} />
              <Text style={styles.checkboxLabel}>Trust this device for 30 days</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.85}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>{loading ? 'Logging in...' : 'Login'}</Text>
              <Image source={{ uri: ASSETS.arrowIcon }} style={styles.arrowIcon} />
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>New User ? </Text>
              <TouchableOpacity onPress={() => navigation?.navigate('SignUp')}>
                <Text style={styles.signupLink}>Create an Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerCopy}>
            © 2024 Clinical Sanctuary Dental Systems.{'\n'}Precision Diagnostic Tool.
          </Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgScreen,
  },
  header: {
    height: HEADER_HEIGHT,
    paddingHorizontal: layoutPadding.screenHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247,250,253,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
  },
  brandIcon: {
    width: ICON_SIZES.sm,
    height: ICON_SIZES.sm,
    resizeMode: 'contain',
  },
  brandName: {
    fontSize: FONT_SIZES.base,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: CONTAINER_PADDING,
    paddingTop: layoutSpacing.xxl,
    paddingBottom: layoutSpacing.xxxl,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.card,
    padding: layoutPadding.card,
    ...shadows.card,
  },
  welcomeSection: {
    marginBottom: layoutSpacing.xxxl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.sm,
    marginBottom: layoutSpacing.xl,
  },
  cardBrandIcon: {
    width: scale(22),
    height: scale(22),
    resizeMode: 'contain',
  },
  cardBrandName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  welcomeTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: layoutSpacing.md,
    letterSpacing: -0.5,
    lineHeight: FONT_SIZES.xxxl * 1.2,
  },
  welcomeSubtitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: FONT_SIZES.base * 1.5,
  },
  form: {
    gap: layoutSpacing.lg,
  },
  fieldGroup: {
    gap: layoutSpacing.sm,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: layoutSpacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotLink: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    color: colors.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: borderRadius.input,
    paddingVertical: layoutSpacing.lg,
    paddingHorizontal: layoutSpacing.lg,
    position: 'relative',
  },
  inputIcon: {
    width: scale(17),
    height: scale(17),
    resizeMode: 'contain',
    marginRight: layoutSpacing.md,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontWeight: '400',
    color: colors.textPrimary,
    padding: 0,
  },
  eyeButton: {
    position: 'absolute',
    right: layoutSpacing.lg,
    padding: layoutSpacing.sm,
  },
  eyeIcon: {
    width: scale(18),
    height: scale(13),
    resizeMode: 'contain',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layoutSpacing.md,
    marginTop: layoutSpacing.md,
  },
  checkbox: {
    width: scale(20),
    height: scale(20),
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgInput,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.button,
    paddingVertical: layoutSpacing.lg,
    gap: layoutSpacing.sm,
    marginTop: layoutSpacing.md,
    ...shadows.button,
  },
  loginButtonText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '700',
    color: colors.white,
  },
  arrowIcon: {
    width: scale(13),
    height: scale(13),
    resizeMode: 'contain',
    tintColor: colors.white,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: layoutSpacing.lg,
  },
  signupText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    marginTop: layoutSpacing.xxl,
    backgroundColor: '#f1f4f7',
    borderRadius: borderRadius.button,
    padding: layoutSpacing.xxl,
    alignItems: 'center',
    gap: layoutSpacing.md,
  },
  footerCopy: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '400',
    color: colors.textDisabled,
    textAlign: 'center',
    lineHeight: FONT_SIZES.xs * 1.5,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: layoutSpacing.xxl,
  },
  footerLink: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '400',
    color: colors.textDisabled,
    opacity: 0.8,
  },
});
