import { getProperties, getPropertiesBySeller } from './lib/properties';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  const props = await getProperties();
  console.log("All properties:");
  for (const p of props) {
    console.log(`${p.id} (${p.address}) -> sellerId: ${p.sellerId}`);
  }

  const mariaProps = await getPropertiesBySeller('v1');
  console.log("\nMaria (v1) properties:");
  for (const p of mariaProps) {
    console.log(`${p.id} (${p.address})`);
  }
}
test();
