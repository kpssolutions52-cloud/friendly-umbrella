import { priceService } from '../services/priceService';
import { logger } from '../utils/logger';

/**
 * Cleanup expired prices job
 * Runs every hour to check and clean up expired prices
 */
export function startPriceExpiryCleanupJob() {
  // Run immediately on startup, then every hour
  cleanupExpiredPrices();
  
  // Set interval to run every hour (3600000 ms)
  setInterval(() => {
    cleanupExpiredPrices();
  }, 3600000); // 1 hour

  logger.info('Price expiry cleanup job started (runs every hour)');
}

async function cleanupExpiredPrices() {
  try {
    logger.info('Running price expiry cleanup job...');
    const result = await priceService.cleanupExpiredPrices();
    logger.info(`Price expiry cleanup completed: ${result.expiredPrivatePrices} private prices, ${result.expiredDefaultPrices} default prices expired`);
  } catch (error: any) {
    logger.error('Error in price expiry cleanup job:', error);
  }
}
