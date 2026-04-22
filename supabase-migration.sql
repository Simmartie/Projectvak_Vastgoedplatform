-- ==========================================
-- 1. SETUP ENUMS
-- ==========================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('makelaar', 'verkoper', 'koper');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_type AS ENUM ('huis', 'appartement', 'villa');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_status AS ENUM ('te-koop', 'onder-bod', 'verkocht');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE property_phase AS ENUM ('intake', 'fotografie', 'online', 'bezichtigingen', 'onderhandeling', 'afgerond');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bid_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE bouwmisdrijf_status AS ENUM ('Ja', 'Nee', 'In regularisatie', 'Onbekend');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE overstromingskans AS ENUM ('A', 'B', 'C', 'D');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE bodemattest_status AS ENUM ('Blanco', 'Niet blanco / Risico', 'Vrijstelling');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE elektriciteitskeuring_status AS ENUM ('Conform', 'Niet conform', 'Geen keuring');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE conformiteitsattest_status AS ENUM ('Ja', 'Nee', 'N.v.t.');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ==========================================
-- 2. CREATE TABLES
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mock_id TEXT UNIQUE, -- keeping track of our old mock IDs
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
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
  capakey TEXT,
  kadastraal_inkomen INTEGER,
  kadastrale_oppervlakte INTEGER,
  schatting INTEGER,
  bouwmisdrijf bouwmisdrijf_status,
  p_score overstromingskans,
  g_score overstromingskans,
  bodemattest bodemattest_status,
  epc_score INTEGER,
  elektriciteitskeuring elektriciteitskeuring_status,
  conformiteitsattest conformiteitsattest_status,
  conformiteitsattest_geldigheid DATE,
  erfdienstbaarheden TEXT[] DEFAULT '{}',
  mobiscore NUMERIC(3,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add property_id to users now that properties table exists (Idempotent column add)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='property_id') THEN
        ALTER TABLE users ADD COLUMN property_id UUID REFERENCES properties(id);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS visits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mock_id TEXT UNIQUE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id),
  date TIMESTAMPTZ NOT NULL,
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_suggestion TEXT,
  rating_suggestion INTEGER CHECK (rating_suggestion >= 1 AND rating_suggestion <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent column additions for visits
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='feedback_suggestion') THEN
        ALTER TABLE visits ADD COLUMN feedback_suggestion TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='rating_suggestion') THEN
        ALTER TABLE visits ADD COLUMN rating_suggestion INTEGER CHECK (rating_suggestion >= 1 AND rating_suggestion <= 5);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS bids (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mock_id TEXT UNIQUE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  status bid_status DEFAULT 'pending',
  comments TEXT,
  amount_suggestion INTEGER,
  status_suggestion bid_status,
  comment_suggestion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent column additions for bids
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bids' AND column_name='amount_suggestion') THEN
        ALTER TABLE bids ADD COLUMN amount_suggestion INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bids' AND column_name='status_suggestion') THEN
        ALTER TABLE bids ADD COLUMN status_suggestion bid_status;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bids' AND column_name='comment_suggestion') THEN
        ALTER TABLE bids ADD COLUMN comment_suggestion TEXT;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS appointments (
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

CREATE TABLE IF NOT EXISTS appointment_participants (
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
('v8', 'Daan Kerstens', 'daan@email.nl', 'verkoper'),
('v9', 'Milou van Dijk', 'v9@email.nl', 'verkoper'),
('v10', 'Sem Jansen', 'v10@email.nl', 'verkoper'),
('v11', 'Julia de Rijk', 'v11@email.nl', 'verkoper'),
('v12', 'Bram Verhoeven', 'v12@email.nl', 'verkoper'),
('v13', 'Lisa Brouwer', 'v13@email.nl', 'verkoper'),
('v14', 'Tim van der Berg', 'v14@email.nl', 'verkoper'),
('v15', 'Eva Koster', 'v15@email.nl', 'verkoper'),
('k6', 'Ruben Vos', 'ruben@email.nl', 'koper'),
('k7', 'Noa de Witte', 'noa@email.nl', 'koper'),
('k8', 'Lucas van Leeuwen', 'lucas@email.nl', 'koper'),
('k9', 'Lina de Ruiter', 'lina@email.nl', 'koper'),
('k10', 'Lars Maes', 'lars@email.nl', 'koper')
ON CONFLICT (mock_id) DO NOTHING;

-- ==========================================
-- 4. INSERT MOCK PROPERTIES
-- ==========================================
INSERT INTO properties (mock_id, address, city, postal_code, price, type, rooms, bedrooms, area, plot_size, build_year, energy_label, status, description, features, images, seller_id, views, interested, phase, neighborhood, capakey, kadastraal_inkomen, kadastrale_oppervlakte, schatting, bouwmisdrijf, p_score, g_score, bodemattest, epc_score, elektriciteitskeuring, conformiteitsattest, conformiteitsattest_geldigheid, erfdienstbaarheden, mobiscore) VALUES
('prop-1', 'Kerkstraat 123', 'Amsterdam', '1017 GC', 495000, 'huis', 5, 3, 120, 150, 1920, 'C', 'te-koop', 'Charmante eengezinswoning in het hart van Amsterdam. Volledig gerenoveerd met behoud van authentieke details. Rustige straat, nabij alle voorzieningen.', ARRAY['Eigen parkeerplaats', 'Tuin op het zuiden', 'Monumentaal pand', 'Energiezuinig', 'Dubbele beglazing'], ARRAY['/modern-dutch-house-exterior.jpg', '/modern-living-room.png', '/modern-kitchen.png', '/modern-home-office.png', '/luxury-apartment-interior.png'], (SELECT id FROM users WHERE mock_id = 'v1'), 342, 12, 'onderhandeling', '{"schools": [{"name": "De Regenboog Basisschool", "type": "basisonderwijs", "distance": 400, "rating": 4.5}, {"name": "Vossius Gymnasium", "type": "middelbaar", "distance": 1200, "rating": 4.8}], "sports": [{"name": "AFC Amsterdam Voetbalvereniging", "type": "Voetbal", "distance": 800}, {"name": "Sportcentrum Ookmeer", "type": "Fitness & Zwemmen", "distance": 1500}], "transport": [{"type": "tram", "line": "1", "stop": "Leidseplein", "distance": 300}, {"type": "bus", "line": "21", "stop": "Kerkstraat", "distance": 150}, {"type": "metro", "line": "52", "stop": "Vijzelgracht", "distance": 600}], "events": [{"name": "Grachtenfestival", "frequency": "Jaarlijks in augustus", "description": "Klassieke muziek langs de grachten"}, {"name": "Koningsdag", "frequency": "Jaarlijks 27 april", "description": "Groot straatfeest door heel Amsterdam"}]}', '12025C0345/00A000', 950, 150, 480000, 'Nee', 'A', 'A', 'Blanco', 235, 'Conform', 'Ja', '2030-05-15', ARRAY['Geen'], 9.2),

('prop-2', 'Herengracht 456', 'Amsterdam', '1017 BV', 875000, 'appartement', 4, 2, 95, NULL, 1880, 'B', 'te-koop', 'Luxe bovenwoning aan de gracht met schitterend uitzicht. Volledig gemoderniseerd met hoogwaardige afwerking.', ARRAY['Grachtuitzicht', 'Lift aanwezig', 'Balkon', 'Moderne keuken', 'Monumentaal pand'], ARRAY['/canal-house-amsterdam.jpg', '/luxury-apartment-interior.png', '/canal-view-balcony.jpg', '/modern-kitchen.png', '/modern-living-room.png'], (SELECT id FROM users WHERE mock_id = 'v2'), 567, 23, 'bezichtigingen', '{"schools": [{"name": "Montessori Basisschool", "type": "basisonderwijs", "distance": 600, "rating": 4.6}], "sports": [{"name": "Vondelgym", "type": "Fitness", "distance": 900}], "transport": [{"type": "tram", "line": "2", "stop": "Koningsplein", "distance": 200}], "events": [{"name": "Amsterdam Light Festival", "frequency": "Jaarlijks december-januari", "description": "Lichtkunstwerken langs de grachten"}]}', '12025C0346/00B000', 1200, 95, 860000, 'Nee', 'B', 'A', 'Blanco', 145, 'Conform', 'Ja', '2032-11-20', ARRAY['Gemene muur'], 9.5),

('prop-3', 'Beethovenstraat 789', 'Amsterdam', '1077 HV', 1250000, 'villa', 7, 4, 220, 400, 1935, 'A', 'te-koop', 'Statige vrijstaande villa met ruime tuin in Amsterdam Zuid. Volledig duurzaam gerenoveerd met zonnepanelen en warmtepomp.', ARRAY['Zonnepanelen', 'Warmtepomp', 'Eigen oprit', 'Grote tuin', 'Thuiskantoor', 'Garage'], ARRAY['/luxury-villa-amsterdam.jpg', '/spacious-garden.jpg', '/modern-home-office.png', '/modern-living-room.png', '/modern-kitchen.png'], (SELECT id FROM users WHERE mock_id = 'v3'), 189, 8, 'online', '{"schools": [{"name": "International School", "type": "basisonderwijs", "distance": 500, "rating": 4.9}, {"name": "Barlaeus Gymnasium", "type": "middelbaar", "distance": 800, "rating": 4.7}], "sports": [{"name": "Tennispark Oud-Zuid", "type": "Tennis", "distance": 600}, {"name": "Hockey Club Amsterdam", "type": "Hockey", "distance": 1000}], "transport": [{"type": "metro", "line": "52", "stop": "Station Zuid", "distance": 800}, {"type": "tram", "line": "5", "stop": "Beethovenstraat", "distance": 100}], "events": [{"name": "Museumplein Evenementen", "frequency": "Meerdere per jaar", "description": "Concerten en festivals op het Museumplein"}]}', '12025D0123/00C000', 2500, 400, 1200000, 'Nee', 'A', 'A', 'Blanco', 85, 'Conform', 'Ja', '2035-08-10', ARRAY['Nutsleidingen'], 8.8),

('prop-4', 'Tiensestraat 100', 'Leuven', '3000', 450000, 'huis', 4, 3, 140, 120, 1985, 'C', 'te-koop', 'Gezellige stadswoning in het centrum van Leuven. Ideaal voor jonge gezinnen.', ARRAY['Stadstuin', 'Dichtbij scholen', 'Gerenoveerde badkamer'], ARRAY['/modern-living-room.png', '/modern-kitchen.png'], (SELECT id FROM users WHERE mock_id = 'v4'), 120, 5, 'online', '{"schools": [{"name": "Heilig Hartinstituut", "type": "middelbaar", "distance": 600, "rating": 4.5}], "sports": [{"name": "Sportoase Philipssite", "type": "Fitness", "distance": 1500}], "transport": [{"type": "bus", "line": "2", "stop": "Naamsestraat", "distance": 200}], "events": [{"name": "Beleuvenissen", "frequency": "Zomer", "description": "Muziekfestival in de binnenstad"}]}', '24062A0456/00D000', 850, 120, 440000, 'Nee', 'A', 'B', 'Blanco', 210, 'Niet conform', 'Nee', '2024-05-12', ARRAY['Gemene muur'], 9.0),

('prop-5', 'Demerstraat 12', 'Hasselt', '3500', 320000, 'appartement', 3, 2, 90, NULL, 2010, 'A', 'te-koop', 'Modern appartement in de winkelstraat van Hasselt. Instapklaar en lichtrijk.', ARRAY['Balkon', 'Lift aanwezig', 'Energiezuinig'], ARRAY['/luxury-apartment-interior.png', '/modern-kitchen.png'], (SELECT id FROM users WHERE mock_id = 'v5'), 210, 10, 'onderhandeling', '{"schools": [{"name": "Virga Jessecollege", "type": "middelbaar", "distance": 400, "rating": 4.8}], "sports": [{"name": "Basic-Fit", "type": "Fitness", "distance": 300}], "transport": [{"type": "bus", "line": "4", "stop": "Dusartplein", "distance": 150}], "events": [{"name": "Winterland", "frequency": "Winter", "description": "Gezellige kerstmarkt"}]}', '71022B0789/00E000', 920, 90, 315000, 'Nee', 'A', 'A', 'Blanco', 95, 'Conform', 'Ja', '2035-12-01', ARRAY['Geen'], 8.9),

('prop-6', 'Bruul 50', 'Mechelen', '2800', 580000, 'huis', 5, 4, 180, 200, 1970, 'B', 'te-koop', 'Ruime gezinswoning met grote tuin in rustige buurt van Mechelen.', ARRAY['Grote tuin', 'Garage', 'Zonnepanelen'], ARRAY['/modern-dutch-house-exterior.jpg', '/spacious-garden.jpg'], (SELECT id FROM users WHERE mock_id = 'v6'), 85, 2, 'online', '{"schools": [{"name": "Scheppersinstituut", "type": "middelbaar", "distance": 800, "rating": 4.6}], "sports": [{"name": "De Nekker", "type": "Recreatie", "distance": 2500}], "transport": [{"type": "bus", "line": "1", "stop": "Grote Markt", "distance": 250}], "events": [{"name": "Maanrock", "frequency": "Zomer", "description": "Stadsfestival"}]}', '12025F0123/00F000', 1100, 200, 570000, 'In regularisatie', 'B', 'B', 'Niet blanco / Risico', 180, 'Geen keuring', 'Nee', NULL, ARRAY['Recht van doorgang / uitweg'], 8.5),

('prop-7', 'Meir 100', 'Antwerpen', '2000', 890000, 'appartement', 4, 2, 110, NULL, 1995, 'C', 'te-koop', 'Exclusief penthouse met zicht over de Meir.', ARRAY['Dakterras', 'Luxe afwerking', 'Airconditioning'], ARRAY['/canal-view-balcony.jpg', '/luxury-apartment-interior.png'], (SELECT id FROM users WHERE mock_id = 'v7'), 450, 18, 'bezichtigingen', '{"schools": [{"name": "Onze-Lieve-Vrouwecollege", "type": "middelbaar", "distance": 500, "rating": 4.7}], "sports": [{"name": "Stadium", "type": "Fitness", "distance": 1000}], "transport": [{"type": "tram", "line": "3", "stop": "Meir", "distance": 50}], "events": [{"name": "Rubensmarkt", "frequency": "Zomer", "description": "Historische markt"}]}', '11002A0456/00G000', 1450, 110, 880000, 'Nee', 'A', 'A', 'Blanco', 220, 'Conform', 'Ja', '2030-01-15', ARRAY['Geen'], 9.6),

('prop-8', 'Europalaan 10', 'Genk', '3600', 950000, 'villa', 6, 5, 260, 800, 2005, 'A', 'te-koop', 'Vrijstaande villa in een groene omgeving met zwembad.', ARRAY['Zwembad', 'Dubbele garage', 'Domotica'], ARRAY['/luxury-villa-amsterdam.jpg', '/modern-living-room.png'], (SELECT id FROM users WHERE mock_id = 'v8'), 310, 8, 'online', '{"schools": [{"name": "Sint-Jan Berchmanscollege", "type": "middelbaar", "distance": 1200, "rating": 4.4}], "sports": [{"name": "KRC Genk", "type": "Voetbal", "distance": 3000}], "transport": [{"type": "bus", "line": "G1", "stop": "Europalaan", "distance": 100}], "events": [{"name": "Genk on Stage", "frequency": "Zomer", "description": "Muziekfestival"}]}', '71016C0789/00H000', 2100, 800, 930000, 'Nee', 'A', 'A', 'Blanco', 110, 'Conform', 'Ja', '2030-06-30', ARRAY['Nutsleidingen'], 7.8),

('prop-9', 'Bondgenotenlaan 50', 'Leuven', '3000', 270000, 'appartement', 2, 1, 65, NULL, 1960, 'D', 'verkocht', 'Ideaal startersappartement nabij het station.', ARRAY['Centraal gelegen', 'Fietsenberging'], ARRAY['/modern-kitchen.png'], (SELECT id FROM users WHERE mock_id = 'v9'), 500, 25, 'afgerond', '{"schools": [{"name": "KU Leuven", "type": "hbo", "distance": 900, "rating": 4.9}], "sports": [{"name": "Klimzaal", "type": "Klimmen", "distance": 1500}], "transport": [{"type": "trein", "line": "IC", "stop": "Station", "distance": 300}], "events": [{"name": "Hapje Tapje", "frequency": "Zomer", "description": "Culinair festival"}]}', '24062B0123/00I000', 650, 65, 265000, 'Onbekend', 'C', 'C', 'Vrijstelling', 380, 'Niet conform', 'N.v.t.', NULL, ARRAY['Gemene muur'], 9.3),

('prop-10', 'Maastrichterstraat 5', 'Tongeren', '3700', 380000, 'huis', 4, 3, 150, 250, 1950, 'C', 'te-koop', 'Karaktervolle hoekwoning nabij het historisch centrum.', ARRAY['Karaktervol', 'Vernieuwd dak'], ARRAY['/modern-dutch-house-exterior.jpg'], (SELECT id FROM users WHERE mock_id = 'v10'), 150, 6, 'fotografie', '{"schools": [{"name": "Viio", "type": "middelbaar", "distance": 600, "rating": 4.5}], "sports": [{"name": "Sportpark De Motten", "type": "Recreatie", "distance": 800}], "transport": [{"type": "bus", "line": "4", "stop": "Centrum", "distance": 200}], "events": [{"name": "Antiekmarkt", "frequency": "Wekelijks", "description": "Grootste van de Benelux"}]}', '73083A0456/00J000', 780, 250, 375000, 'Nee', 'B', 'B', 'Blanco', 260, 'Geen keuring', 'Nee', NULL, ARRAY['Geen'], 8.1),

('prop-11', 'Louizalaan 200', 'Brussel', '1000', 1150000, 'appartement', 5, 3, 160, NULL, 1980, 'B', 'te-koop', 'Luxe appartement in het hart van Brussel. Gelegen aan de prestigieuze Louizalaan met alle faciliteiten op wandelafstand.', ARRAY['Conciërge', 'Ondergrondse parking', 'Parketvloer'], ARRAY['/luxury-apartment-interior.png', '/modern-home-office.png'], (SELECT id FROM users WHERE mock_id = 'v11'), 520, 22, 'bezichtigingen', '{"schools": [{"name": "Sint-Jan Berchmanscollege", "type": "middelbaar", "distance": 900, "rating": 4.8}], "sports": [{"name": "Basic-Fit Louiza", "type": "Fitness", "distance": 200}], "transport": [{"type": "tram", "line": "8", "stop": "Louiza", "distance": 100}, {"type": "metro", "line": "2", "stop": "Louiza", "distance": 150}], "events": [{"name": "Winterpret", "frequency": "Jaarlijks", "description": "Grote kerstmarkt in het centrum"}]}', '21004C0789/00K000', 1850, 160, 1100000, 'Nee', 'A', 'A', 'Blanco', 155, 'Conform', 'Ja', '2031-10-10', ARRAY['Geen'], 9.7),

('prop-12', 'Veldstraat 20', 'Gent', '9000', 650000, 'huis', 5, 4, 185, 130, 1925, 'E', 'te-koop', 'Historische rijwoning met koertje in het winkelwandelgebied van Gent. Deels te renoveren.', ARRAY['Authentieke elementen', 'Hoge plafonds'], ARRAY['/modern-dutch-house-exterior.jpg', '/modern-living-room.png'], (SELECT id FROM users WHERE mock_id = 'v12'), 280, 14, 'online', '{"schools": [{"name": "Sint-Bavohumaniora", "type": "middelbaar", "distance": 700, "rating": 4.7}], "sports": [{"name": "Sport Vlaanderen", "type": "Recreatie", "distance": 2000}], "transport": [{"type": "tram", "line": "1", "stop": "Korenmarkt", "distance": 150}], "events": [{"name": "Gentse Feesten", "frequency": "Zomer", "description": "10-daags stadsfestival"}]}', '44021A0123/00L000', 940, 130, 620000, 'In regularisatie', 'B', 'B', 'Niet blanco / Risico', 420, 'Niet conform', 'Nee', '2025-01-01', ARRAY['Gemene muur', 'Andere'], 9.4),

('prop-13', 'Steenstraat 14', 'Brugge', '8000', 490000, 'huis', 3, 2, 115, 80, 1890, 'D', 'onder-bod', 'Sfeervolle schipperswoning in het hart van Brugge. Romantische stadskoer.', ARRAY['Beschermd stadsgezicht', 'Gerenoveerde keuken'], ARRAY['/modern-kitchen.png'], (SELECT id FROM users WHERE mock_id = 'v13'), 345, 16, 'onderhandeling', '{"schools": [{"name": "Sint-Leocollege", "type": "middelbaar", "distance": 500, "rating": 4.6}], "sports": [{"name": "Jan Breydelstadion", "type": "Voetbal", "distance": 3500}], "transport": [{"type": "bus", "line": "1", "stop": "Markt", "distance": 300}], "events": [{"name": "Heilig Bloedprocessie", "frequency": "Jaarlijks", "description": "Historische ommegang"}]}', '31005B0456/00M000', 810, 80, 475000, 'Nee', 'A', 'A', 'Blanco', 315, 'Conform', 'Ja', '2032-02-14', ARRAY['Gemene muur'], 8.7),

('prop-14', 'Oudegracht 50', 'Utrecht', '3511 AP', 850000, 'appartement', 4, 2, 105, NULL, 1850, 'B', 'te-koop', 'Uniek appartement met werfkelder aan de gracht.', ARRAY['Werfkelder', 'Grachtzicht', 'Vloerverwarming'], ARRAY['/canal-house-amsterdam.jpg', '/canal-view-balcony.jpg'], (SELECT id FROM users WHERE mock_id = 'v14'), 610, 30, 'online', '{"schools": [{"name": "Universiteit Utrecht", "type": "hbo", "distance": 1500, "rating": 4.9}], "sports": [{"name": "FC Utrecht", "type": "Voetbal", "distance": 4000}], "transport": [{"type": "bus", "line": "2", "stop": "Domplein", "distance": 200}], "events": [{"name": "Filmfestival", "frequency": "Najaar", "description": "Nederlands Film Festival"}]}', '12025G0789/00N000', 1350, 105, 840000, 'Nee', 'D', 'D', 'Blanco', 160, 'Conform', 'Ja', '2030-11-11', ARRAY['Geen'], 9.1),

('prop-15', 'Parklaan 10', 'Rotterdam', '3016 BB', 1450000, 'villa', 8, 5, 280, 450, 1910, 'A', 'te-koop', 'Statig herenhuis in het prestigieuze Scheepvaartkwartier. Aan de rand van het park.', ARRAY['Uitzicht op park', 'Historisch', 'Wijnkelder'], ARRAY['/luxury-villa-amsterdam.jpg', '/spacious-garden.jpg', '/modern-living-room.png'], (SELECT id FROM users WHERE mock_id = 'v15'), 850, 40, 'intake', '{"schools": [{"name": "Erasmus Gymnasium", "type": "middelbaar", "distance": 1000, "rating": 4.8}], "sports": [{"name": "Sparta", "type": "Voetbal", "distance": 5000}], "transport": [{"type": "tram", "line": "7", "stop": "Meent", "distance": 150}], "events": [{"name": "North Sea Jazz", "frequency": "Zomer", "description": "Groot jazzfestival"}]}', '12025H0123/00O000', 2800, 450, 1400000, 'Nee', 'B', 'B', 'Blanco', 80, 'Conform', 'Ja', '2034-03-22', ARRAY['Andere'], 8.6)
ON CONFLICT (mock_id) DO NOTHING;

-- ==========================================
-- 5. UPDATE USER PROPERTY_IDs (Verkopers)
-- ==========================================
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-1') WHERE mock_id = 'v1';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-2') WHERE mock_id = 'v2';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-3') WHERE mock_id = 'v3';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-4') WHERE mock_id = 'v4';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-5') WHERE mock_id = 'v5';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-6') WHERE mock_id = 'v6';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-7') WHERE mock_id = 'v7';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-8') WHERE mock_id = 'v8';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-9') WHERE mock_id = 'v9';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-10') WHERE mock_id = 'v10';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-11') WHERE mock_id = 'v11';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-12') WHERE mock_id = 'v12';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-13') WHERE mock_id = 'v13';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-14') WHERE mock_id = 'v14';
UPDATE users SET property_id = (SELECT id FROM properties WHERE mock_id = 'prop-15') WHERE mock_id = 'v15';

