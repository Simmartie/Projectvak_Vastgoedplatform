-- ==========================================
-- 1. SETUP ENUMS
-- ==========================================
CREATE TYPE user_role AS ENUM ('makelaar', 'verkoper', 'koper');
CREATE TYPE property_type AS ENUM ('huis', 'appartement', 'villa');
CREATE TYPE property_status AS ENUM ('te-koop', 'onder-bod', 'verkocht');
CREATE TYPE property_phase AS ENUM ('intake', 'fotografie', 'online', 'bezichtigingen', 'onderhandeling', 'afgerond');
CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected');

-- ==========================================
-- 2. CREATE TABLES
-- ==========================================
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mock_id TEXT UNIQUE, -- keeping track of our old mock IDs
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mock_id TEXT UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  price INTEGER NOT NULL,
  previous_price INTEGER,
  type property_type NOT NULL,
  rooms INTEGER NOT NULL,
  bedrooms INTEGER NOT NULL,
  area INTEGER NOT NULL,
  plot_size INTEGER,
  build_year INTEGER NOT NULL,
  energy_label TEXT NOT NULL,
  status property_status NOT NULL DEFAULT 'te-koop',
  description TEXT,
  features TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  seller_id UUID REFERENCES users(id),
  views INTEGER DEFAULT 0,
  interested INTEGER DEFAULT 0,
  phase property_phase NOT NULL DEFAULT 'intake',
  neighborhood JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add property_id to users now that properties table exists
ALTER TABLE users ADD COLUMN property_id UUID REFERENCES properties(id);

CREATE TABLE visits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mock_id TEXT UNIQUE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id),
  date TIMESTAMPTZ NOT NULL,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mock_id TEXT UNIQUE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  status bid_status DEFAULT 'pending',
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mock_id TEXT UNIQUE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointment_participants (
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (appointment_id, user_id)
);

-- ==========================================
-- 3. INSERT MOCK USERS
-- ==========================================
INSERT INTO users (mock_id, name, email, role) VALUES
('1', 'Jan Janssen', 'jan@makelaardij.nl', 'makelaar'),
('3', 'Pieter de Vries', 'pieter@email.nl', 'koper'),
('k2', 'Sarah de Jong', 'sarah@email.nl', 'koper'),
('k3', 'Jan Peeters', 'jan.peeters@email.nl', 'koper'),
('k4', 'Lotte Meijer', 'lotte@email.nl', 'koper'),
('k5', 'Tom Hendriks', 'tom@email.nl', 'koper'),
('v1', 'Maria Peters', 'maria@email.nl', 'verkoper'),
('v2', 'Klaas Dijkstra', 'v2@email.nl', 'verkoper'),
('v3', 'Sanne Visser', 'v3@email.nl', 'verkoper'),
('v4', 'Johan de Boer', 'v4@email.nl', 'verkoper'),
('v5', 'Emma Bakker', 'v5@email.nl', 'verkoper'),
('v6', 'Luuk de Jong', 'v6@email.nl', 'verkoper'),
('v7', 'Sophie Mulder', 'v7@email.nl', 'verkoper'),
('v8', 'Daan Kerstens', 'v8@email.nl', 'verkoper'),
('v9', 'Milou van Dijk', 'v9@email.nl', 'verkoper'),
('v10', 'Sem Jansen', 'v10@email.nl', 'verkoper');

-- ==========================================
-- 4. INSERT MOCK PROPERTIES
-- ==========================================
INSERT INTO properties (mock_id, address, city, postal_code, price, type, rooms, bedrooms, area, plot_size, build_year, energy_label, status, description, features, images, seller_id, views, interested, phase, neighborhood) VALUES
('prop-1', 'Kerkstraat 123', 'Amsterdam', '1017 GC', 495000, 'huis', 5, 3, 120, 150, 1920, 'C', 'te-koop', 'Charmante eengezinswoning in het hart van Amsterdam. Volledig gerenoveerd met behoud van authentieke details. Rustige straat, nabij alle voorzieningen.', ARRAY['Eigen parkeerplaats', 'Tuin op het zuiden', 'Monumentaal pand', 'Energiezuinig', 'Dubbele beglazing'], ARRAY['/modern-dutch-house-exterior.jpg', '/modern-living-room.png', '/modern-kitchen.png', '/modern-home-office.png', '/luxury-apartment-interior.png'], (SELECT id FROM users WHERE mock_id = 'v1'), 342, 12, 'onderhandeling', '{"schools": [{"name": "De Regenboog Basisschool", "type": "basisonderwijs", "distance": 400, "rating": 4.5}, {"name": "Vossius Gymnasium", "type": "middelbaar", "distance": 1200, "rating": 4.8}], "sports": [{"name": "AFC Amsterdam Voetbalvereniging", "type": "Voetbal", "distance": 800}, {"name": "Sportcentrum Ookmeer", "type": "Fitness & Zwemmen", "distance": 1500}], "transport": [{"type": "tram", "line": "1", "stop": "Leidseplein", "distance": 300}, {"type": "bus", "line": "21", "stop": "Kerkstraat", "distance": 150}, {"type": "metro", "line": "52", "stop": "Vijzelgracht", "distance": 600}], "events": [{"name": "Grachtenfestival", "frequency": "Jaarlijks in augustus", "description": "Klassieke muziek langs de grachten"}, {"name": "Koningsdag", "frequency": "Jaarlijks 27 april", "description": "Groot straatfeest door heel Amsterdam"}]}'),

