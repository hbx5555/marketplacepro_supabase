import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const mockAuth = {
  currentUser: {
    uid: 'user_123',
    email: 'sarah@example.com',
    emailVerified: true,
    isAnonymous: false,
    tenantId: null,
    providerData: []
  }
};

export const uploadImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('item-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('Upload error:', error);
    throw error;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('item-images')
    .getPublicUrl(fileName);
  
  return publicUrl;
};

export const uploadImageFromBase64 = async (base64Data: string, mimeType: string): Promise<string> => {
  const base64Response = await fetch(`data:${mimeType};base64,${base64Data}`);
  const blob = await base64Response.blob();
  
  const fileExt = mimeType.split('/')[1];
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('item-images')
    .upload(fileName, blob, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('Upload error:', error);
    throw error;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('item-images')
    .getPublicUrl(fileName);
  
  return publicUrl;
};