-- ==========================================
-- 6. INSERT VISITS
-- ==========================================
INSERT INTO visits (mock_id, property_id, buyer_id, date, feedback, rating) VALUES
('v1', (SELECT id FROM properties WHERE mock_id = 'prop-1'), (SELECT id FROM users WHERE mock_id = '3'), '2024-01-15T00:00:00Z', 'Prachtige woning, zeer geïnteresseerd!', 5),
('v2', (SELECT id FROM properties WHERE mock_id = 'prop-1'), (SELECT id FROM users WHERE mock_id = 'k2'), '2024-01-18T00:00:00Z', 'Mooie locatie maar iets te klein voor ons gezin', 3),
('v3', (SELECT id FROM properties WHERE mock_id = 'prop-5'), (SELECT id FROM users WHERE mock_id = 'k3'), '2024-01-22T00:00:00Z', 'Prachtig uitzicht!', 5),
('v4', (SELECT id FROM properties WHERE mock_id = 'prop-4'), (SELECT id FROM users WHERE mock_id = 'k6'), '2024-02-10T00:00:00Z', 'Zeer mooie tuin, maar veel werk aan.', 4),
('v5', (SELECT id FROM properties WHERE mock_id = 'prop-7'), (SELECT id FROM users WHERE mock_id = 'k8'), '2024-02-15T00:00:00Z', 'Fantastisch penthouse, adembenemend uitzicht.', 5),
('v6', (SELECT id FROM properties WHERE mock_id = 'prop-8'), (SELECT id FROM users WHERE mock_id = 'k10'), '2024-02-20T00:00:00Z', 'Mooie villa, perfect voor ons gezin.', 5),
('v7', (SELECT id FROM properties WHERE mock_id = 'prop-2'), (SELECT id FROM users WHERE mock_id = 'k4'), '2024-03-01T00:00:00Z', 'Heel gaaf appartement, maar te duur.', 4),
('v8', (SELECT id FROM properties WHERE mock_id = 'prop-3'), (SELECT id FROM users WHERE mock_id = '3'), '2024-03-02T00:00:00Z', 'Geweldig, hier gaan we een bod op uitbrengen!', 5),
('v9', (SELECT id FROM properties WHERE mock_id = 'prop-9'), (SELECT id FROM users WHERE mock_id = 'k5'), '2024-02-28T00:00:00Z', 'Leuk voor een starter, maar we hebben meer ruimte nodig.', 3),
('v10', (SELECT id FROM properties WHERE mock_id = 'prop-12'), (SELECT id FROM users WHERE mock_id = 'k7'), '2024-03-03T00:00:00Z', 'Interessant renovatieproject.', 4),
('v11', (SELECT id FROM properties WHERE mock_id = 'prop-14'), (SELECT id FROM users WHERE mock_id = 'k9'), '2024-02-25T00:00:00Z', 'De werfkelder is uniek!', 5)
ON CONFLICT (mock_id) DO NOTHING;

