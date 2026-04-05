import { STARTER_VILLAGERS } from './villagers';
import { DEFAULT_MAP_LOCATIONS } from './map';

async function seed() {
  console.log('Seeding AI Crossing...');
  console.log(`Villagers: ${STARTER_VILLAGERS.length}`);
  console.log(`Locations: ${DEFAULT_MAP_LOCATIONS.length}`);

  for (const v of STARTER_VILLAGERS) {
    console.log(`  - ${v.name} (${v.job}) at ${v.homeId}`);
  }

  for (const loc of DEFAULT_MAP_LOCATIONS) {
    console.log(`  - ${loc.name} [${loc.areaTag}] at (${loc.x}, ${loc.y})`);
  }

  console.log('Seed data ready. Database seeding requires DATABASE_URL to be configured.');
}

seed().catch(console.error);
