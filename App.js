/**
 * DentAge — React Native App
 *
 * Navigation setup using React Navigation v6.
 *
 * Install dependencies:
 *   npm install @react-navigation/native @react-navigation/native-stack
 *   npm install react-native-screens react-native-safe-area-context
 *
 * For Expo:
 *   npx expo install react-native-screens react-native-safe-area-context
 *   npm install @react-navigation/native @react-navigation/native-stack
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Linking, Button } from 'react-native';

const openWebsite = async () => {
  const url = 'https://reactnative.dev';
  // Check if the device can open the URL
  const supported = await Linking.canOpenURL(url);

  if (supported) {
    await Linking.openURL(url);
  } else {
    console.error(`Don't know how to open this URL: ${url}`);
  }
};
// ... in your component render
<Button title="Visit React Native Docs" onPress={openWebsite} />

import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import XRayAnalysisScreen from './screens/XRayAnalysisScreen';
import StageClassificationScreen from './screens/StageClassificationScreen';
import ResultsDashboardScreen from './screens/ResultsDashboardScreen';
import SettingsScreen from './screens/SettingsScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

import { isNetworkConnected } from './services/expo/network';
import { syncOfflineData } from './services/supabase';
import AuthProvider from './provider/AuthProvider';
import QueryProvider from './provider/QueryProvider';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import DeleteAccountScreen from './screens/DeleteAccountScreen';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['app://'],
  config: {
    screens: {
      ForgotPasswordScreen: 'reset-password',
      Login: 'login',
      SignUp: 'signup',
      Home: 'home',
    },
  },
};

export default function App() {
  React.useEffect(() => {
    const initializeApp = async () => {
      const isOnline = await isNetworkConnected();
      if (isOnline) {
        console.log("Network online, syncing offline data...");
        await syncOfflineData();
      }
    };
    initializeApp();
  }, []);

  React.useEffect(() => {
    const handleDeepLink = async (url) => {
      if (!url) return;

      const hash = url.split('#')[1];
      if (!hash) return;

      const params = Object.fromEntries(
        hash.split('&').map((param) => param.split('='))
      );

      const access_token = params.access_token;
      const refresh_token = params.refresh_token;

      if (access_token && refresh_token) {
        await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
      }
    };

    Linking.getInitialURL().then(handleDeepLink);

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <QueryProvider>
        <NavigationContainer linking={linking}>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
            <Stack.Screen name="DeleteAccountScreen" component={DeleteAccountScreen} />
            <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="XRayAnalysis" component={XRayAnalysisScreen} />
            <Stack.Screen name="StageClassification" component={StageClassificationScreen} />
            <Stack.Screen name="Results" component={ResultsDashboardScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </QueryProvider>
    </AuthProvider>
  );
}
