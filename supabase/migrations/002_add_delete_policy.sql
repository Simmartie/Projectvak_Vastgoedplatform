-- Allow delete on appointments for demo
CREATE POLICY "Allow public delete appointments" ON appointments FOR DELETE USING (true);
