import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://urpbfrxjobjemjghhlvs.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_pkDLHHWSZGklQJXBnB6ggw_OB6wBles';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFix() {
  const { data: users, error: errU } = await supabase.from('users').select('*').in('role', ['verkoper']);
  if (errU) {
    console.error('Error fetching users:', errU);
    return;
  }
  
  const { data: properties, error: errP } = await supabase.from('properties').select('*');
  if (errP) {
    console.error('Error fetching properties:', errP);
    return;
  }
  
  console.log(`Found ${users?.length} verkopers and ${properties?.length} properties`);
  
  let maria = users.find(u => u.name.toLowerCase().includes('maria') || u.email.includes('maria'));
  console.log('Maria:', maria ? maria.name : 'Not found');
  
  for (const prop of properties) {
    console.log(`Property ${prop.address} has seller_id: ${prop.seller_id}`);
  }
  
  for (const u of users) {
    console.log(`Verkoper ${u.name} has property_id: ${u.property_id}`);
  }
}

checkAndFix().catch(console.error);
