import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase not configured");
}

const customStorage = {
  getItem: (key: string) => {
    const isRememberMe = window.localStorage.getItem('remember_me') === 'true';
    return isRememberMe 
      ? window.localStorage.getItem(key) 
      : window.sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    const isRememberMe = window.localStorage.getItem('remember_me') === 'true';
    if (isRememberMe) {
      window.localStorage.setItem(key, value);
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
      window.localStorage.removeItem(key);
    }
  },
  removeItem: (key: string) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  }
};

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder',
  {
    auth: {
      storage: customStorage,
    }
  }
);
