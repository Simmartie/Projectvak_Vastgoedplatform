const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = Object.fromEntries(
  envFile.split('\n').filter(line => line && !line.startsWith('#')).map(line => line.split('='))
);

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const MOCK_USERS = [
  { id: '1', mock_id: '1', role: 'verkoper', name: 'Jan Jansen' },
  { id: '2', mock_id: '2', role: 'makelaar', name: 'Pieter Makelaar' },
  { id: '3', mock_id: '3', role: 'koper', name: 'Karel Koper' },
  { id: '4', mock_id: '4', role: 'verkoper', name: 'Sanne Verkoper' },
  // ... other users
  { id: 'k2', mock_id: 'k2', role: 'koper', name: 'Lisa Koper' },
  { id: 'k3', mock_id: 'k3', role: 'koper', name: 'Mark Koper' },
];

async function run() {
  const { data: appointmentsData, error: apptError } = await supabase
    .from('appointments')
    .select(`
      id,
      date,
      end_time,
      property_id,
      appointment_participants (
        users ( id, mock_id )
      )
    `);

  if (apptError || !appointmentsData) {
    console.error("Failed to fetch", apptError);
    return;
  }

  const formatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const nowStr = formatter.format(new Date()).replace(' ', 'T');
  console.log('Now:', nowStr);
  console.log('Total appointments:', appointmentsData.length);

  for (const appt of appointmentsData) {
    if (!appt.property_id || !appt.date || !appt.end_time) continue;

    const endDateTimeLiteral = `${appt.date}T${appt.end_time}`;
    if (endDateTimeLiteral < nowStr) {
      console.log(`\nPAST: ${endDateTimeLiteral} < ${nowStr} (ID: ${appt.id})`);
      
      let buyerId = null;
      if (appt.appointment_participants) {
        for (const p of appt.appointment_participants) {
          const mockId = p.users?.mock_id;
          const userDbId = p.users?.id;
          if (mockId) {
            const user = MOCK_USERS.find(u => u.mock_id === mockId || u.id === mockId);
            if (user && user.role === 'koper') {
              buyerId = userDbId;
              break;
            }
          }
        }
      }

      if (buyerId) {
        console.log(`- Found buyer: ${buyerId}`);
        const { data: existingVisit } = await supabase
          .from('visits')
          .select('id')
          .eq('property_id', appt.property_id)
          .eq('buyer_id', buyerId)
          .eq('date', endDateTimeLiteral)
          .maybeSingle();

        console.log(`- Existing visit? ${existingVisit ? existingVisit.id : 'No'}`);
      } else {
        console.log('- No buyer found (participants:', JSON.stringify(appt.appointment_participants), ')');
      }
    }
  }
}

run();
