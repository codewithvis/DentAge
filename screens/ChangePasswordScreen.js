import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';

export default function ChangePasswordScreen({ navigation }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user?.email) {
      setLoading(false);
      Alert.alert('Error', 'Unable to verify user');
      return;
    }

    const email = userData.user.email;

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (signInError) {
      setLoading(false);
      Alert.alert('Error', 'Current password is incorrect');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setLoading(false);
      Alert.alert('Error', updateError.message);
      return;
    }

    await supabase.auth.signOut();

    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Change Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Current Password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="New Password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />

        <TouchableOpacity style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading}>
          <Text style={styles.buttonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  wrapper: {
    padding: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  forgotBtn: {
    marginBottom: 20,
  },
  forgotText: {
    color: '#666',
  },
  button: {
    height: 48,
    backgroundColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});