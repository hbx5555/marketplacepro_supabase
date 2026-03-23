-- ProMarketplace Database Schema for Supabase
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  photo_url TEXT,
  location TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  earned DECIMAL(10,2) DEFAULT 0,
  active_listings INTEGER DEFAULT 0,
  total_listings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items Table
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  seller_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  seller_name TEXT,
  seller_photo TEXT,
  seller_location TEXT,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  condition TEXT,
  category TEXT,
  specifications TEXT,
  photo_url TEXT,
  photo_urls TEXT[],
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offers Table
CREATE TABLE IF NOT EXISTS offers (
  id TEXT PRIMARY KEY,
  item_id TEXT REFERENCES items(id) ON DELETE CASCADE,
  buyer_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  seller_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_items_seller_id ON items(seller_id);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_offers_item_id ON offers(item_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller_id ON offers(seller_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Note: Authentication is disabled for now, so we allow all operations

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (authentication will be added later)
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on items" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on offers" ON offers FOR ALL USING (true) WITH CHECK (true);

-- Insert default user for testing
INSERT INTO users (id, name, email, photo_url, location, rating, earned, active_listings, total_listings)
VALUES (
  'user_123',
  'שרה כהן',
  'sarah@example.com',
  'https://picsum.photos/seed/sarah/200',
  'תל אביב, ישראל',
  4.8,
  1240,
  24,
  156
)
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON users TO anon, authenticated;
GRANT ALL ON items TO anon, authenticated;
GRANT ALL ON offers TO anon, authenticated;
