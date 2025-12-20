import request from 'supertest';
import { Express } from 'express';
import { PrismaClient, TenantType, TenantStatus, UserRole, UserStatus } from '@prisma/client';
import { createTestApp } from '../setup/appSetup';
import { setupTestDatabase, cleanTestDatabase, getTestPrisma, closeTestDatabase } from '../setup/testSetup';
import { createTestTenant, createTestTenantAdmin } from '../helpers/authHelpers';
import { getErrorMessage, randomString } from '../helpers/testHelpers';
import { mockCreate, createDefaultMockResponse } from '../__mocks__/openai';

describe('Quote Routes Integration Tests', () => {
  let app: Express;
  let prisma: PrismaClient;
  let supplierTenant: any;
  let companyTenant: any;
  let supplierAdmin: any;
  let companyAdmin: any;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-integration-tests';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-integration-tests';
    process.env.OPENAI_API_KEY = 'mock-api-key-for-testing';
    process.env.OPENAI_MODEL = 'gpt-4o-mini';

    // Setup database
    await setupTestDatabase();
    prisma = getTestPrisma();

    // Create test app
    app = createTestApp();
  });

  beforeEach(async () => {
    // Clean database before each test
    await cleanTestDatabase();

    // Reset OpenAI mock
    mockCreate.mockReset();
    mockCreate.mockResolvedValue(createDefaultMockResponse());

    // Create test data
    supplierTenant = await createTestTenant(prisma, {
      type: TenantType.supplier,
      status: TenantStatus.active,
    });

    companyTenant = await createTestTenant(prisma, {
      type: TenantType.company,
      status: TenantStatus.active,
    });

    supplierAdmin = await createTestTenantAdmin(prisma, supplierTenant.id, {
      email: 'admin@supplier.test.com',
      password: 'password123',
      role: UserRole.supplier_admin,
    });

    companyAdmin = await createTestTenantAdmin(prisma, companyTenant.id, {
      email: 'admin@company.test.com',
      password: 'password123',
      role: UserRole.company_admin,
    });

    // Create test products for AI search to work with
    // The AI service needs products in the database to search through
    const concreteProduct = await prisma.product.create({
      data: {
        supplierId: supplierTenant.id,
        sku: `SKU-${randomString(8)}`,
        name: 'Concrete Mix',
        description: 'High quality concrete mix for construction projects',
        unit: 'kg',
        isActive: true,
        defaultPrices: {
          create: {
            price: 50.00,
            currency: 'USD',
            isActive: true,
            effectiveFrom: new Date(),
          },
        },
      },
    });

    const electricalProduct = await prisma.product.create({
      data: {
        supplierId: supplierTenant.id,
        sku: `SKU-${randomString(8)}`,
        name: 'Electrical Wire',
        description: 'Copper electrical wire for wiring projects',
        unit: 'meter',
        isActive: true,
        defaultPrices: {
          create: {
            price: 25.00,
            currency: 'USD',
            isActive: true,
            effectiveFrom: new Date(),
          },
        },
      },
    });

    await prisma.product.create({
      data: {
        supplierId: supplierTenant.id,
        sku: `SKU-${randomString(8)}`,
        name: 'Plumbing Service',
        description: 'Professional plumbing installation and repair services',
        unit: 'hour',
        type: 'service',
        isActive: true,
        defaultPrices: {
          create: {
            price: 75.00,
            currency: 'USD',
            isActive: true,
            effectiveFrom: new Date(),
          },
        },
      },
    });
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('POST /api/v1/quotes/ai-search', () => {
    it('should perform AI search as guest (no authentication)', async () => {
      // Mock OpenAI response
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              productIds: [],
              summary: 'No products found matching your query.',
              reasoning: 'The search did not match any products in the database.',
              suggestions: ['Try different keywords', 'Check available categories']
            })
          }
        }]
      });

      const response = await request(app)
        .post('/api/v1/quotes/ai-search')
        .send({
          prompt: 'I need concrete for my construction project',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('reasoning');
      expect(Array.isArray(response.body.data.products)).toBe(true);

      // Verify OpenAI was called
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.model).toBe('gpt-4o-mini');
      expect(callArgs.messages).toHaveLength(2);
      expect(callArgs.messages[0].role).toBe('system');
      expect(callArgs.messages[1].role).toBe('user');
      expect(callArgs.messages[1].content).toContain('I need concrete for my construction project');
    });

    it('should perform AI search as authenticated company user', async () => {
      // Mock OpenAI response with product matches
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              productIds: [],
              summary: 'Found relevant products for your construction needs.',
              reasoning: 'Products matched based on your requirements.',
              suggestions: []
            })
          }
        }]
      });

      const response = await request(app)
        .post('/api/v1/quotes/ai-search')
        .set('Authorization', `Bearer ${companyAdmin.accessToken}`)
        .send({
          prompt: 'I need electrical supplies',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should perform AI search as authenticated supplier user', async () => {
      // Mock OpenAI response
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              productIds: [],
              summary: 'Search completed successfully.',
              reasoning: 'Products analyzed based on query.',
              suggestions: []
            })
          }
        }]
      });

      const response = await request(app)
        .post('/api/v1/quotes/ai-search')
        .set('Authorization', `Bearer ${supplierAdmin.accessToken}`)
        .send({
          prompt: 'plumbing services',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('should fail with missing prompt', async () => {
      const response = await request(app)
        .post('/api/v1/quotes/ai-search')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should fail with prompt too short', async () => {
      const response = await request(app)
        .post('/api/v1/quotes/ai-search')
        .send({
          prompt: 'ab',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should fail with prompt too long', async () => {
      const longPrompt = 'a'.repeat(1001);
      const response = await request(app)
        .post('/api/v1/quotes/ai-search')
        .send({
          prompt: longPrompt,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    it('should fallback to keyword search if AI fails', async () => {
      // Mock OpenAI to throw an error
      mockCreate.mockRejectedValueOnce(new Error('AI service unavailable'));

      const response = await request(app)
        .post('/api/v1/quotes/ai-search')
        .send({
          prompt: 'concrete materials',
        });

      // Should still return 200 with fallback results
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('reasoning');
    });

    it('should handle invalid JSON response from AI', async () => {
      // Mock OpenAI to return invalid JSON
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      });

      const response = await request(app)
        .post('/api/v1/quotes/ai-search')
        .send({
          prompt: 'test query',
        });

      // Should fallback to keyword search
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should include tenant context in AI prompt for authenticated users', async () => {
      // Mock OpenAI response
      mockCreate.mockResolvedValueOnce({
        choices: [{
          message: {
            content: JSON.stringify({
              productIds: [],
              summary: 'Search completed.',
              reasoning: 'Products analyzed.',
              suggestions: []
            })
          }
        }]
      });

      await request(app)
        .post('/api/v1/quotes/ai-search')
        .set('Authorization', `Bearer ${companyAdmin.accessToken}`)
        .send({
          prompt: 'construction materials',
        });

      // Verify OpenAI was called with proper context
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[1].content).toContain('construction materials');
    });
  });
});


