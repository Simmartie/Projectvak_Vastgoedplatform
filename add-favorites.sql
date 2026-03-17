-- Create the user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, property_id)
);

-- Row Level Security (RLS) for user_favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Allow public read access to user_favorites" ON user_favorites FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public insert to user_favorites" ON user_favorites FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Allow public delete from user_favorites" ON user_favorites FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Trigger to automatically update the 'interested' count on properties
CREATE OR REPLACE FUNCTION update_property_interested_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE properties
        SET interested = interested + 1
        WHERE id = NEW.property_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE properties
        SET interested = interested - 1
        WHERE id = OLD.property_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_property_interested_count ON user_favorites;

CREATE TRIGGER trg_update_property_interested_count
AFTER INSERT OR DELETE ON user_favorites
FOR EACH ROW
EXECUTE FUNCTION update_property_interested_count();

-- ==========================================
-- MOCK DATA FOR FAVORITES
-- ==========================================

-- First, reset all existing 'interested' counts to 0 to wipe out the old mock data
UPDATE properties SET interested = 0;

-- Now, let's insert a bunch of realistic mock favorites.
-- The trigger we created above will automatically increment the 'interested' count for each of these!
INSERT INTO user_favorites (user_id, property_id) VALUES
((SELECT id FROM users WHERE mock_id = '3'), (SELECT id FROM properties WHERE mock_id = 'prop-1')),
((SELECT id FROM users WHERE mock_id = '3'), (SELECT id FROM properties WHERE mock_id = 'prop-2')),
((SELECT id FROM users WHERE mock_id = '3'), (SELECT id FROM properties WHERE mock_id = 'prop-5')),
((SELECT id FROM users WHERE mock_id = '3'), (SELECT id FROM properties WHERE mock_id = 'prop-8')),
((SELECT id FROM users WHERE mock_id = 'k2'), (SELECT id FROM properties WHERE mock_id = 'prop-1')),
((SELECT id FROM users WHERE mock_id = 'k2'), (SELECT id FROM properties WHERE mock_id = 'prop-3')),
((SELECT id FROM users WHERE mock_id = 'k2'), (SELECT id FROM properties WHERE mock_id = 'prop-4')),
((SELECT id FROM users WHERE mock_id = 'k3'), (SELECT id FROM properties WHERE mock_id = 'prop-2')),
((SELECT id FROM users WHERE mock_id = 'k3'), (SELECT id FROM properties WHERE mock_id = 'prop-7')),
((SELECT id FROM users WHERE mock_id = 'k4'), (SELECT id FROM properties WHERE mock_id = 'prop-5')),
((SELECT id FROM users WHERE mock_id = 'k4'), (SELECT id FROM properties WHERE mock_id = 'prop-6')),
((SELECT id FROM users WHERE mock_id = 'k4'), (SELECT id FROM properties WHERE mock_id = 'prop-9')),
((SELECT id FROM users WHERE mock_id = 'k5'), (SELECT id FROM properties WHERE mock_id = 'prop-1')),
((SELECT id FROM users WHERE mock_id = 'k5'), (SELECT id FROM properties WHERE mock_id = 'prop-10')),
((SELECT id FROM users WHERE mock_id = 'k5'), (SELECT id FROM properties WHERE mock_id = 'prop-12')),
((SELECT id FROM users WHERE mock_id = 'k6'), (SELECT id FROM properties WHERE mock_id = 'prop-8')),
((SELECT id FROM users WHERE mock_id = 'k6'), (SELECT id FROM properties WHERE mock_id = 'prop-11')),
((SELECT id FROM users WHERE mock_id = 'k6'), (SELECT id FROM properties WHERE mock_id = 'prop-15')),
((SELECT id FROM users WHERE mock_id = 'k7'), (SELECT id FROM properties WHERE mock_id = 'prop-3')),
((SELECT id FROM users WHERE mock_id = 'k7'), (SELECT id FROM properties WHERE mock_id = 'prop-7')),
((SELECT id FROM users WHERE mock_id = 'k7'), (SELECT id FROM properties WHERE mock_id = 'prop-14')),
((SELECT id FROM users WHERE mock_id = 'k8'), (SELECT id FROM properties WHERE mock_id = 'prop-2')),
((SELECT id FROM users WHERE mock_id = 'k8'), (SELECT id FROM properties WHERE mock_id = 'prop-4')),
((SELECT id FROM users WHERE mock_id = 'k8'), (SELECT id FROM properties WHERE mock_id = 'prop-13')),
((SELECT id FROM users WHERE mock_id = 'k9'), (SELECT id FROM properties WHERE mock_id = 'prop-1')),
((SELECT id FROM users WHERE mock_id = 'k9'), (SELECT id FROM properties WHERE mock_id = 'prop-5')),
((SELECT id FROM users WHERE mock_id = 'k9'), (SELECT id FROM properties WHERE mock_id = 'prop-6')),
((SELECT id FROM users WHERE mock_id = 'k9'), (SELECT id FROM properties WHERE mock_id = 'prop-9')),
((SELECT id FROM users WHERE mock_id = 'k10'), (SELECT id FROM properties WHERE mock_id = 'prop-8')),
((SELECT id FROM users WHERE mock_id = 'k10'), (SELECT id FROM properties WHERE mock_id = 'prop-10')),
((SELECT id FROM users WHERE mock_id = 'k10'), (SELECT id FROM properties WHERE mock_id = 'prop-11')),
((SELECT id FROM users WHERE mock_id = 'v1'), (SELECT id FROM properties WHERE mock_id = 'prop-15')), 
((SELECT id FROM users WHERE mock_id = 'v2'), (SELECT id FROM properties WHERE mock_id = 'prop-14'))
ON CONFLICT DO NOTHING;
