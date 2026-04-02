import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const envUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabaseUrl = (envUrl && envUrl !== 'undefined' && typeof envUrl === 'string' && envUrl.startsWith('http')) 
  ? envUrl 
  : 'https://uzpjsdhmjpruxmwmcogw.supabase.co';
export const supabaseAnonKey = (envKey && envKey !== 'undefined' && typeof envKey === 'string') 
  ? envKey 
  : 'sb_publishable_L3mfN8Ae7JAu8gafCQ5_9A_QOe_keac';

if (!envUrl || !envKey) {
  console.warn('Supabase environment variables are missing. Using default demo project. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment settings for your own project.');
}

// Custom fetch to handle "Failed to fetch" globally (e.g., paused project)
const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  try {
    return await fetch(url, options);
  } catch (error: any) {
    const isNetworkError = error.message === 'Failed to fetch' || error.name === 'TypeError';
    
    if (isNetworkError) {
      console.error('Supabase connection error: The project might be paused, the URL is incorrect, or there is a network issue.');
      
      if (typeof window !== 'undefined' && !window.sessionStorage.getItem('supabase_fetch_error_shown')) {
        toast.error(
          'Erreur de connexion à la base de données. Veuillez vérifier que votre projet Supabase n\'est pas en pause et que vos variables d\'environnement sont correctement configurées.', 
          {
            duration: 8000,
            id: 'supabase-fetch-error'
          }
        );
        window.sessionStorage.setItem('supabase_fetch_error_shown', 'true');
      }
    }
    throw error;
  }
};

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  global: {
    fetch: customFetch,
  },
});