-- ==========================================
-- 7. INSERT BIDS
-- ==========================================
INSERT INTO bids (mock_id, property_id, buyer_id, amount, status, comments, created_at) 
VALUES
('b1', (SELECT id FROM properties WHERE mock_id = 'prop-1'), (SELECT id FROM users WHERE mock_id = '3'), 485000, 'pending', 'Eerste bod, graag binnen 48 uur reactie', '2024-01-20T00:00:00Z'),
('b2', (SELECT id FROM properties WHERE mock_id = 'prop-4'), (SELECT id FROM users WHERE mock_id = 'k6'), 430000, 'rejected', 'Te laag bod', '2024-02-12T00:00:00Z'),
('b3', (SELECT id FROM properties WHERE mock_id = 'prop-7'), (SELECT id FROM users WHERE mock_id = 'k8'), 880000, 'pending', 'Bod onder voorbehoud van financiering', '2024-02-16T00:00:00Z'),
('b4', (SELECT id FROM properties WHERE mock_id = 'prop-2'), (SELECT id FROM users WHERE mock_id = 'k2'), 850000, 'pending', 'Bod zonder voorbehoud', '2024-03-02T00:00:00Z'),
('b5', (SELECT id FROM properties WHERE mock_id = 'prop-3'), (SELECT id FROM users WHERE mock_id = '3'), 1200000, 'pending', 'Graag overname meubilair bespreken', '2024-03-03T00:00:00Z'),
('b6', (SELECT id FROM properties WHERE mock_id = 'prop-9'), (SELECT id FROM users WHERE mock_id = 'k3'), 270000, 'accepted', 'Bod geaccepteerd!', '2024-03-01T00:00:00Z'),
('b7', (SELECT id FROM properties WHERE mock_id = 'prop-13'), (SELECT id FROM users WHERE mock_id = 'k4'), 480000, 'pending', 'Mooi pand, stevig bod.', '2024-03-01T12:00:00Z'),
('b8', (SELECT id FROM properties WHERE mock_id = 'prop-14'), (SELECT id FROM users WHERE mock_id = 'k9'), 820000, 'rejected', 'Te ver onder de vraagprijs', '2024-02-26T00:00:00Z')
ON CONFLICT (mock_id) DO NOTHING;

