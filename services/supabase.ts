import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zmbsnhlvjjaaqyijuzhf.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptYnNuaGx2amphYXF5aWp1emhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTUwNjEsImV4cCI6MjA4OTk5MTA2MX0.JZomV_wntAe0OtFr5oqVyfMxpB6pL3DBN-lOS-AUmjI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})

// Database tables referenced:
// - patients: id, name, gender, dob, created_at, user_id
// - radiographs: id, patient_id, image_url, uploaded_at, user_id
// - analyses: id, patient_id, stages (JSON), maturity_score, dental_age, user_id

/**
 * Service to sync an offline queue of actions to Supabase.
 * For offline support, users can wrap Supabase calls in a retry logic that stores locally.
 */
export const syncOfflineData = async () => {
    // Basic stub for syncing offline data saved in AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const offlineKeys = keys.filter(k => k.startsWith('offline_action_'));
    if (offlineKeys.length === 0) return;

    for (const key of offlineKeys) {
        try {
            const actionStr = await AsyncStorage.getItem(key);
            if (actionStr) {
                const action = JSON.parse(actionStr);
                // Based on action.type, re-execute the supabase call
                // Example: 'insert_patient', 'upload_image'
                await AsyncStorage.removeItem(key);
            }
        } catch (e) {
            console.error('Error syncing offline data:', e);
        }
    }
}
