import { createClient } from './utils/supabase/client';

async function test() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('properties')
    .select(`
      id,
      seller_id,
      users:seller_id ( mock_id )
    `)
    .limit(1);
    
  console.log(data);
  console.error(error);
}
test();