-- Override the `created_at` specifically for this bid
UPDATE bids SET created_at = '2024-01-20T00:00:00Z' WHERE mock_id = 'b1';
UPDATE bids SET created_at = '2024-02-12T00:00:00Z' WHERE mock_id = 'b2';
UPDATE bids SET created_at = '2024-02-16T00:00:00Z' WHERE mock_id = 'b3';
UPDATE bids SET created_at = '2024-03-02T00:00:00Z' WHERE mock_id = 'b4';
UPDATE bids SET created_at = '2024-03-03T00:00:00Z' WHERE mock_id = 'b5';
UPDATE bids SET created_at = '2024-03-01T00:00:00Z' WHERE mock_id = 'b6';
UPDATE bids SET created_at = '2024-03-01T12:00:00Z' WHERE mock_id = 'b7';
UPDATE bids SET created_at = '2024-02-26T00:00:00Z' WHERE mock_id = 'b8';

-- ==========================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_participants ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read access to properties" ON properties FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read access to visits" ON visits FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read access to bids" ON bids FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read access to appointments" ON appointments FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public read access to participants" ON appointment_participants FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Warning: These are basic policies. For writing data, you probably want to enable writes for authenticated users using `true` for development.
DO $$ BEGIN
    CREATE POLICY "Allow public insert" ON properties FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public update" ON properties FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public insert" ON users FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public update" ON users FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public insert" ON visits FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public update" ON visits FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public insert" ON bids FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public update" ON bids FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public insert" ON appointments FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public update" ON appointments FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public insert" ON appointment_participants FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public update" ON appointment_participants FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public delete" ON appointments FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public delete" ON appointment_participants FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;
