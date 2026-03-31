import React, { useState, useEffect, useRef } from 'react';
import { supabase, mockAuth, uploadImageFromBase64 } from './supabase';
import { User, Item } from './types';
import imageCompression from 'browser-image-compression';
import { GoogleGenAI } from '@google/genai';
// ... rest of imports

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface DatabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleDatabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: DatabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: mockAuth.currentUser?.uid,
      email: mockAuth.currentUser?.email,
      emailVerified: mockAuth.currentUser?.emailVerified,
      isAnonymous: mockAuth.currentUser?.isAnonymous,
      tenantId: mockAuth.currentUser?.tenantId,
      providerInfo: mockAuth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Database Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    outline: 'border border-divider text-zinc-700 hover:bg-zinc-50',
    ghost: 'text-zinc-600 hover:bg-zinc-100',
    success: 'bg-success text-zinc-900 hover:bg-success/90',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };
  return (
    <button 
      className={cn(
        'rounded-xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

class ErrorBoundary extends React.Component<any, any> {
  props: any;
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let message = "משהו השתבש.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "{}");
        if (parsed.error) message = `שגיאת Firestore: ${parsed.error} (${parsed.operationType} on ${parsed.path})`;
      } catch {
        message = this.state.error?.message || message;
      }
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">שגיאה</h2>
          <p className="text-zinc-600 mb-6">{message}</p>
          <Button onClick={() => window.location.reload()}>טען מחדש</Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

// ... rest of the file
import { 
  ShoppingBag, 
  Store, 
  Plus, 
  ArrowLeft, 
  MoreVertical, 
  Star, 
  MapPin, 
  Eye, 
  Heart, 
  Camera, 
  ChevronRight,
  ChevronLeft,
  ArrowRight, 
  Settings, 
  Search, 
  Bell, 
  Home, 
  MessageCircle, 
  User as UserIcon,
  CheckCircle2,
  Clock,
  ChevronDown,
  Share2,
  Image,
  Trash2,
  Sparkles,
  Loader2,
  Book,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Mock Data & Constants ---
const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

// LocalStorage key for user session
const AUTH_STORAGE_KEY = 'promarket_user';

const CATEGORIES = [
  { id: 'electronics', label: 'אלקטרוניקה', icon: '⚡', color: 'bg-amber-100 text-amber-700' },
  { id: 'furniture', label: 'ריהוט', icon: '🪑', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'fashion', label: 'אופנה', icon: '👗', color: 'bg-pink-100 text-pink-700' },
  { id: 'gaming', label: 'גיימינג', icon: '🎮', color: 'bg-blue-100 text-blue-700' },
  { id: 'jewelry', label: 'תכשיטים', icon: '💎', color: 'bg-purple-100 text-purple-700' },
  { id: 'housewares', label: 'כלי בית', icon: '🍽️', color: 'bg-orange-100 text-orange-700' },
];

const CONDITIONS = ['כמו חדש', 'מצוין', 'טוב', 'סביר'];

// --- Components ---

const Card = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn('bg-white rounded-2xl border border-divider shadow-sm overflow-hidden', className)}
  >
    {children}
  </div>
);

// --- Main App ---

export default function App() {
  return (
    <ErrorBoundary>
      <MarketplaceApp />
    </ErrorBoundary>
  );
}

const getApiKey = async () => {
  const dummyKeys = ['MY_GEMINI_API_KEY', 'your_api_key_here', 'undefined', 'null'];
  
  const isValidKey = (key: any) => {
    return key && typeof key === 'string' && key.trim() !== '' && !dummyKeys.includes(key);
  };

  // 1. Check global window.process.env FIRST (for runtime injection via openSelectKey)
  try {
    const win = window as any;
    if (win.process && win.process.env) {
      if (isValidKey(win.process.env.API_KEY)) return win.process.env.API_KEY;
      if (isValidKey(win.process.env.GEMINI_API_KEY)) return win.process.env.GEMINI_API_KEY;
    }
  } catch (e) {}

  // 2. Check Vite's import.meta.env
  if (isValidKey(import.meta.env.VITE_GEMINI_API_KEY)) return import.meta.env.VITE_GEMINI_API_KEY;
  if (isValidKey(import.meta.env.VITE_API_KEY)) return import.meta.env.VITE_API_KEY;
  
  // 3. Check statically replaced process.env
  try {
    if (isValidKey(process.env.GEMINI_API_KEY)) return process.env.GEMINI_API_KEY;
  } catch (e) {}
  try {
    if (isValidKey(process.env.API_KEY)) return process.env.API_KEY;
  } catch (e) {}

  // 4. Fetch from backend (for Cloud Run runtime env vars)
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (isValidKey(data.geminiApiKey)) return data.geminiApiKey;
    }
  } catch (e) {
    console.error("Failed to fetch API key from backend", e);
  }

  return null;
};

