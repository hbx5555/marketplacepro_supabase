export interface User {
  id: string;
  name: string;
  phone_number: string;
  email: string;
  photoURL: string;
  location: string;
  rating: number;
  earned: number;
  activeListings: number;
  totalListings: number;
  created_at?: string;
  last_login?: string;
}

export interface Item {
  id: string;
  sellerId: string;
  sellerName?: string;
  sellerPhoto?: string;
  sellerLocation?: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  category: string;
  specifications?: string;
  photoURL: string;
  photoURLs?: string[];
  createdAt: string;
  views: number;
  likes: number;
  status: 'active' | 'sold';
}

export interface Offer {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
