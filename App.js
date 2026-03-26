/**
 * OPG Age Calculator — React Native App
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

import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import XRayAnalysisScreen from './screens/XRayAnalysisScreen';
import StageClassificationScreen from './screens/StageClassificationScreen';
import ResultsDashboardScreen from './screens/ResultsDashboardScreen';
import SettingsScreen from './screens/SettingsScreen';

import { isNetworkConnected } from './services/expo/network';
import { syncOfflineData } from './services/supabase';
import AuthProvider from './provider/AuthProvider';
import QueryProvider from './provider/QueryProvider';

const Stack = createNativeStackNavigator();

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

  return (
    <AuthProvider>
      <QueryProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
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
