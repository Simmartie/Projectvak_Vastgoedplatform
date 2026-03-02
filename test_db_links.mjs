import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://urpbfrxjobjemjghhlvs.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_pkDLHHWSZGklQJXBnB6ggw_OB6wBles';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: users, error: errU } = await supabase.from('users').select('id, mock_id, name, property_id').in('role', ['verkoper']);
  console.log("Sellers:");
  console.table(users);
  
  const { data: properties, error: errP } = await supabase.from('properties').select('id, mock_id, address, seller_id');
  console.log("Properties:");
  console.table(properties);
}
test();
