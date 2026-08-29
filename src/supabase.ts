import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabasePublicKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  || '';

export const supabase = createClient(supabaseUrl, supabasePublicKey, {
  auth: {
    // Browsers use Supabase's localStorage adapter. Native Expo builds need
    // the existing AsyncStorage dependency to survive application restarts.
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    // Web can consume confirmation/auth parameters after a redirect. Native
    // OAuth browser/deep-link finalization is intentionally deferred.
    detectSessionInUrl: Platform.OS === 'web',
  },
});
