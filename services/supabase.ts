import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Missing Supabase credentials in .env file. Please check your setup.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})

// Database tables referenced:
// - patients: id, name, date_of_birth, notes, created_at, updated_at
// - analyses: id, case_id, patient_id, image_url, dental_age, ai_confidence, maturity_score, age_range, tooth_development_stage, analysis, created_at, user_id

/**
 * Service to sync an offline queue of actions to Supabase.
 * For offline support, users can wrap Supabase calls in a retry logic that stores locally.
 */
export const enqueueOfflineAction = async (action: any) => {
    try {
        const key = `offline_action_${Date.now()}`;
        await AsyncStorage.setItem(key, JSON.stringify(action));
    } catch (e) {
        console.error('Error queuing offline action:', e);
    }
};

export const syncOfflineData = async () => {
    // Basic stub for syncing offline data saved in AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    const offlineKeys = keys.filter(k => k.startsWith('offline_action_'));
    if (offlineKeys.length === 0) return;

    for (const key of offlineKeys) {
        try {
            const actionStr = await AsyncStorage.getItem(key);
            if (!actionStr) continue;

            const action = JSON.parse(actionStr);
            console.log('Processing offline action', key, action.type);

            if (action.type === 'radiograph_upload' || action.type === 'radiograph_upload_and_analyze') {
                const { base64Data, fileName, fileExt, patient_id } = action.payload;
                let blob;
                if (base64Data) {
                    // Use stored base64 data from offline queue
                    const binaryString = atob(base64Data);
                    const arrayBuffer = new ArrayBuffer(binaryString.length);
                    const view = new Uint8Array(arrayBuffer);
                    for (let i = 0; i < binaryString.length; i++) {
                        view[i] = binaryString.charCodeAt(i);
                    }
                    blob = arrayBuffer;
                } else {
                    // Old actions stored fileUri instead of base64Data.
                    // Temp ImagePicker cache files are ephemeral and get cleaned up by the OS,
                    // so these actions are permanently unrecoverable. Discard them.
                    console.warn(`Offline sync: discarding unrecoverable action ${key} — no base64Data and temp file no longer exists.`);
                    await AsyncStorage.removeItem(key);
                    continue;
                }

                const { error: uploadError } = await supabase.storage
                    .from('opg-images')
                    .upload(fileName, blob, {
                        contentType: `image/${fileExt}`,
                        upsert: true,
                    });
                if (uploadError) {
                    console.error('Offline upload: supabase storage error', uploadError);
                    continue;
                }

                const { data: publicData } = supabase.storage.from('opg-images').getPublicUrl(fileName);

                // If it's upload_and_analyze, try to analyze now
                if (action.type === 'radiograph_upload_and_analyze') {
                    const { base64Data } = action.payload;
                    try {
                        // Get current user for the function call
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) {
                            console.error('Offline sync: user not authenticated for analysis');
                            continue;
                        }

                        const { analyzeOPG } = await import('../api/analyze');
                        const aiData = await analyzeOPG(base64Data, user.id);
                        console.log("Offline AI Analysis Successful:", aiData);
                    } catch (aiErr) {
                        console.error('Offline AI analysis failed:', aiErr.message || aiErr);
                        
                        // If it's an authorization/JWT error or a 404 not found, it is unrecoverable.
                        // We must discard the task so it doesn't infinitely loop on every startup.
                        if (aiErr.message?.includes('Invalid JWT') || aiErr.message?.includes('unauthenticated') || aiErr.message?.includes('401') || aiErr.message?.includes('404') || aiErr.message?.includes('Not Found')) {
                            console.warn(`Offline sync: discarding action ${key} due to unrecoverable error (e.g. 401 or 404).`);
                            await AsyncStorage.removeItem(key);
                            continue;
                        }

                        // For other transient errors (like network), keep key for later
                        continue;
                    }
                }

                await AsyncStorage.removeItem(key);
            } else if (action.type === 'saveAnalysis') {
                const { analysisData } = action.payload;
                try {
                    // Get current user for RLS
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                        console.error('Offline sync: user not authenticated');
                        continue;
                    }

                    const analysisWithUser = {
                        ...analysisData,
                        user_id: user.id
                    };

                    const { error: dbError } = await supabase.from('analyses').insert(analysisWithUser);
                    if (dbError) {
                        console.error('Offline saveAnalysis insert failed', dbError);
                        continue;
                    }

                    await AsyncStorage.removeItem(key);
                } catch (err) {
                    console.error('Offline saveAnalysis exception', err);
                    continue;
                }
            } else {
                console.warn('Unknown offline action type:', action.type);
                await AsyncStorage.removeItem(key);
            }
        } catch (e) {
            console.error('Error syncing offline data:', e);
        }
    }
};
