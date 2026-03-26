import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../theme';
import Toast from 'react-native-toast-message';
import { supabase } from '../services/supabase';

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
    console.log(email + " " + password);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    console.log(error);
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
          <Text style={styles.brandName}>OPG Age Calculator</Text>
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
              <Text style={styles.cardBrandName}>OPG Age Calculator</Text>
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
    height: 64,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(247,250,253,0.8)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: 32,
    ...shadows.card,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  cardBrandIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  cardBrandName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 16,
    position: 'relative',
  },
  inputIcon: {
    width: 17,
    height: 17,
    resizeMode: 'contain',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: colors.textPrimary,
    padding: 0,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  eyeIcon: {
    width: 18,
    height: 13,
    resizeMode: 'contain',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bgInput,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
    ...shadows.button,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  arrowIcon: {
    width: 13,
    height: 13,
    resizeMode: 'contain',
    tintColor: colors.white,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  footer: {
    marginTop: 24,
    backgroundColor: '#f1f4f7',
    borderRadius: radius.md,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  footerCopy: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textDisabled,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 20,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textDisabled,
    opacity: 0.8,
  },
});
