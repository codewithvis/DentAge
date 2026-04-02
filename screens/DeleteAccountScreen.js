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

export default function DeleteAccountScreen({ navigation }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    Alert.alert(
      'Delete Account',
      'This action is irreversible. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);

            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (userError || !userData?.user?.email || !userData?.user?.id) {
              setLoading(false);
              Alert.alert('Error', 'Unable to verify user');
              return;
            }

            const email = userData.user.email;
            const userId = userData.user.id;

            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (signInError) {
              setLoading(false);
              Alert.alert('Error', 'Incorrect password');
              return;
            }

            const { error: profileDeleteError } = await supabase
              .from('profiles')
              .delete()
              .eq('id', userId);

            if (profileDeleteError) {
              setLoading(false);
              Alert.alert('Error', profileDeleteError.message);
              return;
            }

            const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);

            if (deleteUserError) {
              setLoading(false);
              Alert.alert('Error', 'Account deletion failed');
              return;
            }

            await supabase.auth.signOut();

            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });

            setLoading(false);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Delete Account</Text>

        <Text style={styles.warning}>
          This action is irreversible. All your data will be permanently deleted.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleDeleteAccount}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Confirm Delete</Text>
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
    marginBottom: 10,
  },
  warning: {
    fontSize: 14,
    color: '#b00020',
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  button: {
    height: 48,
    backgroundColor: '#b00020',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});