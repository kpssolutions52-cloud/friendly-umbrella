import { closeE2EDatabase } from './db-helper';

async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test environment...');
  
  try {
    await closeE2EDatabase();
    console.log('✅ TestContainers database closed and container stopped');
  } catch (error) {
    console.error('❌ Error closing TestContainers database:', error);
  }
}

export default globalTeardown;



