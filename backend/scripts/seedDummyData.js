import { forceSeedDummyAcademicData } from '../utils/dummyData.js';

async function run() {
  try {
    const result = await forceSeedDummyAcademicData(process.env.SEED_BY || 'seed-script');
    console.log('Dummy academic data seed result:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed dummy academic data:', error);
    process.exit(1);
  }
}

run();
