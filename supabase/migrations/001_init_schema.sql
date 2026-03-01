-- Vastgoedplatform: Initial schema matching mock data structure
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor) or via Supabase CLI

-- Users/profiles (maps to MOCK_USERS)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('makelaar', 'verkoper', 'koper')),
  property_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties (maps to MOCK_PROPERTIES)
-- Uses JSONB for nested: features, images, visits, bids, neighborhood
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  seller_id TEXT NOT NULL REFERENCES profiles(id),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  price NUMERIC NOT NULL,
  previous_price NUMERIC,
  type TEXT NOT NULL CHECK (type IN ('huis', 'appartement', 'villa')),
  rooms INTEGER NOT NULL,
  bedrooms INTEGER NOT NULL,
  area NUMERIC NOT NULL,
  plot_size NUMERIC,
  build_year INTEGER NOT NULL,
  energy_label TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('te-koop', 'onder-bod', 'verkocht')),
  description TEXT NOT NULL,
  features JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  views INTEGER DEFAULT 0,
  visits JSONB DEFAULT '[]',
  bids JSONB DEFAULT '[]',
  interested INTEGER DEFAULT 0,
  phase TEXT NOT NULL,
  neighborhood JSONB NOT NULL DEFAULT '{}',
  lat NUMERIC,
  lng NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointments (maps to MOCK_APPOINTMENTS)
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  property_id TEXT REFERENCES properties(id),
  participant_ids JSONB NOT NULL DEFAULT '[]',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- City coordinates for map (optional lookup table)
CREATE TABLE IF NOT EXISTS city_coordinates (
  city_key TEXT PRIMARY KEY,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL
);

-- Enable RLS (optional - can disable for demo)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_coordinates ENABLE ROW LEVEL SECURITY;

-- Allow public read for demo (replace with proper auth later)
CREATE POLICY "Allow public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow public read properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Allow public read appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Allow public read city_coordinates" ON city_coordinates FOR SELECT USING (true);

-- Allow insert/update for demo (optional - for seed script)
CREATE POLICY "Allow public insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert properties" ON properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert appointments" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert city_coordinates" ON city_coordinates FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update profiles" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Allow public update properties" ON properties FOR UPDATE USING (true);
CREATE POLICY "Allow public update appointments" ON appointments FOR UPDATE USING (true);
