-- ==========================================
-- 1. SETUP ENUMS
-- ==========================================
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
-- 2. ALTER TABLE ADD COLUMNS
-- ==========================================
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS capakey TEXT,
ADD COLUMN IF NOT EXISTS kadastraal_inkomen INTEGER,
ADD COLUMN IF NOT EXISTS kadastrale_oppervlakte INTEGER,
ADD COLUMN IF NOT EXISTS schatting INTEGER,
ADD COLUMN IF NOT EXISTS bouwmisdrijf bouwmisdrijf_status,
ADD COLUMN IF NOT EXISTS p_score overstromingskans,
ADD COLUMN IF NOT EXISTS g_score overstromingskans,
ADD COLUMN IF NOT EXISTS bodemattest bodemattest_status,
ADD COLUMN IF NOT EXISTS epc_score INTEGER,
ADD COLUMN IF NOT EXISTS elektriciteitskeuring elektriciteitskeuring_status,
ADD COLUMN IF NOT EXISTS conformiteitsattest conformiteitsattest_status,
ADD COLUMN IF NOT EXISTS conformiteitsattest_geldigheid DATE,
ADD COLUMN IF NOT EXISTS erfdienstbaarheden TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS mobiscore NUMERIC(3,1);

-- ==========================================
-- 3. UPDATE MOCK PROPERTIES
-- ==========================================
UPDATE properties SET 
  capakey = '12025C0345/00A000', kadastraal_inkomen = 950, kadastrale_oppervlakte = 150, schatting = 480000, bouwmisdrijf = 'Nee', p_score = 'A', g_score = 'A', bodemattest = 'Blanco', epc_score = 235, elektriciteitskeuring = 'Conform', conformiteitsattest = 'Ja', conformiteitsattest_geldigheid = '2030-05-15', erfdienstbaarheden = ARRAY['Geen'], mobiscore = 9.2 
WHERE mock_id = 'prop-1';

UPDATE properties SET 
  capakey = '12025C0346/00B000', kadastraal_inkomen = 1200, kadastrale_oppervlakte = 95, schatting = 860000, bouwmisdrijf = 'Nee', p_score = 'B', g_score = 'A', bodemattest = 'Blanco', epc_score = 145, elektriciteitskeuring = 'Conform', conformiteitsattest = 'Ja', conformiteitsattest_geldigheid = '2032-11-20', erfdienstbaarheden = ARRAY['Gemene muur'], mobiscore = 9.5 
WHERE mock_id = 'prop-2';

UPDATE properties SET 
  capakey = '12025D0123/00C000', kadastraal_inkomen = 2500, kadastrale_oppervlakte = 400, schatting = 1200000, bouwmisdrijf = 'Nee', p_score = 'A', g_score = 'A', bodemattest = 'Blanco', epc_score = 85, elektriciteitskeuring = 'Conform', conformiteitsattest = 'Ja', conformiteitsattest_geldigheid = '2035-08-10', erfdienstbaarheden = ARRAY['Nutsleidingen'], mobiscore = 8.8 
WHERE mock_id = 'prop-3';

UPDATE properties SET 
  capakey = '24062A0456/00D000', kadastraal_inkomen = 850, kadastrale_oppervlakte = 120, schatting = 440000, bouwmisdrijf = 'Nee', p_score = 'A', g_score = 'B', bodemattest = 'Blanco', epc_score = 210, elektriciteitskeuring = 'Niet conform', conformiteitsattest = 'Nee', conformiteitsattest_geldigheid = '2024-05-12', erfdienstbaarheden = ARRAY['Gemene muur'], mobiscore = 9.0 
WHERE mock_id = 'prop-4';

UPDATE properties SET 
  capakey = '71022B0789/00E000', kadastraal_inkomen = 920, kadastrale_oppervlakte = 90, schatting = 315000, bouwmisdrijf = 'Nee', p_score = 'A', g_score = 'A', bodemattest = 'Blanco', epc_score = 95, elektriciteitskeuring = 'Conform', conformiteitsattest = 'Ja', conformiteitsattest_geldigheid = '2035-12-01', erfdienstbaarheden = ARRAY['Geen'], mobiscore = 8.9 
WHERE mock_id = 'prop-5';

UPDATE properties SET 
  capakey = '12025F0123/00F000', kadastraal_inkomen = 1100, kadastrale_oppervlakte = 200, schatting = 570000, bouwmisdrijf = 'In regularisatie', p_score = 'B', g_score = 'B', bodemattest = 'Niet blanco / Risico', epc_score = 180, elektriciteitskeuring = 'Geen keuring', conformiteitsattest = 'Nee', conformiteitsattest_geldigheid = NULL, erfdienstbaarheden = ARRAY['Recht van doorgang / uitweg'], mobiscore = 8.5 
WHERE mock_id = 'prop-6';

