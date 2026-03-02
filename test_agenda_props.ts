import { getAppointmentsForUser } from './lib/agenda';
import { getPropertyById } from './lib/properties';

async function test() {
  const apps = getAppointmentsForUser('1'); // makelaar
  console.log("Appointments:");
  console.dir(apps);
  
  for (const app of apps) {
    if (app.propertyId) {
      console.log(`Testing propertyId: ${app.propertyId}`);
      try {
        const p = await getPropertyById(app.propertyId);
        console.log(`Result for ${app.propertyId}: ${p ? 'Found' : 'Undefined'}`);
      } catch (e) {
        console.error(`Error for ${app.propertyId}:`, e);
      }
    }
  }
}

test();
