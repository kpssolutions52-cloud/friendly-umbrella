import { initE2EDatabase } from './db-helper';

async function globalSetup() {
  console.log('🚀 Starting E2E test global setup...');
  
  process.env.NODE_ENV = 'test';
  
  // Set JWT secrets for testing
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-e2e-tests-minimum-32-characters-long';
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-e2e-tests-minimum-32-characters-long';
  }
  
  // Initialize TestContainers database for E2E tests
  // TestContainers spins up a real PostgreSQL container - no external database needed
  console.log('📦 Initializing PostgreSQL database with TestContainers for E2E tests...');
  
  try {
    // Initialize TestContainers database BEFORE backend starts
    // This will start a PostgreSQL container and set DATABASE_URL automatically
    await initE2EDatabase();
    console.log('✅ TestContainers database initialized successfully');
    
    console.log('✅ E2E test setup complete - backend will use TestContainers PostgreSQL');
  } catch (error: any) {
    console.error('❌ TestContainers database initialization failed:', error?.message || error);
    
    // Check if it's a Docker-related error
    if (error?.message?.includes('container runtime') || 
        error?.message?.includes('Docker') ||
        error?.message?.includes('docker_engine')) {
      console.error('');
      console.error('🐳 Docker is required for E2E tests with TestContainers');
      console.error('📋 Please ensure Docker Desktop is installed and running:');
      console.error('   1. Open Docker Desktop application');
      console.error('   2. Wait until Docker Desktop shows "Docker Desktop is running"');
      console.error('   3. Verify with: docker ps');
      console.error('   4. Then run the E2E tests again');
      console.error('');
      console.error('💡 On Windows: Docker Desktop must be running for TestContainers to work');
      console.error('');
    } else {
      console.error('❌ Error details:', error);
    }
    
    throw new Error(`Failed to initialize TestContainers database: ${error?.message || 'Unknown error'}`);
  }
}


export default globalSetup;