function MarketplaceApp() {
  const [view, setView] = useState<'auth' | 'entrance' | 'buyer' | 'seller' | 'add-item' | 'item-details' | 'settings' | 'account-settings' | 'help'>('auth');
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [userMode, setUserMode] = useState<'buyer' | 'seller'>('buyer');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [originalImages, setOriginalImages] = useState<string[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string>('כמו חדש');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerSuccessModalOpen, setOfferSuccessModalOpen] = useState(false);
  const [offerWasCanceled, setOfferWasCanceled] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [buyerOffers, setBuyerOffers] = useState<Set<string>>(new Set());
  const [sellerItemsWithOffers, setSellerItemsWithOffers] = useState<Set<string>>(new Set());
  const [buyerOffersDetails, setBuyerOffersDetails] = useState<Array<any>>([]);
  const [sellerOffersDetails, setSellerOffersDetails] = useState<Array<any>>([]);
  const [offersListMode, setOffersListMode] = useState<'buyer' | 'seller'>('buyer');
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [searchingPrice, setSearchingPrice] = useState(false);
  const [priceSearchResults, setPriceSearchResults] = useState<Array<{site: string, price: number, currency: string}>>([]);
  const [searchOptimizedText, setSearchOptimizedText] = useState<{brand: string, modelName: string, searchQuery: string} | null>(null);
  const [currentSearchingSite, setCurrentSearchingSite] = useState<string>('');
  const [nameMismatchModal, setNameMismatchModal] = useState<{open: boolean, oldName: string, newName: string, userData: any} | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{open: boolean, itemId: string} | null>(null);
  const [selfOfferErrorModal, setSelfOfferErrorModal] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Authentication check on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          
          // Verify user still exists in database
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userData.userId)
            .single();
          
          if (data && !error) {
            const mappedUser: User = {
              id: data.id,
              name: data.name,
              phone_number: data.phone_number,
              email: data.email || '',
              photoURL: data.photo_url || DEFAULT_AVATAR,
              location: data.location || '',
              rating: data.rating || 0,
              earned: data.earned || 0,
              activeListings: data.active_listings || 0,
              totalListings: data.total_listings || 0,
              created_at: data.created_at,
              last_login: data.last_login
            };
            
            // Update last login
            await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', data.id);
            
            setCurrentUser(mappedUser);
            setIsAuthenticated(true);
            setView('entrance');
          } else {
            // User not found in DB, clear localStorage
            localStorage.removeItem(AUTH_STORAGE_KEY);
            setView('auth');
          }
        } else {
          setView('auth');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setView('auth');
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, []);

  // Authentication functions
  const handleLoginOrRegister = async (name: string, phoneNumber: string) => {
    try {
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();
      
      if (existingUser && !fetchError) {
        // User exists - check if name matches
        if (existingUser.name !== name) {
          // Name mismatch - show modal
          setNameMismatchModal({
            open: true,
            oldName: existingUser.name,
            newName: name,
            userData: existingUser
          });
          return { success: true, message: '' }; // Don't show alert, modal will handle it
        }
        
        // Name matches - login directly
        const mappedUser: User = {
          id: existingUser.id,
          name: existingUser.name,
          phone_number: existingUser.phone_number,
          email: existingUser.email || '',
          photoURL: existingUser.photo_url || DEFAULT_AVATAR,
          location: existingUser.location || '',
          rating: existingUser.rating || 0,
          earned: existingUser.earned || 0,
          activeListings: existingUser.active_listings || 0,
          totalListings: existingUser.total_listings || 0,
          created_at: existingUser.created_at,
          last_login: existingUser.last_login
        };
        
        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', existingUser.id);
        
        // Save to localStorage
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          userId: existingUser.id,
          phoneNumber: existingUser.phone_number,
          name: existingUser.name,
          lastLogin: new Date().toISOString()
        }));
        
        setCurrentUser(mappedUser);
        setIsAuthenticated(true);
        setView('entrance');
        
        return { success: true, message: 'התחברת בהצלחה!' };
      } else {
        // User doesn't exist - register
        const userId = crypto.randomUUID();
        const now = new Date().toISOString();
        
        const newUser = {
          id: userId,
          name: name,
          phone_number: phoneNumber,
          email: '',
          photo_url: DEFAULT_AVATAR,
          location: '',
          rating: 0,
          earned: 0,
          active_listings: 0,
          total_listings: 0,
          created_at: now,
          last_login: now
        };
        
        const { error: insertError } = await supabase
          .from('users')
          .insert([newUser]);
        
        if (insertError) throw insertError;
        
        const mappedUser: User = {
          id: userId,
          name: name,
          phone_number: phoneNumber,
          email: '',
          photoURL: DEFAULT_AVATAR,
          location: '',
          rating: 0,
          earned: 0,
          activeListings: 0,
          totalListings: 0,
          created_at: now,
          last_login: now
        };
        
        // Save to localStorage
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          userId: userId,
          phoneNumber: phoneNumber,
          name: name,
          lastLogin: now
        }));
        
        setCurrentUser(mappedUser);
        setIsAuthenticated(true);
        setView('entrance');
        
        return { success: true, message: 'נרשמת בהצלחה!' };
      }
    } catch (error) {
      console.error('Login/Register failed:', error);
      return { success: false, message: 'שגיאה בהתחברות. נסה שוב.' };
    }
  };

  const handleNameDecision = async (keepOld: boolean) => {
    if (!nameMismatchModal) return;
    
    const { userData, oldName, newName } = nameMismatchModal;
    const finalName = keepOld ? oldName : newName;
    
    try {
      // Update name in database if changing
      if (!keepOld) {
        await supabase
          .from('users')
          .update({ name: newName })
          .eq('id', userData.id);
        
        // Update seller details in items
        await updateSellerDetails(userData.id, newName, userData.photo_url || DEFAULT_AVATAR);
      }
      
      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);
      
      const mappedUser: User = {
        id: userData.id,
        name: finalName,
        phone_number: userData.phone_number,
        email: userData.email || '',
        photoURL: userData.photo_url || DEFAULT_AVATAR,
        location: userData.location || '',
        rating: userData.rating || 0,
        earned: userData.earned || 0,
        activeListings: userData.active_listings || 0,
        totalListings: userData.total_listings || 0,
        created_at: userData.created_at,
        last_login: userData.last_login
      };
      
      // Save to localStorage
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
        userId: userData.id,
        phoneNumber: userData.phone_number,
        name: finalName,
        lastLogin: new Date().toISOString()
      }));
      
      setCurrentUser(mappedUser);
      setIsAuthenticated(true);
      setNameMismatchModal(null);
      
      // Refresh items if name was changed
      if (!keepOld) {
        await fetchItems();
      }
      
      setView('entrance');
    } catch (error) {
      console.error('Error updating name:', error);
      alert('שגיאה בעדכון השם. נסה שוב.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setView('auth');
  };

  const CONDITION_COLORS: Record<string, string> = {
    'כמו חדש': 'bg-emerald-500 text-white border-emerald-500',
    'מצוין': 'bg-blue-500 text-white border-blue-500',
    'טוב': 'bg-amber-500 text-white border-amber-500',
    'סביר': 'bg-orange-500 text-white border-orange-500'
  };

  const handleAIEnhance = async () => {
    if (previewImages.length === 0) return;

    setIsEnhancing(true);
    try {
      const apiKey = await getApiKey();
      
      if (!apiKey) {
        throw new Error("מפתח API לא נמצא או שאינו חוקי. אנא ודא שהמפתח מוגדר בסביבה.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const lastImage = originalImages[originalImages.length - 1] || previewImages[previewImages.length - 1];
      
      const match = lastImage.match(/^data:(.*?);base64,(.*)$/);
      if (!match) {
        throw new Error(`Invalid image format. Expected data URI, got: ${lastImage.substring(0, 50)}...`);
      }
      
      const mimeType = match[1];
      const base64Data = match[2];

      const descPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: 'כתוב תיאור של פריט זה עבור רשומה באתר מסחר אלקטרוני בעברית. חשוב: התיאור חייב להיות בדיוק שני משפטים. אל תחרוג משני משפטים.',
            },
          ],
        },
      }).catch(err => {
        console.error("Description generation failed:", err);
        return null;
      });

      const titlePromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: 'תן שם קצר לפריט זה בעברית. חשוב: השם חייב להיות 4 מילים או פחות. רק את השם, ללא הסברים נוספים.',
            },
          ],
        },
      }).catch(err => {
        console.error("Title generation failed:", err);
        return null;
      });

      const searchTextPromise = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: 'Analyze this image and identify the exact product. Extract the following in JSON format: {"brand": "brand name", "modelName": "model name", "modelNumber": "model number if visible", "searchQuery": "optimized search query for Google Shopping"}. If you cannot identify specific details, provide your best estimate.',
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
        },
      }).catch(err => {
        console.error("Search text generation failed:", err);
        return null;
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: 'Make the item as if captured by pro photographer for an eCommerce site, as if it is on a clean white base',
            },
          ],
        },
      });

      const descResponse = await descPromise;
      if (descResponse && descResponse.text) {
        const descEl = document.getElementById('item-desc') as HTMLTextAreaElement;
        if (descEl) {
          descEl.value = descResponse.text;
        }
      }

      const titleResponse = await titlePromise;
      if (titleResponse && titleResponse.text) {
        const titleEl = document.getElementById('item-title') as HTMLInputElement;
        if (titleEl) {
          titleEl.value = titleResponse.text.trim();
        }
      }

      const searchTextResponse = await searchTextPromise;
      if (searchTextResponse && searchTextResponse.text) {
        try {
          const searchData = JSON.parse(searchTextResponse.text);
          setSearchOptimizedText(searchData);
        } catch (err) {
          console.error("Failed to parse search text JSON:", err);
        }
      }

      const parts = response.candidates?.[0]?.content?.parts || [];
      let foundImage = false;
      for (const part of parts) {
        if (part.inlineData) {
          foundImage = true;
          const newImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          
          // Compress the AI generated image to avoid exceeding Firestore limits
          try {
            const res = await fetch(newImageUrl);
            const blob = await res.blob();
            const file = new File([blob], "enhanced.png", { type: blob.type });
            const compressedFile = await imageCompression(file, {
              maxSizeMB: 0.1,
              maxWidthOrHeight: 600,
              useWebWorker: false,
            });
            
            await new Promise<void>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                setPreviewImages(prev => {
                  const newImages = [...prev];
                  newImages[newImages.length - 1] = reader.result as string;
                  return newImages;
                });
                resolve();
              };
              reader.onerror = reject;
              reader.readAsDataURL(compressedFile);
            });
          } catch (compressionError) {
            console.error("Failed to compress AI image, using original", compressionError);
            setPreviewImages(prev => {
              const newImages = [...prev];
              newImages[newImages.length - 1] = newImageUrl;
              return newImages;
            });
          }
          break;
        }
      }
      
      if (!foundImage) {
        const textPart = parts.find(p => p.text)?.text;
        throw new Error(`ה-AI לא החזיר תמונה. ${textPart ? 'תגובת ה-AI: ' + textPart : ''}`);
      }
    } catch (error: any) {
      console.error('AI Enhancement failed:', error);
      let errorMsg = 'Unknown error';
      if (error instanceof Error) {
        errorMsg = `${error.name}: ${error.message}\n${error.stack || ''}`;
      } else if (typeof error === 'object') {
        try {
          errorMsg = JSON.stringify(error, null, 2);
        } catch (e) {
          errorMsg = String(error);
        }
      } else {
        errorMsg = String(error);
      }
      
      if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('Requested entity was not found')) {
        console.error("API Key is invalid or expired.");
      }
      
      alert(`שיפור ה-AI נכשל.\n\nפרטים:\n${errorMsg.substring(0, 500)}`);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handlePriceSearch = async () => {
    if (!searchOptimizedText) {
      alert('אנא השתמש תחילה בשיפור AI כדי לזהות את המוצר');
      return;
    }

    setSearchingPrice(true);
    setPriceSearchResults([]);
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error("מפתח API לא נמצא או שאינו חוקי. אנא ודא שהמפתח מוגדר בסביבה.");
      }

      // Load retailers configuration
      const retailersResponse = await fetch('/retailers.json');
      const retailers = await retailersResponse.json();
      const enabledRetailers = retailers.filter((r: any) => r.enabled);
      
      // Build search query with site operators
      const targetSites = enabledRetailers.map((r: any) => `site:${r.domain}`);
      const siteQuery = targetSites.join(' OR ');
      const searchQuery = `"${searchOptimizedText.searchQuery}" (${siteQuery})`;

      const ai = new GoogleGenAI({ apiKey });
      
      // Show waiting message (no site cycling)
      setCurrentSearchingSite('המתן...');

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              text: `Search for this product and extract prices from Israeli retail websites: ${searchQuery}. 
              Return a JSON array with format: [{"site": "site name", "price": number, "currency": "ILS"}].
              Only include results with actual prices found.`
            }
          ],
        },
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        },
      });

      const results = JSON.parse(response.text || '[]');
      setPriceSearchResults(results);
      
      // Show completion message
      if (results.length > 0) {
        setCurrentSearchingSite('נמצאו תוצאות');
      } else {
        setCurrentSearchingSite('לא נמצאו תוצאות');
      }

      // Update price input with range or "no results"
      const priceInput = document.getElementById('item-price') as HTMLInputElement;
      if (priceInput) {
        if (results.length > 0) {
          const prices = results.map((r: any) => r.price).sort((a: number, b: number) => a - b);
          const minPrice = Math.floor(prices[0]);
          const maxPrice = Math.ceil(prices[prices.length - 1]);
          priceInput.value = minPrice === maxPrice ? `${minPrice}` : `${minPrice}-${maxPrice}`;
        } else {
          priceInput.value = 'לא נמצא';
        }
      }

      // Modal stays open - user must click button to close

    } catch (error: any) {
      console.error('Price search failed:', error);
      setCurrentSearchingSite('שגיאה בחיפוש');
      alert(`חיפוש מחיר נכשל.\n\nפרטים:\n${error.message || error}`);
      
      const priceInput = document.getElementById('item-price') as HTMLInputElement;
      if (priceInput) {
        priceInput.value = 'לא נמצא';
      }
    }
    // Note: searchingPrice stays true - modal stays open until user clicks button
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (previewImages.length >= 4) {
      alert("ניתן להעלות עד 4 תמונות.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    
    try {
      const options = {
        maxSizeMB: 0.1, // Reduced to 100KB to allow multiple images under 1MB total
        maxWidthOrHeight: 600,
        useWebWorker: false, // Disabled web worker to prevent hanging in iframes
      };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages(prev => [...prev, reader.result as string]);
        setOriginalImages(prev => [...prev, reader.result as string]);
        setIsCompressing(false);
      };
      reader.onerror = () => {
        console.error('Error reading compressed image');
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      setIsCompressing(false);
      alert('עיבוד התמונה נכשל. אנא נסה תמונה אחרת.');
    }
    
    // Clear input so the same file can be selected again
    e.target.value = '';
  };

  const fetchItems = async () => {
    try {
      setIsLoadingItems(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        // Map snake_case database columns to camelCase
        const mappedItems = data.map((item: any) => ({
          id: item.id,
          sellerId: item.seller_id,
          sellerName: item.seller_name,
          sellerPhoto: item.seller_photo,
          sellerLocation: item.seller_location,
          title: item.title,
          description: item.description,
          price: item.price,
          condition: item.condition,
          category: item.category,
          specifications: item.specifications,
          photoURL: item.photo_url,
          photoURLs: item.photo_urls,
          createdAt: item.created_at,
          views: item.views,
          likes: item.likes,
          status: item.status
        }));
        setItems(mappedItems as Item[]);
      }
    } catch (error) {
      handleDatabaseError(error, OperationType.LIST, 'items');
    } finally {
      setIsLoadingItems(false);
    }
  };

  const fetchBuyerOffers = async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('buyer_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        // Group by item_id and keep only the most recent offer per item
        const latestOffersMap = new Map();
        data.forEach((offer: any) => {
          if (!latestOffersMap.has(offer.item_id)) {
            latestOffersMap.set(offer.item_id, offer);
          }
        });
        
        const latestOffers = Array.from(latestOffersMap.values());
        const itemIds = new Set(latestOffers.map((offer: any) => offer.item_id));
        setBuyerOffers(itemIds);
        
        // Fetch item details for each latest offer
        const offersWithItems = await Promise.all(
          latestOffers.map(async (offer: any) => {
            const { data: itemData } = await supabase
              .from('items')
              .select('*')
              .eq('id', offer.item_id)
              .single();
            
            return {
              ...offer,
              item: itemData ? {
                id: itemData.id,
                title: itemData.title,
                photoURL: itemData.photo_url,
                photoURLs: itemData.photo_urls,
                price: itemData.price
              } : null
            };
          })
        );
        
        setBuyerOffersDetails(offersWithItems);
        
        // Store full offer data for later use
        const offersMap = new Map(latestOffers.map((offer: any) => [offer.item_id, offer]));
        (window as any).__buyerOffersData = offersMap;
      }
    } catch (error) {
      console.error('Error fetching buyer offers:', error);
    }
  };

  const fetchSellerOffers = async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('seller_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const itemIds = new Set(data.map((offer: any) => offer.item_id));
        setSellerItemsWithOffers(itemIds);
        
        // Fetch item details and buyer info for each offer
        const offersWithDetails = await Promise.all(
          data.map(async (offer: any) => {
            const { data: itemData } = await supabase
              .from('items')
              .select('*')
              .eq('id', offer.item_id)
              .single();
            
            const { data: buyerData } = await supabase
              .from('users')
              .select('name, photo_url')
              .eq('id', offer.buyer_id)
              .single();
            
            return {
              ...offer,
              item: itemData ? {
                id: itemData.id,
                title: itemData.title,
                photoURL: itemData.photo_url,
                photoURLs: itemData.photo_urls,
                price: itemData.price
              } : null,
              buyer: buyerData ? {
                name: buyerData.name,
                photoURL: buyerData.photo_url
              } : null
            };
          })
        );
        
        setSellerOffersDetails(offersWithDetails);
      }
    } catch (error) {
      console.error('Error fetching seller offers:', error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    
    fetchItems();
    fetchBuyerOffers();
    fetchSellerOffers();

    const itemsSubscription = supabase
      .channel('items_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'items' },
        () => { fetchItems(); }
      )
      .subscribe();

    const offersSubscription = supabase
      .channel('offers_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'offers' },
        () => { 
          fetchBuyerOffers();
          fetchSellerOffers();
        }
      )
      .subscribe();

    return () => {
      itemsSubscription.unsubscribe();
      offersSubscription.unsubscribe();
    };
  }, [currentUser?.id]);

  const handleSaveItem = async (itemData: Partial<Item>) => {
    setIsPublishing(true);
    setPublishError(null);
    try {
      // Use current previewImages state for the actual images to save
      const imagesToSave = previewImages.length > 0 ? previewImages : [itemData.photoURL || ''];
      
      // Map camelCase to snake_case for database
      const dbData: any = {};
      if (itemData.title) dbData.title = itemData.title;
      if (itemData.description) dbData.description = itemData.description;
      if (itemData.price !== undefined) dbData.price = itemData.price;
      if (itemData.condition) dbData.condition = itemData.condition;
      if (itemData.category) dbData.category = itemData.category;
      if (itemData.specifications) dbData.specifications = itemData.specifications;
      
      // Always use the current preview images
      dbData.photo_url = imagesToSave[0];
      dbData.photo_urls = imagesToSave;
      
      if (editingItem) {
        // Preserve seller information during updates
        const updateData = {
          ...dbData,
          seller_id: editingItem.sellerId,
          seller_name: editingItem.sellerName,
          seller_photo: editingItem.sellerPhoto,
          seller_location: editingItem.sellerLocation
        };
        
        const { error } = await supabase
          .from('items')
          .update(updateData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
      } else {
        if (!currentUser) {
          throw new Error('אנא התחבר תחילה');
        }
        const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const newItem = {
          ...dbData,
          id: itemId,
          seller_id: currentUser.id,
          seller_name: currentUser.name,
          seller_photo: currentUser.photoURL,
          seller_location: currentUser.location,
          created_at: new Date().toISOString(),
          views: 0,
          likes: 0,
          status: 'active'
        };
        
        const { error } = await supabase
          .from('items')
          .insert([newItem]);
        
        if (error) throw error;
      }
      
      // Refresh items list immediately
      await fetchItems();
      
      // Clear state and navigate back
      setPreviewImages([]);
      setOriginalImages([]);
      setEditingItem(null);
      setView('seller');
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'שמירת הפריט נכשלה. ייתכן שהוא גדול מדי.');
      console.error('Save error:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      // Refresh items list immediately
      await fetchItems();
      setOpenMenuId(null);
    } catch (error) {
      handleDatabaseError(error, OperationType.DELETE, 'items');
    }
  };

  const updateSellerDetails = async (sellerId: string, newName: string, newPhoto: string) => {
    const { error } = await supabase
      .from('items')
      .update({ seller_name: newName, seller_photo: newPhoto })
      .eq('seller_id', sellerId);
    
    if (error) {
      console.error('Error updating seller details:', error);
      throw error;
    }
  };

  const handleMakeOffer = async (itemId: string, amount: number) => {
    if (!currentUser) {
      alert('אנא התחבר תחילה');
      return;
    }
    try {
      // Fetch the item to get the correct seller_id
      const { data: itemData, error: itemError } = await supabase
        .from('items')
        .select('seller_id')
        .eq('id', itemId)
        .single();
      
      if (itemError) throw itemError;
      
      // Delete any existing pending offers from this buyer for this item
      const { error: deleteError } = await supabase
        .from('offers')
        .delete()
        .eq('item_id', itemId)
        .eq('buyer_id', currentUser.id)
        .eq('status', 'pending');
      
      if (deleteError) throw deleteError;
      
      // Create the new offer
      const offerId = `offer_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const { error } = await supabase
        .from('offers')
        .insert([{
          id: offerId,
          item_id: itemId,
          buyer_id: currentUser.id,
          seller_id: itemData.seller_id,
          amount,
          status: 'pending',
          created_at: new Date().toISOString()
        }]);
      
      if (error) throw error;
      setOfferModalOpen(false);
      setOfferWasCanceled(false);
      setOfferSuccessModalOpen(true);
      fetchBuyerOffers();
      fetchSellerOffers();
    } catch (error) {
      handleDatabaseError(error, OperationType.CREATE, 'offers');
    }
  };

  const handleUpdateOffer = async (itemId: string, amount: number) => {
    try {
      const offersMap = (window as any).__buyerOffersData as Map<string, any>;
      const existingOffer = offersMap?.get(itemId);
      
      if (!existingOffer) {
        // No existing offer, create new one
        await handleMakeOffer(itemId, amount);
        return;
      }

      const { error } = await supabase
        .from('offers')
        .update({ amount, created_at: new Date().toISOString() })
        .eq('id', existingOffer.id);
      
      if (error) throw error;
      setOfferModalOpen(false);
      setOfferWasCanceled(false);
      setOfferSuccessModalOpen(true);
      fetchBuyerOffers();
      fetchSellerOffers();
    } catch (error) {
      handleDatabaseError(error, OperationType.UPDATE, 'offers');
    }
  };

  const handleCancelOffer = async (itemId: string) => {
    try {
      const offersMap = (window as any).__buyerOffersData as Map<string, any>;
      const existingOffer = offersMap?.get(itemId);
      
      if (!existingOffer) return;

      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', existingOffer.id);
      
      if (error) throw error;
      setOfferModalOpen(false);
      setOfferWasCanceled(true);
      setOfferSuccessModalOpen(true);
      fetchBuyerOffers();
      fetchSellerOffers();
    } catch (error) {
      handleDatabaseError(error, OperationType.DELETE, 'offers');
    }
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f7eee3' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-zinc-600 font-medium">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto min-h-screen relative overflow-hidden flex flex-col ${view === 'entrance' || view === 'auth' ? 'bg-background' : ''}`} 
         style={view !== 'entrance' && view !== 'auth' ? { backgroundColor: '#f7eee3' } : {}}>
      <AnimatePresence mode="wait">
        {view === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col relative h-full"
          >
            <div className="absolute inset-0 z-0 h-full">
              <img 
                src="https://pub-498e856fd166452dab90acf56f450320.r2.dev/clock.jpg" 
                alt="Background" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8">
              <div className="w-32 h-32 rounded-3xl flex items-center justify-center shadow-xl mb-6">
                <img src="/new_icon.png" alt="מרקטפלייס" className="w-32 h-32 rounded-3xl" />
              </div>
              <h1 className="text-white text-4xl font-extrabold tracking-tight mb-12">מרקטפלייס</h1>

              <div className="w-full bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-2xl">
                <h2 className="text-xl font-bold mb-6 text-center">התחברות / הרשמה</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const name = formData.get('name') as string;
                    const phone = formData.get('phone') as string;
                    
                    if (!name || !phone) {
                      alert('נא למלא את כל השדות');
                      return;
                    }
                    
                    // Validate Israeli phone format
                    const phoneRegex = /^05\d{8}$/;
                    if (!phoneRegex.test(phone)) {
                      alert('מספר טלפון לא תקין. נא להזין מספר בפורמט: 05XXXXXXXX');
                      return;
                    }
                    
                    const result = await handleLoginOrRegister(name, phone);
                    if (!result.success) {
                      alert(result.message);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-700">שם מלא</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="הזן שם מלא"
                      className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-zinc-700">מספר טלפון</label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="05XXXXXXXX"
                      pattern="05[0-9]{8}"
                      inputMode="numeric"
                      maxLength={10}
                      className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <Button type="submit" variant="success" fullWidth className="mt-6">
                    המשך
                  </Button>
                </form>
                <p className="text-xs text-zinc-500 text-center mt-4">
                  אין צורך באימות SMS בשלב זה
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'entrance' && (
          <motion.div 
            key="entrance"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col relative h-full"
          >
            <div className="absolute inset-0 z-0 h-full">
              <img 
                src="https://pub-498e856fd166452dab90acf56f450320.r2.dev/clock.jpg" 
                alt="Background" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col items-center pt-20 px-8 h-full">
              <div className="w-40 h-40 rounded-3xl flex items-center justify-center shadow-xl mb-6">
                <img src="/new_icon.png" alt="מרקטפלייס" className="w-40 h-40 rounded-3xl" />
              </div>
              <h1 className="text-white text-5xl font-extrabold tracking-tight mb-2">מרקטפלייס</h1>
              <p className="text-white/90 text-xl font-medium mb-12">קניה ומכירה לכולם</p>

              <div className="flex gap-4 mb-12">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-white w-4 h-4" />
                  <span className="text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">בטוח ומאובטח</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserIcon className="text-white w-4 h-4" />
                  <span className="text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">קישור ישיר</span>
                </div>
              </div>

              <div className="w-full mt-auto mb-12 space-y-4">
                <button 
                  onClick={() => { setUserMode('buyer'); setView('buyer'); }}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 shadow-lg active:scale-[0.98] transition-all"
                >
                  <div className="w-14 h-14 bg-background rounded-xl flex items-center justify-center">
                    <ShoppingBag className="text-primary w-7 h-7" />
                  </div>
                  <div className="flex-1 text-start">
                    <h3 className="text-zinc-900 text-lg font-bold">אני קונה</h3>
                    <p className="text-zinc-500 text-sm">דפדף וקנה פריטים</p>
                  </div>
                  <ChevronLeft className="text-zinc-400" />
                </button>

                <button 
                  onClick={() => { setUserMode('seller'); setView('seller'); }}
                  className="w-full bg-success rounded-2xl p-4 flex items-center gap-4 shadow-lg active:scale-[0.98] transition-all"
                >
                  <div className="w-14 h-14 bg-black/10 rounded-xl flex items-center justify-center">
                    <Store className="text-zinc-900 w-7 h-7" />
                  </div>
                  <div className="flex-1 text-start">
                    <h3 className="text-zinc-900 text-lg font-bold">אני מוכר</h3>
                    <p className="text-zinc-900/80 text-sm">העלה פריטים למכירה</p>
                  </div>
                  <ChevronLeft className="text-zinc-900" />
                </button>
              </div>

              <button 
                onClick={() => setView('help')}
                className="flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
              >
                <Book className="w-4 h-4" />
                <span className="text-sm font-semibold">מדריך</span>
              </button>
            </div>
          </motion.div>
        )}

        {view === 'buyer' && (
          <motion.div 
            key="buyer"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            {/* Header */}
            <header className="p-4 border-b border-divider bg-white sticky top-0 z-20">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-extrabold text-zinc-900">מרקטפלייס</h1>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-zinc-100 rounded-full"><Bell className="w-6 h-6" /></button>
                </div>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategoryFilter(prev => prev === cat.id ? null : cat.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap font-semibold text-sm transition-all", 
                      cat.color,
                      selectedCategoryFilter === cat.id ? 'ring-2 ring-offset-2 ring-primary/40' : '',
                      selectedCategoryFilter && selectedCategoryFilter !== cat.id ? 'opacity-50' : 'opacity-100'
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </header>

            {/* Feed */}
            <main className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4 pb-24">
              {isLoadingItems ? (
                <div className="col-span-2 flex flex-col items-center justify-center py-20 text-zinc-400">
                  <Loader2 className="w-12 h-12 mb-4 animate-spin" />
                  <p className="font-medium">טוען פריטים...</p>
                </div>
              ) : (
                <>
                  {items.filter(i => 
                    i.status === 'active' && 
                    (!selectedCategoryFilter || i.category === selectedCategoryFilter) &&
                    (!searchTerm || i.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  ).map(item => (
                    <Card 
                      key={item.id}
                      className="cursor-pointer active:scale-[0.99] transition-transform overflow-hidden self-start"
                      onClick={() => { setSelectedItem(item); setView('item-details'); }}
                    >
                      <div className="relative aspect-square">
                        <img src={item.photoURL} alt={item.title} className="w-full h-full object-cover" />
                        <button className="absolute top-2 end-2 p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm">
                          <Heart 
                            className={cn(
                              "w-4 h-4 text-zinc-900",
                              buyerOffers.has(item.id) && "fill-current"
                            )} 
                          />
                        </button>
                      </div>
                      <div className="p-3 space-y-1">
                        <h3 className="font-bold text-sm leading-tight line-clamp-1">{item.title}</h3>
                        <span className="text-sm font-bold text-amber-600">{item.price} ש"ח</span>
                      </div>
                    </Card>
                  ))}
                  {items.filter(i => 
                    i.status === 'active' && 
                    (!selectedCategoryFilter || i.category === selectedCategoryFilter) &&
                    (!searchTerm || i.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  ).length === 0 && (
                    <div className="col-span-2 flex flex-col items-center justify-center py-20 text-zinc-400">
                      <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                      <p className="font-medium">אין פריטים זמינים עדיין</p>
                    </div>
                  )}
                </>
              )}
            </main>

            {/* Nav */}
            <nav className="fixed bottom-0 start-0 end-0 max-w-md mx-auto bg-white border-t border-divider p-4 flex justify-around items-center z-30">
              <button 
                onClick={() => {
                  setSelectedCategoryFilter(null);
                  setSearchTerm('');
                }}
                className="flex flex-col items-center gap-1 text-primary"
              >
                <Home className="w-7 h-7" />
                <span className="text-[10px] font-bold">ראשי</span>
              </button>
              <button 
                onClick={() => setSearchModalOpen(true)}
                className="flex flex-col items-center gap-1 text-zinc-400"
              >
                <Search className="w-7 h-7" />
                <span className="text-[10px] font-bold">חיפוש</span>
              </button>
              <button 
                onClick={() => {
                  setOffersListMode('buyer');
                  setView('offers-list');
                }}
                className="flex flex-col items-center gap-1 text-zinc-400"
              >
                <Heart className="w-7 h-7" />
                <span className="text-[10px] font-bold">הצעות</span>
              </button>
              <button 
                onClick={() => setView('settings')}
                className="flex flex-col items-center gap-1 text-zinc-400"
              >
                <UserIcon className="w-7 h-7" />
                <span className="text-[10px] font-bold">פרופיל</span>
              </button>
            </nav>
          </motion.div>
        )}

        {view === 'seller' && (
          <motion.div 
            key="seller"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            <div className="flex-1 flex flex-col h-full">
              <header className="p-4 border-b border-divider bg-white sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setView('entrance')} className="p-2 hover:bg-zinc-100 rounded-full"><ArrowRight className="w-6 h-6" /></button>
                  <h1 className="text-xl font-bold text-zinc-900">הפריטים שלי</h1>
                  <div className="w-10"></div>
                </div>
                <div className="flex items-center gap-4">
                  <img src={currentUser?.photoURL || DEFAULT_AVATAR} alt={currentUser?.name || 'User'} className="w-16 h-16 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{currentUser?.name || 'משתמש'}</h2>
                    <div className="flex items-center gap-2 text-zinc-500 text-sm">
                      <MapPin className="w-4 h-4" /> {currentUser?.location || 'לא צוין'}
                    </div>
                    <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {currentUser.rating} (127)
                    </div>
                  </div>
                  <button onClick={() => setView('account-settings')} className="text-amber-600 font-bold text-sm">ערוך פרופיל</button>
                </div>

              <div className="grid grid-cols-3 gap-4 border-t border-divider pt-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{items.filter(i => i.sellerId === currentUser?.id && i.status === 'active').length}</div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">פעיל</div>
                </div>
                <div className="text-center border-x border-divider">
                  <div className="text-lg font-bold">{items.filter(i => i.sellerId === currentUser?.id).length}</div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">סה״כ</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {items.filter(i => i.sellerId === currentUser?.id).reduce((sum, item) => sum + (item.price || 0), 0)} ש"ח
                  </div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">ערך כולל</div>
                </div>
              </div>
              </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
              <h3 className="text-lg font-bold mb-4">מודעות פעילות</h3>
              {isLoadingItems ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                  <Loader2 className="w-12 h-12 mb-4 animate-spin" />
                  <p className="font-medium">טוען פריטים...</p>
                </div>
              ) : (
                <>
                  {items.filter(i => 
                    i.sellerId === currentUser?.id &&
                    (!searchTerm || i.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  ).map(item => (
                <div key={item.id}>
                  <Card 
                    className="p-3 cursor-pointer active:scale-[0.99] transition-transform relative"
                    onClick={() => {
                      setEditingItem(item);
                      setPreviewImages(item.photoURLs || [item.photoURL]);
                      setOriginalImages(item.photoURLs || [item.photoURL]);
                      setSelectedCondition(item.condition || 'כמו חדש');
                      setView('add-item');
                    }}
                  >
                    <div className="flex gap-4">
                      <img src={item.photoURL} alt={item.title} className="w-24 h-24 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm truncate">{item.title}</h4>
                          <div className="flex items-center gap-1">
                            {sellerItemsWithOffers.has(item.id) && (
                              <Heart className="w-4 h-4 fill-current text-zinc-900 flex-shrink-0" />
                            )}
                            <div className="relative">
                              <button 
                                className="p-1 text-zinc-400 hover:bg-zinc-100 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === item.id ? null : item.id);
                                }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            {openMenuId === item.id && (
                              <div className="absolute end-0 top-6 bg-white shadow-lg rounded-lg border border-zinc-100 py-1 z-10 w-32">
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setOpenMenuId(null);
                                    setDeleteConfirmModal({ open: true, itemId: item.id });
                                  }} 
                                  className="w-full text-start px-4 py-2 text-sm text-white font-medium rounded-lg" style={{ backgroundColor: '#b6312c' }}
                                >
                                  מחק
                                </button>
                              </div>
                            )}
                            </div>
                          </div>
                        </div>
                        <div className="text-lg font-bold text-amber-600 mt-1">{item.price} ש"ח</div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-2">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", CONDITION_COLORS[item.condition] || 'bg-zinc-200 text-zinc-700')}>{item.condition}</span>
                            {item.category && (
                              <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", CATEGORIES.find(c => c.id === item.category)?.color || 'bg-zinc-100 text-zinc-700')}>
                                {CATEGORIES.find(c => c.id === item.category)?.label || item.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-bold">
                            <Eye className="w-3 h-3" /> {item.views} צפיות
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
                  {items.filter(i => 
                    i.sellerId === currentUser?.id &&
                    (!searchTerm || i.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  ).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                      <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                      <p className="font-medium">אין פריטים עדיין</p>
                    </div>
                  )}
                </>
              )}
            </main>

            <button 
              onClick={() => {
                setEditingItem(null);
                setPreviewImages([]);
                setOriginalImages([]);
                setSelectedCondition('כמו חדש');
                setView('add-item');
              }}
              className="fixed bottom-24 end-8 w-14 h-14 bg-success rounded-full flex items-center justify-center text-zinc-900 shadow-xl active:scale-95 transition-transform z-30"
            >
              <Plus className="w-8 h-8" />
            </button>

            {/* Nav */}
            <nav className="fixed bottom-0 start-0 end-0 max-w-md mx-auto bg-white border-t border-divider p-4 flex justify-around items-center z-30">
              <button 
                onClick={() => setSearchTerm('')}
                className="flex flex-col items-center gap-1 text-primary"
              >
                <Home className="w-7 h-7" />
                <span className="text-[10px] font-bold">ראשי</span>
              </button>
              <button 
                onClick={() => setSearchModalOpen(true)}
                className="flex flex-col items-center gap-1 text-zinc-400"
              >
                <Search className="w-7 h-7" />
                <span className="text-[10px] font-bold">חיפוש</span>
              </button>
              <button 
                onClick={() => {
                  setOffersListMode('seller');
                  setView('offers-list');
                }}
                className="flex flex-col items-center gap-1 text-zinc-400"
              >
                <Heart className="w-7 h-7" />
                <span className="text-[10px] font-bold">הצעות</span>
              </button>
              <button 
                onClick={() => setView('settings')}
                className="flex flex-col items-center gap-1 text-zinc-400"
              >
                <UserIcon className="w-7 h-7" />
                <span className="text-[10px] font-bold">פרופיל</span>
              </button>
            </nav>
            </div>
          </motion.div>
        )}

        {view === 'offers-list' && (
          <motion.div 
            key="offers-list"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="flex-1 flex flex-col h-full"
          >
            <header className="p-4 border-b border-divider bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <button onClick={() => setView(offersListMode === 'buyer' ? 'buyer' : 'seller')} className="p-2 hover:bg-zinc-100 rounded-full">
                  <ArrowRight className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">{offersListMode === 'buyer' ? 'ההצעות שלי' : 'הצעות שקיבלתי'}</h1>
                <div className="w-10"></div>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
              {(offersListMode === 'buyer' ? buyerOffersDetails : sellerOffersDetails).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                  <Heart className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-medium">אין הצעות פעילות</p>
                  <p className="text-sm mt-2">{offersListMode === 'buyer' ? 'ההצעות שתשלח יופיעו כאן' : 'הצעות שתקבל יופיעו כאן'}</p>
                </div>
              ) : (
                (offersListMode === 'buyer' ? buyerOffersDetails : sellerOffersDetails).map((offer) => (
                  <Card key={offer.id} className="p-3">
                    <div className="flex items-center gap-3">
                      {/* Product Image */}
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-100">
                        {offer.item?.photoURL ? (
                          <img 
                            src={offer.item.photoURLs?.[0] || offer.item.photoURL} 
                            alt={offer.item.title} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag className="w-8 h-8 text-zinc-300" />
                          </div>
                        )}
                      </div>

                      {/* Offer Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate">{offer.item?.title || 'פריט לא זמין'}</h3>
                        {offersListMode === 'seller' && offer.buyer && (
                          <p className="text-xs text-zinc-500 mt-0.5">מאת: {offer.buyer.name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold text-success">{offer.amount} ש"ח</span>
                          {offer.item?.price && (
                            <span className="text-xs text-zinc-400 line-through">{offer.item.price} ש"ח</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-zinc-400 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(offer.created_at).toLocaleDateString('he-IL', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                          offer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          offer.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {offer.status === 'accepted' ? 'התקבל' :
                           offer.status === 'rejected' ? 'נדחה' :
                           'ממתין'}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </main>

            {/* Bottom Navigation */}
            <nav className="fixed bottom-0 start-0 end-0 max-w-md mx-auto bg-white border-t border-divider p-4 flex justify-around items-center z-30">
              <button 
                onClick={() => setView(offersListMode === 'buyer' ? 'buyer' : 'seller')}
                className="flex flex-col items-center gap-1 text-zinc-400"
              >
                <Home className="w-7 h-7" />
                <span className="text-[10px] font-bold">ראשי</span>
              </button>
              <button 
                className="flex flex-col items-center gap-1 text-zinc-300 opacity-50 cursor-not-allowed"
                disabled
              >
                <Search className="w-7 h-7" />
                <span className="text-[10px] font-bold">חיפוש</span>
              </button>
              <button className="flex flex-col items-center gap-1 text-primary">
                <Heart className="w-7 h-7 fill-current" />
                <span className="text-[10px] font-bold">הצעות</span>
              </button>
              <button 
                onClick={() => setView('settings')}
                className="flex flex-col items-center gap-1 text-zinc-400"
              >
                <UserIcon className="w-7 h-7" />
                <span className="text-[10px] font-bold">פרופיל</span>
              </button>
            </nav>
          </motion.div>
        )}

        {view === 'add-item' && (
          <motion.div 
            key="add-item"
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            className="flex-1 flex flex-col h-full"
            style={{ backgroundColor: '#f7eee3' }}
          >
            <header className="p-4 border-b border-divider flex items-center justify-between">
              <button 
                onClick={() => {
                  setEditingItem(null);
                  setPreviewImages([]);
                  setOriginalImages([]);
                  setView(userMode === 'seller' ? 'seller' : 'buyer');
                }} 
                className="p-2 hover:bg-zinc-100 rounded-full"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold">{editingItem ? 'ערוך פריט' : 'הוסף פריט חדש'}</h1>
              {editingItem ? (
                <div className="flex items-center gap-1">
                  {sellerItemsWithOffers.has(editingItem.id) && (
                    <Heart className="w-5 h-5 fill-current text-zinc-900" />
                  )}
                  <div className="relative">
                    <button 
                      className="p-2 hover:bg-zinc-100 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === editingItem.id ? null : editingItem.id);
                      }}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  {openMenuId === editingItem.id && (
                    <div className="absolute end-0 top-10 bg-white shadow-lg rounded-lg border border-zinc-100 py-1 z-10 w-32">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setOpenMenuId(null);
                          setDeleteConfirmModal({ open: true, itemId: editingItem.id });
                        }} 
                        className="w-full text-start px-4 py-2 text-sm text-white font-medium rounded-lg" style={{ backgroundColor: '#b6312c' }}
                      >
                        מחק
                      </button>
                    </div>
                  )}
                  </div>
                </div>
              ) : (
                <div className="w-10"></div>
              )}
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
              <div className="space-y-4">
                <div className="aspect-[4/5] bg-zinc-50 border-2 border-dashed border-divider rounded-2xl flex flex-col items-center justify-center gap-2 overflow-hidden relative">
                  {isCompressing ? (
                    <div className="text-center p-4 flex flex-col items-center justify-center h-full w-full bg-zinc-100">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-sm text-zinc-500 font-medium">מעבד תמונה...</p>
                    </div>
                  ) : previewImages.length > 0 ? (
                    <div className="w-full h-full flex gap-4 overflow-x-auto snap-x snap-mandatory p-2 bg-zinc-100">
                      {previewImages.map((img, idx) => (
                        <img key={idx} src={img} alt={`Preview ${idx}`} className="w-full h-full object-contain rounded-xl flex-shrink-0 snap-center shadow-sm bg-white" />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <Camera className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
                      <p className="text-sm text-zinc-500 font-medium">לא נבחרה תמונה</p>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-xs px-2 py-2 h-auto gap-1"
                    onClick={() => {
                      if (cameraInputRef.current) {
                        cameraInputRef.current.click();
                      }
                    }}
                  >
                    <Camera className="w-4 h-4" />
                    צלם
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex-1 text-xs px-2 py-2 h-auto gap-1"
                    onClick={() => {
                      if (galleryInputRef.current) {
                        galleryInputRef.current.click();
                      }
                    }}
                  >
                    <Image className="w-4 h-4" />
                    גלריה
                  </Button>

                  {previewImages.length > 0 && (
                    <>
                      <Button 
                        variant="outline"
                        className="flex-none px-5 py-2 h-auto text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => {
                          setPreviewImages(prev => prev.slice(0, -1));
                          setOriginalImages(prev => prev.slice(0, -1));
                        }}
                        title="מחק תמונה אחרונה"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-none px-5 py-2 h-auto text-indigo-600 border-indigo-200 hover:bg-indigo-50 disabled:opacity-50"
                        onClick={handleAIEnhance}
                        disabled={isEnhancing}
                        title="שפר תמונה עם AI"
                      >
                        {isEnhancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      </Button>
                    </>
                  )}
                </div>

                <p className="text-[10px] text-zinc-400 text-center px-4">
                  אם המצלמה לא נפתחת, אנא ודא שהרשאות המצלמה מופעלות בהגדרות הדפדפן שלך.
                </p>
                
                <input 
                  id="camera-input"
                  type="file" 
                  ref={cameraInputRef}
                  onChange={handleFileChange} 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                />
                <input 
                  id="gallery-input"
                  type="file" 
                  ref={galleryInputRef}
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1.5">כותרת</label>
                  <input 
                    type="text" 
                    placeholder="לדוגמה: אוזניות בלוטות' אלחוטיות"
                    className="w-full bg-zinc-50 border border-divider rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    id="item-title"
                    defaultValue={editingItem?.title || ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1.5">קטגוריה</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-zinc-50 border border-divider rounded-xl px-4 py-3 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20" 
                      id="item-category"
                      defaultValue={editingItem?.category || ''}
                    >
                      <option value="">ללא</option>
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute end-4 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1.5">מחיר</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute end-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">ש"ח</span>
                      <input 
                        type="text" 
                        placeholder="0.00"
                        className="w-full bg-zinc-50 border border-divider rounded-xl ps-4 pe-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        id="item-price"
                        defaultValue={editingItem?.price || ''}
                      />
                    </div>
                    <button
                      onClick={handlePriceSearch}
                      disabled={searchingPrice || !searchOptimizedText}
                      className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      title="חיפוש מחיר"
                    >
                      {searchingPrice ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Search className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1.5">מצב</label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {CONDITIONS.map(c => (
                      <button 
                        key={c}
                        onClick={() => setSelectedCondition(c)}
                        className={cn(
                          "px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-colors",
                          selectedCondition === c ? CONDITION_COLORS[c] : 'bg-white text-zinc-500 border-divider hover:bg-zinc-50'
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1.5">תיאור</label>
                  <textarea 
                    placeholder="תאר את מצב הפריט, תכונותיו ואביזרים נלווים..."
                    className="w-full bg-zinc-50 border border-divider rounded-xl px-4 py-3 h-32 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    id="item-desc"
                    defaultValue={editingItem?.description || ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-1.5">מפרט (אופציונלי)</label>
                  <textarea 
                    placeholder="הוסף מפרט טכני, מידות, או פרטים נוספים..."
                    className="w-full bg-zinc-50 border border-divider rounded-xl px-4 py-3 h-24 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    id="item-specs"
                    defaultValue={editingItem?.specifications || ''}
                  />
                </div>
              </div>
            </main>

            <footer className="p-4 border-t border-divider bg-white sticky bottom-0">
              {publishError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {publishError}
                </div>
              )}
              {editingItem ? (
                <div className="flex gap-4">
                  <Button 
                    variant="success" 
                    fullWidth 
                    size="lg"
                    disabled={isPublishing || isCompressing}
                    onClick={() => {
                      const title = (document.getElementById('item-title') as HTMLInputElement).value;
                      const price = parseFloat((document.getElementById('item-price') as HTMLInputElement).value);
                      const category = (document.getElementById('item-category') as HTMLSelectElement).value;
                      const description = (document.getElementById('item-desc') as HTMLTextAreaElement).value;
                      const specifications = (document.getElementById('item-specs') as HTMLTextAreaElement).value;
                      
                      const currentPhotoURLs = previewImages;
                      
                      if (title && !isNaN(price)) {
                        handleSaveItem({
                          title,
                          price,
                          category,
                          description,
                          specifications,
                          condition: selectedCondition,
                          photoURL: currentPhotoURLs[0] || `https://placehold.co/800x1000/e4e4e7/a1a1aa?text=אין+תמונה`,
                          photoURLs: currentPhotoURLs.length > 0 ? currentPhotoURLs : [`https://placehold.co/800x1000/e4e4e7/a1a1aa?text=אין+תמונה`]
                        });
                      } else {
                        setPublishError('אנא הזן כותרת ומחיר תקין.');
                      }
                    }}
                  >
                    {isPublishing ? 'מעדכן...' : isCompressing ? 'דוחס תמונה...' : 'עדכן פריט'}
                  </Button>
                  <Button 
                    variant="outline" 
                    fullWidth 
                    size="lg"
                    disabled={isPublishing}
                    onClick={() => {
                      setEditingItem(null);
                      setPreviewImages([]);
                      setOriginalImages([]);
                      setView(userMode === 'seller' ? 'seller' : 'buyer');
                    }}
                  >
                    חזור
                  </Button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button 
                    variant="success" 
                    fullWidth 
                    size="lg"
                    disabled={isPublishing || isCompressing}
                    onClick={() => {
                      const title = (document.getElementById('item-title') as HTMLInputElement).value;
                      const price = parseFloat((document.getElementById('item-price') as HTMLInputElement).value);
                      const category = (document.getElementById('item-category') as HTMLSelectElement).value;
                      const description = (document.getElementById('item-desc') as HTMLTextAreaElement).value;
                      const specifications = (document.getElementById('item-specs') as HTMLTextAreaElement).value;
                      
                      const currentPhotoURLs = previewImages;
                      
                      if (title && !isNaN(price)) {
                        handleSaveItem({
                          title,
                          price,
                          category,
                          description,
                          specifications,
                          condition: selectedCondition,
                          photoURL: currentPhotoURLs[0] || `https://placehold.co/800x1000/e4e4e7/a1a1aa?text=אין+תמונה`,
                          photoURLs: currentPhotoURLs.length > 0 ? currentPhotoURLs : [`https://placehold.co/800x1000/e4e4e7/a1a1aa?text=אין+תמונה`]
                        });
                      } else {
                        setPublishError('אנא הזן כותרת ומחיר תקין.');
                      }
                    }}
                  >
                    {isPublishing ? 'מפרסם...' : isCompressing ? 'דוחס תמונה...' : 'פרסם פריט'}
                  </Button>
                  <Button 
                    variant="outline" 
                    fullWidth 
                    size="lg"
                    onClick={() => {
                      setEditingItem(null);
                      setPreviewImages([]);
                      setOriginalImages([]);
                      setView(userMode === 'seller' ? 'seller' : 'buyer');
                    }}
                  >
                    חזור
                  </Button>
                </div>
              )}
            </footer>
          </motion.div>
        )}

        {view === 'item-details' && selectedItem && (
          <motion.div 
            key="item-details"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="flex-1 flex flex-col h-full"
            style={{ backgroundColor: '#f7eee3' }}
          >
            <header className="p-4 border-b border-divider flex items-center justify-between sticky top-0 z-20 bg-white">
              <button onClick={() => setView('buyer')} className="p-2 hover:bg-zinc-100 rounded-full"><ArrowRight className="w-5 h-5" /></button>
              <h1 className="text-md font-bold">פרטי פריט</h1>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-zinc-100 rounded-full"><Share2 className="w-5 h-5" /></button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto pb-32">
              <div className="relative aspect-[4/5] mx-4 mt-4 rounded-3xl overflow-hidden shadow-md">
                {selectedItem.photoURLs && selectedItem.photoURLs.length > 1 ? (
                  <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory">
                    {selectedItem.photoURLs.map((img, idx) => (
                      <img key={idx} src={img} alt={`${selectedItem.title} - ${idx + 1}`} className="w-full h-full object-cover flex-shrink-0 snap-center" />
                    ))}
                  </div>
                ) : (
                  <img src={selectedItem.photoURL} alt={selectedItem.title} className="w-full h-full object-cover" />
                )}
                <button className="absolute top-4 end-4 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Heart 
                    className={cn(
                      "w-6 h-6",
                      buyerOffers.has(selectedItem.id) && "fill-current"
                    )} 
                  />
                </button>
              </div>

              <div className="p-4 space-y-6">
                <div className="flex items-center gap-4">
                  <img src={selectedItem.sellerPhoto} alt={selectedItem.sellerName} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <h4 className="font-bold text-lg leading-none">{selectedItem.sellerName}</h4>
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                      <MapPin className="w-3 h-3" /> {selectedItem.sellerLocation}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> 4.8 (127)
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="bg-success/20 text-amber-700 rounded-full">
                    <MessageCircle className="w-4 h-4" /> הודעה
                  </Button>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold leading-tight">{selectedItem.title}</h2>
                  <div className="text-3xl font-extrabold text-amber-600">{selectedItem.price} ש"ח</div>
                  <div className="flex items-center gap-4">
                    <span className={cn("px-3 py-1 rounded-lg text-xs font-bold uppercase", CONDITION_COLORS[selectedItem.condition] || 'bg-zinc-200 text-zinc-700')}>{selectedItem.condition}</span>
                    {selectedItem.category && (
                      <span className={cn("px-3 py-1 rounded-lg text-xs font-bold uppercase", CATEGORIES.find(c => c.id === selectedItem.category)?.color || 'bg-zinc-100 text-zinc-700')}>
                        {CATEGORIES.find(c => c.id === selectedItem.category)?.label || selectedItem.category}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-xs text-zinc-500 font-medium">
                      <Clock className="w-3.5 h-3.5" /> פורסם לפני שעתיים
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-lg">תיאור</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedItem.description || "לא סופק תיאור."}
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-bold text-lg">מפרט</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedItem.specifications || "לא סופק מפרט."}
                  </p>
                </div>

                <Card className="p-4 bg-zinc-50 border-divider">
                  <div className="flex justify-around items-center">
                    <div className="flex items-center gap-1 text-xs font-bold text-zinc-500">
                      <Heart 
                        className={cn(
                          "w-4 h-4",
                          buyerOffers.has(selectedItem.id) && "fill-current"
                        )} 
                      /> הצעה
                    </div>
                    <div className="flex items-center gap-1 text-xs font-bold text-zinc-500">
                      <Eye className="w-4 h-4" /> צפיות
                    </div>
                  </div>
                </Card>
              </div>
            </main>

            <footer className="p-4 border-t border-divider bg-white sticky bottom-0 flex gap-4">
              <Button 
                variant="success" 
                fullWidth 
                size="lg"
                onClick={() => {
                  // Check if user is trying to make an offer on their own item
                  if (currentUser && selectedItem.sellerId === currentUser.id) {
                    setSelfOfferErrorModal(true);
                    return;
                  }
                  const offersMap = (window as any).__buyerOffersData as Map<string, any>;
                  const existingOffer = offersMap?.get(selectedItem.id);
                  setOfferAmount(existingOffer ? String(existingOffer.amount) : '');
                  setOfferModalOpen(true);
                }}
              >
                {buyerOffers.has(selectedItem.id) ? 'עדכן הצעה' : 'אני מעוניין'}
              </Button>
              <Button 
                variant="outline" 
                fullWidth 
                size="lg"
                onClick={() => setView('buyer')}
              >
                חזור
              </Button>
            </footer>
          </motion.div>
        )}

        {view === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="flex-1 flex flex-col h-full bg-white"
          >
            <header className="p-4 border-b border-divider flex items-center gap-4">
              <button onClick={() => setView('entrance')} className="p-2 hover:bg-zinc-100 rounded-full"><ArrowRight className="w-6 h-6" /></button>
              <h1 className="text-xl font-bold">הגדרות</h1>
            </header>
            <main className="p-4 space-y-2">
              <button 
                onClick={() => setView('account-settings')}
                className="w-full text-start p-4 hover:bg-zinc-50 rounded-xl font-medium flex items-center justify-between"
              >
                הגדרות חשבון <ChevronLeft className="w-5 h-5 text-zinc-400" />
              </button>
              <button className="w-full text-start p-4 hover:bg-zinc-50 rounded-xl font-medium flex items-center justify-between">
                התראות <ChevronLeft className="w-5 h-5 text-zinc-400" />
              </button>
              <button className="w-full text-start p-4 hover:bg-zinc-50 rounded-xl font-medium flex items-center justify-between">
                פרטיות ואבטחה <ChevronLeft className="w-5 h-5 text-zinc-400" />
              </button>
              <button 
                onClick={() => setView('help')}
                className="w-full text-start p-4 hover:bg-zinc-50 rounded-xl font-medium flex items-center justify-between"
              >
                מדריך <ChevronLeft className="w-5 h-5 text-zinc-400" />
              </button>
              <div className="pt-8 space-y-4">
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    fullWidth 
                    onClick={() => { setUserMode('buyer'); setView('buyer'); }}
                  >
                    קונה
                  </Button>
                  <Button 
                    variant="success" 
                    fullWidth 
                    onClick={() => { setUserMode('seller'); setView('seller'); }}
                  >
                    מוכר
                  </Button>
                </div>

                <Button 
                  variant="outline" 
                  fullWidth 
                  onClick={handleLogout}
                >
                  התנתק
                </Button>
              </div>
            </main>
          </motion.div>
        )}
        {view === 'account-settings' && (
          <motion.div 
            key="account-settings"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="flex-1 flex flex-col h-full bg-white"
          >
            <header className="p-4 border-b border-divider flex items-center gap-4">
              <button onClick={() => setView('settings')} className="p-2 hover:bg-zinc-100 rounded-full"><ArrowRight className="w-6 h-6" /></button>
              <h1 className="text-xl font-bold">הגדרות חשבון</h1>
            </header>
            <main className="p-4 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-24 h-24">
                  <img src={currentUser?.photoURL || DEFAULT_AVATAR} alt={currentUser?.name || 'User'} className="w-24 h-24 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <button 
                    className="absolute bottom-0 end-0 p-2 bg-primary text-white rounded-full shadow-lg"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 400 });
                          const reader = new FileReader();
                          reader.onloadend = () => setCurrentUser(prev => ({ ...prev, photoURL: reader.result as string }));
                          reader.readAsDataURL(compressed);
                        }
                      };
                      input.click();
                    }}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold">שם מלא</label>
                <input 
                  type="text" 
                  value={currentUser?.name || ''}
                  onChange={(e) => setCurrentUser(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full p-3 bg-zinc-100 rounded-xl font-medium"
                />
              </div>
              <Button fullWidth onClick={async () => {
                if (!currentUser) return;
                await supabase
                  .from('users')
                  .update({ name: currentUser.name, photo_url: currentUser.photoURL })
                  .eq('id', currentUser.id);
                await updateSellerDetails(currentUser.id, currentUser.name, currentUser.photoURL);
                await fetchItems(); // Refresh items to show updated photo
                setView('settings');
              }}>שמור שינויים</Button>
            </main>
          </motion.div>
        )}
        {view === 'help' && (
          <motion.div 
            key="help"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="flex-1 flex flex-col h-full bg-white"
          >
            <header className="p-4 border-b border-divider flex items-center gap-4">
              <button 
                onClick={() => setView(userMode === 'buyer' ? 'buyer' : 'seller')} 
                className="p-2 hover:bg-zinc-100 rounded-full"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold">מדריך</h1>
            </header>
            <main className="p-4">
              <div className="text-zinc-700 leading-relaxed whitespace-pre-wrap">
                <iframe src="/help.html" className="w-full h-96 border-none" />
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Offer Modal */}
      {offerModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl relative"
          >
            {/* X Close Button */}
            <button 
              onClick={() => setOfferModalOpen(false)}
              className="absolute top-4 end-4 p-2 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-zinc-600" />
            </button>

            <h2 className="text-xl font-bold mb-2">מרקטפלייס פרו</h2>
            <p className="text-zinc-600 mb-4">
              {buyerOffers.has(selectedItem.id) ? 'עדכן את סכום ההצעה שלך עבור' : 'הזן את סכום ההצעה שלך עבור'} {selectedItem.title}:
            </p>
            <div className="relative mb-6">
              <span className="absolute end-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">ש"ח</span>
              <input 
                type="number" 
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                className="w-full ps-4 pe-12 py-3 bg-zinc-100 border-none rounded-xl font-bold text-lg focus:ring-2 focus:ring-primary outline-none"
                placeholder="0.00"
                autoFocus
              />
            </div>
            
            {/* Buttons - Different layout for update vs new offer */}
            {buyerOffers.has(selectedItem.id) ? (
              // Update offer: 2 buttons side by side
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  fullWidth 
                  onClick={() => handleCancelOffer(selectedItem.id)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  בטל הצעה
                </Button>
                <Button 
                  variant="success" 
                  fullWidth 
                  disabled={!offerAmount || isNaN(parseFloat(offerAmount))}
                  onClick={() => {
                    if (offerAmount && !isNaN(parseFloat(offerAmount))) {
                      handleUpdateOffer(selectedItem.id, parseFloat(offerAmount));
                    }
                  }}
                >
                  עדכן הצעה
                </Button>
              </div>
            ) : (
              // New offer: 2 buttons side by side
              <div className="flex gap-3">
                <Button variant="outline" fullWidth onClick={() => setOfferModalOpen(false)}>
                  חזור
                </Button>
                <Button 
                  variant="success" 
                  fullWidth 
                  disabled={!offerAmount || isNaN(parseFloat(offerAmount))}
                  onClick={() => {
                    if (offerAmount && !isNaN(parseFloat(offerAmount))) {
                      handleMakeOffer(selectedItem.id, parseFloat(offerAmount));
                    }
                  }}
                >
                  שלח הצעה
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Offer Success Modal */}
      {offerSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center"
          >
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
              offerWasCanceled ? "bg-red-100 text-red-600" : "bg-success/20 text-amber-700"
            )}>
              <Heart className="w-8 h-8 fill-current" />
            </div>
            <h2 className="text-xl font-bold mb-2">
              {offerWasCanceled ? 'ההצעה בוטלה' : 'ההצעה נשלחה!'}
            </h2>
            <p className="text-zinc-600 mb-6">
              {offerWasCanceled ? 'ההצעה שלך בוטלה בהצלחה.' : 'ההצעה שלך נשלחה בהצלחה למוכר.'}
            </p>
            <Button variant="success" fullWidth onClick={() => setOfferSuccessModalOpen(false)}>
              אישור
            </Button>
          </motion.div>
        </div>
      )}

      {/* Price Search Progress Modal */}
      {searchingPrice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl text-center"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4">
              {currentSearchingSite === 'המתן...' ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Search className="w-8 h-8 text-white" />
              )}
            </div>
            <h2 className="text-xl font-bold mb-2">מחפש מחירים...</h2>
            <p className="text-zinc-600 mb-4">
              {currentSearchingSite}
            </p>
            {priceSearchResults.length > 0 && (
              <div className="mt-4 mb-6">
                <p className="text-sm font-semibold text-zinc-700 mb-2">נמצאו מחירים באתרים:</p>
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {priceSearchResults.map((result, idx) => (
                    <div key={idx} className="px-3 py-1 bg-success/20 text-zinc-700 rounded-full text-sm font-medium">
                      {result.site}: ₪{result.price}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    fullWidth 
                    onClick={() => {
                      setSearchingPrice(false);
                      setCurrentSearchingSite('');
                    }}
                  >
                    עצור
                  </Button>
                  <Button 
                    variant="success" 
                    fullWidth 
                    onClick={() => {
                      setSearchingPrice(false);
                      setCurrentSearchingSite('');
                    }}
                  >
                    המשך
                  </Button>
                </div>
              </div>
            )}
            {currentSearchingSite === 'לא נמצאו תוצאות' && (
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  fullWidth 
                  onClick={() => {
                    setSearchingPrice(false);
                    setCurrentSearchingSite('');
                  }}
                >
                  סגור
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Search Modal */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <h2 className="text-xl font-bold mb-4">חיפוש פריטים</h2>
            <input 
              type="text" 
              placeholder="חפש לפי שם פריט..."
              className="w-full bg-zinc-50 border border-divider rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                fullWidth 
                onClick={() => {
                  setSearchTerm('');
                  setSearchModalOpen(false);
                }}
              >
                ביטול
              </Button>
              <Button 
                variant="success" 
                fullWidth 
                onClick={() => setSearchModalOpen(false)}
              >
                חפש
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Name Mismatch Modal */}
      {nameMismatchModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <h2 className="text-xl font-bold mb-6 text-center">שינוי שם</h2>
            
            <div className="space-y-4 mb-6">
              <div className="bg-zinc-50 rounded-xl p-4">
                <p className="text-sm text-zinc-600 mb-2">השם שבשימוש כרגע:</p>
                <p className="text-lg font-bold text-zinc-900">{nameMismatchModal.oldName}</p>
              </div>
              
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-amber-700 mb-2">לשנות ל:</p>
                <p className="text-lg font-bold text-amber-900">{nameMismatchModal.newName}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                variant="outline" 
                fullWidth 
                onClick={() => handleNameDecision(true)}
              >
                השאר ללא שינוי
              </Button>
              <Button 
                variant="success" 
                fullWidth 
                onClick={() => handleNameDecision(false)}
              >
                שנה לשם המעודכן
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <h2 className="text-2xl font-bold mb-6 text-center">למחוק?</h2>

            <div className="space-y-3">
              <Button 
                variant="outline" 
                fullWidth 
                onClick={() => setDeleteConfirmModal(null)}
              >
                ביטול
              </Button>
              <button
                className="w-full px-6 py-3 text-white font-bold rounded-xl transition-all active:scale-[0.98]"
                style={{ backgroundColor: '#b6312c' }}
                onClick={async () => {
                  if (deleteConfirmModal.itemId) {
                    await handleDeleteItem(deleteConfirmModal.itemId);
                    setDeleteConfirmModal(null);
                  }
                }}
              >
                מחק
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Self Offer Error Modal */}
      {selfOfferErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
          >
            <p className="text-lg text-center mb-6 font-medium">לא ניתן להגיש הצעה לפריטים שפרסמת</p>
            <Button 
              variant="success" 
              fullWidth 
              onClick={() => setSelfOfferErrorModal(false)}
            >
              אוקיי
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