UPDATE properties SET 
  capakey = '11002A0456/00G000', kadastraal_inkomen = 1450, kadastrale_oppervlakte = 110, schatting = 880000, bouwmisdrijf = 'Nee', p_score = 'A', g_score = 'A', bodemattest = 'Blanco', epc_score = 220, elektriciteitskeuring = 'Conform', conformiteitsattest = 'Ja', conformiteitsattest_geldigheid = '2030-01-15', erfdienstbaarheden = ARRAY['Geen'], mobiscore = 9.6 
WHERE mock_id = 'prop-7';

UPDATE properties SET 
  capakey = '71016C0789/00H000', kadastraal_inkomen = 2100, kadastrale_oppervlakte = 800, schatting = 930000, bouwmisdrijf = 'Nee', p_score = 'A', g_score = 'A', bodemattest = 'Blanco', epc_score = 110, elektriciteitskeuring = 'Conform', conformiteitsattest = 'Ja', conformiteitsattest_geldigheid = '2030-06-30', erfdienstbaarheden = ARRAY['Nutsleidingen'], mobiscore = 7.8 
WHERE mock_id = 'prop-8';

UPDATE properties SET 
  capakey = '24062B0123/00I000', kadastraal_inkomen = 650, kadastrale_oppervlakte = 65, schatting = 265000, bouwmisdrijf = 'Onbekend', p_score = 'C', g_score = 'C', bodemattest = 'Vrijstelling', epc_score = 380, elektriciteitskeuring = 'Niet conform', conformiteitsattest = 'N.v.t.', conformiteitsattest_geldigheid = NULL, erfdienstbaarheden = ARRAY['Gemene muur'], mobiscore = 9.3 
WHERE mock_id = 'prop-9';

UPDATE properties SET 
  capakey = '73083A0456/00J000', kadastraal_inkomen = 780, kadastrale_oppervlakte = 250, schatting = 375000, bouwmisdrijf = 'Nee', p_score = 'B', g_score = 'B', bodemattest = 'Blanco', epc_score = 260, elektriciteitskeuring = 'Geen keuring', conformiteitsattest = 'Nee', conformiteitsattest_geldigheid = NULL, erfdienstbaarheden = ARRAY['Geen'], mobiscore = 8.1 
WHERE mock_id = 'prop-10';

UPDATE properties SET 
  capakey = '21004C0789/00K000', kadastraal_inkomen = 1850, kadastrale_oppervlakte = 160, schatting = 1100000, bouwmisdrijf = 'Nee', p_score = 'A', g_score = 'A', bodemattest = 'Blanco', epc_score = 155, elektriciteitskeuring = 'Conform', conformiteitsattest = 'Ja', conformiteitsattest_geldigheid = '2031-10-10', erfdienstbaarheden = ARRAY['Geen'], mobiscore = 9.7 
WHERE mock_id = 'prop-11';

UPDATE properties SET 
  capakey = '44021A0123/00L000', kadastraal_inkomen = 940, kadastrale_oppervlakte = 130, schatting = 620000, bouwmisdrijf = 'In regularisatie', p_score = 'B', g_score = 'B', bodemattest = 'Niet blanco / Risico', epc_score = 420, elektriciteitskeuring = 'Niet conform', conformiteitsattest = 'Nee', conformiteitsattest_geldigheid = '2025-01-01', erfdienstbaarheden = ARRAY['Gemene muur', 'Andere'], mobiscore = 9.4 
WHERE mock_id = 'prop-12';

UPDATE properties SET 
  capakey = '31005B0456/00M000', kadastraal_inkomen = 810, kadastrale_oppervlakte = 80, schatting = 475000, bouwmisdrijf = 'Nee', p_score = 'A', g_score = 'A', bodemattest = 'Blanco', epc_score = 315, elektriciteitskeuring = 'Conform', conformiteitsattest = 'Ja', conformiteitsattest_geldigheid = '2032-02-14', erfdienstbaarheden = ARRAY['Gemene muur'], mobiscore = 8.7 
WHERE mock_id = 'prop-13';

UPDATE properties SET 
  capakey = '12025G0789/00N000', kadastraal_inkomen = 1350, kadastrale_oppervlakte = 105, schatting = 840000, bouwmisdrijf = 'Nee', p_score = 'D', g_score = 'D', bodemattest = 'Blanco', epc_score = 160, elektriciteitskeuring = 'Conform', conformiteitsattest = 'Ja', conformiteitsattest_geldigheid = '2030-11-11', erfdienstbaarheden = ARRAY['Geen'], mobiscore = 9.1 
WHERE mock_id = 'prop-14';

UPDATE properties SET 
  capakey = '12025H0123/00O000', kadastraal_inkomen = 2800, kadastrale_oppervlakte = 450, schatting = 1400000, bouwmisdrijf = 'Nee', p_score = 'B', g_score = 'B', bodemattest = 'Blanco', epc_score = 80, elektriciteitskeuring = 'Conform', conformiteitsattest = 'Ja', conformiteitsattest_geldigheid = '2034-03-22', erfdienstbaarheden = ARRAY['Andere'], mobiscore = 8.6 
WHERE mock_id = 'prop-15';
