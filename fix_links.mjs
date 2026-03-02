import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://urpbfrxjobjemjghhlvs.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_pkDLHHWSZGklQJXBnB6ggw_OB6wBles';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFix() {
  console.log("Fetching verkopers...");
  const { data: users, error: errU } = await supabase.from('users').select('*').in('role', ['verkoper']);
  if (errU) {
    console.error('Error fetching users:', errU);
    return;
  }

  console.log("Fetching properties...");
  const { data: properties, error: errP } = await supabase.from('properties').select('*');
  if (errP) {
    console.error('Error fetching properties:', errP);
    return;
  }

  console.log(`Found ${users?.length} verkopers and ${properties?.length} properties`);

  let maria = users.find(u => u.name.toLowerCase().includes('maria') || u.email.includes('maria'));
  console.log('Maria:', maria ? maria.name + ' (id: ' + maria.id + ')' : 'Not found');

  if (!maria) {
    console.error("Maria not found among users with role='verkoper'");
  }

  for (const prop of properties) {
    // Check if prop already has a seller
    if (!prop.seller_id) {
      console.log(`Property ${prop.mock_id || prop.id} has no seller. Attempting to assign one.`);
      let seller = maria; // default to maria if missing or use logic
      if (prop.mock_id === 'prop-1') {
        seller = maria || users[0];
      } else if (prop.mock_id === 'prop-2') {
        seller = users.find(u => u.mock_id === 'v2') || users[1];
      } else if (prop.mock_id === 'prop-3') {
        seller = users.find(u => u.mock_id === 'v3') || users[2];
      }

      if (seller) {
        const { error: err1 } = await supabase.from('properties').update({ seller_id: seller.id }).eq('id', prop.id);
        if (err1) console.error("Error updating property:", err1);
        else console.log(`Linked property ${prop.id} to seller ${seller.name}`);

        const { error: err2 } = await supabase.from('users').update({ property_id: prop.id }).eq('id', seller.id);
        if (err2) console.error("Error updating user:", err2);
        else console.log(`Linked seller ${seller.name} to property ${prop.id}`);
      }
    } else {
      console.log(`Property ${prop.mock_id || prop.id} already has seller_id: ${prop.seller_id}. ensuring seller points back.`);
      const seller = users.find(u => u.id === prop.seller_id);
      if (seller) {
        const { error: err2 } = await supabase.from('users').update({ property_id: prop.id }).eq('id', seller.id);
        if (err2) console.error("Error updating user:", err2);
      }

      // Make sure maria has at least one property
      if (prop.seller_id === maria?.id) {
        console.log("Maria already has a property!");
      }
    }
  }

  // Force assignment for Maria if she has NO property linked in users.property_id
  const { data: updatedMaria } = await supabase.from('users').select('*').eq('id', maria?.id).single();
  if (updatedMaria && !updatedMaria.property_id && properties.length > 0) {
    console.log("Maria still has no property, forcing one.");
    const targetProp = properties[0];
    await supabase.from('properties').update({ seller_id: maria.id }).eq('id', targetProp.id);
    await supabase.from('users').update({ property_id: targetProp.id }).eq('id', maria.id);
    console.log(`Forced assigned property ${targetProp.id} to Maria.`);
  }
}

checkAndFix().catch(console.error);