('prop-2', 'Herengracht 456', 'Amsterdam', '1017 BV', 875000, 'appartement', 4, 2, 95, NULL, 1880, 'B', 'te-koop', 'Luxe bovenwoning aan de gracht met schitterend uitzicht. Volledig gemoderniseerd met hoogwaardige afwerking.', ARRAY['Grachtuitzicht', 'Lift aanwezig', 'Balkon', 'Moderne keuken', 'Monumentaal pand'], ARRAY['/canal-house-amsterdam.jpg', '/luxury-apartment-interior.png', '/canal-view-balcony.jpg', '/modern-kitchen.png', '/modern-living-room.png'], (SELECT id FROM users WHERE mock_id = 'v2'), 567, 23, 'bezichtigingen', '{"schools": [{"name": "Montessori Basisschool", "type": "basisonderwijs", "distance": 600, "rating": 4.6}], "sports": [{"name": "Vondelgym", "type": "Fitness", "distance": 900}], "transport": [{"type": "tram", "line": "2", "stop": "Koningsplein", "distance": 200}], "events": [{"name": "Amsterdam Light Festival", "frequency": "Jaarlijks december-januari", "description": "Lichtkunstwerken langs de grachten"}]}'),

('prop-3', 'Beethovenstraat 789', 'Amsterdam', '1077 HV', 1250000, 'villa', 7, 4, 220, 400, 1935, 'A', 'te-koop', 'Statige vrijstaande villa met ruime tuin in Amsterdam Zuid. Volledig duurzaam gerenoveerd met zonnepanelen en warmtepomp.', ARRAY['Zonnepanelen', 'Warmtepomp', 'Eigen oprit', 'Grote tuin', 'Thuiskantoor', 'Garage'], ARRAY['/luxury-villa-amsterdam.jpg', '/spacious-garden.jpg', '/modern-home-office.png', '/modern-living-room.png', '/modern-kitchen.png'], (SELECT id FROM users WHERE mock_id = 'v3'), 189, 8, 'online', '{"schools": [{"name": "International School", "type": "basisonderwijs", "distance": 500, "rating": 4.9}, {"name": "Barlaeus Gymnasium", "type": "middelbaar", "distance": 800, "rating": 4.7}], "sports": [{"name": "Tennispark Oud-Zuid", "type": "Tennis", "distance": 600}, {"name": "Hockey Club Amsterdam", "type": "Hockey", "distance": 1000}], "transport": [{"type": "metro", "line": "52", "stop": "Station Zuid", "distance": 800}, {"type": "tram", "line": "5", "stop": "Beethovenstraat", "distance": 100}], "events": [{"name": "Museumplein Evenementen", "frequency": "Meerdere per jaar", "description": "Concerten en festivals op het Museumplein"}]}');

-- (You can add the other properties later using the application itself, or they can be inserted manually if desired. We only put 3 here to keep the script size manageable)

-- ==========================================
-- 5. UPDATE USER PROPERTY_IDs (Verkopers)
-- ==========================================
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-1') WHERE mock_id = 'v1';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-2') WHERE mock_id = 'v2';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-3') WHERE mock_id = 'v3';

-- ==========================================
-- 6. INSERT VISITS
-- ==========================================
INSERT INTO visits (mock_id, property_id, buyer_id, date, feedback, rating) VALUES
('v1', (SELECT id FROM properties WHERE mock_id = 'prop-1'), (SELECT id FROM users WHERE mock_id = '3'), '2024-01-15T00:00:00Z', 'Prachtige woning, zeer geïnteresseerd!', 5),
('v2', (SELECT id FROM properties WHERE mock_id = 'prop-1'), (SELECT id FROM users WHERE mock_id = 'k2'), '2024-01-18T00:00:00Z', 'Mooie locatie maar iets te klein voor ons gezin', 3),
('v3', (SELECT id FROM properties WHERE mock_id = 'prop-5'), (SELECT id FROM users WHERE mock_id = 'k3'), '2024-01-22T00:00:00Z', 'Prachtig uitzicht!', 5);

-- ==========================================
-- 7. INSERT BIDS
-- ==========================================
INSERT INTO bids (mock_id, property_id, buyer_id, amount, status, comments, created_at) 
VALUES
('b1', (SELECT id FROM properties WHERE mock_id = 'prop-1'), (SELECT id FROM users WHERE mock_id = '3'), 485000, 'pending', 'Eerste bod, graag binnen 48 uur reactie', '2024-01-20T00:00:00Z');
-- Override the `created_at` specifically for this bid
UPDATE bids SET created_at = '2024-01-20T00:00:00Z' WHERE mock_id = 'b1';

-- ==========================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access to visits" ON visits FOR SELECT USING (true);
CREATE POLICY "Allow public read access to bids" ON bids FOR SELECT USING (true);
CREATE POLICY "Allow public read access to appointments" ON appointments FOR SELECT USING (true);
CREATE POLICY "Allow public read access to participants" ON appointment_participants FOR SELECT USING (true);

-- Warning: These are basic policies. For writing data, you probably want to enable writes for authenticated users using `true` for development.
CREATE POLICY "Allow public insert" ON properties FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON properties FOR UPDATE USING (true);
CREATE POLICY "Allow public insert" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON users FOR UPDATE USING (true);
CREATE POLICY "Allow public insert" ON visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON visits FOR UPDATE USING (true);
CREATE POLICY "Allow public insert" ON bids FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON bids FOR UPDATE USING (true);
CREATE POLICY "Allow public insert" ON appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON appointments FOR UPDATE USING (true);
CREATE POLICY "Allow public insert" ON appointment_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON appointment_participants FOR UPDATE USING (true);
