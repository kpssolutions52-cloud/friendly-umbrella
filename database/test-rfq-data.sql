-- Test Data for RFQ Flows Visualization
-- Company: testcompany@gmail.com
-- Supplier: abc@def.com
-- This script creates RFQs in various states to visualize all flows

-- Step 1: Get user and tenant IDs
-- Note: Run these queries first to get the IDs, then use them in the INSERT statements below
-- 
-- Get Company User and Tenant IDs:
-- SELECT u.id as user_id, u.tenant_id as company_id 
-- FROM users u 
-- JOIN tenants t ON u.tenant_id = t.id 
-- WHERE u.email = 'testcompany@gmail.com' AND t.type = 'company';
--
-- Get Supplier User and Tenant IDs:
-- SELECT u.id as user_id, u.tenant_id as supplier_id 
-- FROM users u 
-- JOIN tenants t ON u.tenant_id = t.id 
-- WHERE u.email = 'abc@def.com' AND (t.type = 'supplier' OR t.type = 'service_provider');

-- Step 2: Create placeholder product for general RFQs (if it doesn't exist)
-- This is needed for RFQs that aren't tied to a specific product
INSERT INTO products (
    id, tenant_id, sku, name, description, category_id, 
    unit, is_active, created_at, updated_at
)
SELECT 
    gen_random_uuid()::text,
    (SELECT id FROM tenants WHERE type = 'supplier' LIMIT 1),
    'GENERAL-RFQ-PLACEHOLDER',
    'General RFQ Placeholder',
    'Placeholder product for general RFQ requests',
    (SELECT id FROM categories WHERE name LIKE '%General%' OR name LIKE '%Other%' LIMIT 1),
    'unit',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM products WHERE sku = 'GENERAL-RFQ-PLACEHOLDER'
);

-- Step 3: Insert RFQ Test Data
-- Replace the placeholders below with actual IDs from Step 1 queries

-- ============================================
-- RFQ 1: PENDING - Created but no response yet
-- ============================================
INSERT INTO quote_requests (
    id, company_id, supplier_id, product_id, quantity, unit,
    requested_price, currency, message, status, requested_by, expires_at,
    created_at, updated_at
)
SELECT 
    gen_random_uuid()::text,
    (SELECT tenant_id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
    (SELECT tenant_id FROM users WHERE email = 'abc@def.com' LIMIT 1),
    (SELECT id FROM products WHERE sku = 'GENERAL-RFQ-PLACEHOLDER' LIMIT 1),
    100.00,
    'bags',
    5000.00,
    'USD',
    'RFQ: Construction Materials - Cement Bags
Category: Building Materials
We need 100 bags of high-quality cement for our construction project. Please provide competitive pricing with delivery terms.',
    'pending',
    (SELECT id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
    CURRENT_TIMESTAMP + INTERVAL '30 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
WHERE NOT EXISTS (
    SELECT 1 FROM quote_requests WHERE message LIKE 'RFQ: Construction Materials - Cement Bags%'
);

-- ============================================
-- RFQ 2: RESPONDED - Supplier responded, waiting for company action
-- ============================================
WITH rfq_inserted AS (
    INSERT INTO quote_requests (
        id, company_id, supplier_id, product_id, quantity, unit,
        requested_price, currency, message, status, requested_by, responded_by, responded_at, expires_at,
        created_at, updated_at
    )
    SELECT 
        gen_random_uuid()::text,
        (SELECT tenant_id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
        (SELECT tenant_id FROM users WHERE email = 'abc@def.com' LIMIT 1),
        (SELECT id FROM products WHERE sku = 'GENERAL-RFQ-PLACEHOLDER' LIMIT 1),
        50.00,
        'units',
        3000.00,
        'USD',
        'RFQ: Office Furniture - Desks and Chairs
Category: Furniture
We need 50 units of ergonomic office furniture including desks and chairs for our new office space.',
        'responded',
        (SELECT id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
        (SELECT id FROM users WHERE email = 'abc@def.com' LIMIT 1),
        CURRENT_TIMESTAMP - INTERVAL '1 day',
        CURRENT_TIMESTAMP + INTERVAL '20 days',
        CURRENT_TIMESTAMP - INTERVAL '5 days',
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    WHERE NOT EXISTS (
        SELECT 1 FROM quote_requests WHERE message LIKE 'RFQ: Office Furniture%'
    )
    RETURNING id
)
INSERT INTO quote_responses (
    id, quote_request_id, price, currency, quantity, unit,
    message, terms, responded_by, responded_at, is_accepted,
    created_at, updated_at
)
SELECT 
    gen_random_uuid()::text,
    rfq_inserted.id,
    2800.00,
    'USD',
    50.00,
    'units',
    'We can provide high-quality ergonomic office furniture. Our price includes delivery and setup.',
    'Payment: 50% upfront, 50% on delivery. Delivery within 2 weeks. 1-year warranty included.',
    (SELECT id FROM users WHERE email = 'abc@def.com' LIMIT 1),
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM rfq_inserted;

-- ============================================
-- RFQ 3: ACCEPTED - Company accepted supplier's bid
-- ============================================
WITH rfq_inserted AS (
    INSERT INTO quote_requests (
        id, company_id, supplier_id, product_id, quantity, unit,
        requested_price, currency, message, status, requested_by, responded_by, responded_at, expires_at,
        created_at, updated_at
    )
    SELECT 
        gen_random_uuid()::text,
        (SELECT tenant_id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
        (SELECT tenant_id FROM users WHERE email = 'abc@def.com' LIMIT 1),
        (SELECT id FROM products WHERE sku = 'GENERAL-RFQ-PLACEHOLDER' LIMIT 1),
        200.00,
        'kg',
        1500.00,
        'USD',
        'RFQ: Raw Materials - Steel Bars
Category: Construction Materials
We need 200kg of steel reinforcement bars for our construction project.',
        'accepted',
        (SELECT id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
        (SELECT id FROM users WHERE email = 'abc@def.com' LIMIT 1),
        CURRENT_TIMESTAMP - INTERVAL '3 days',
        CURRENT_TIMESTAMP + INTERVAL '15 days',
        CURRENT_TIMESTAMP - INTERVAL '10 days',
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    WHERE NOT EXISTS (
        SELECT 1 FROM quote_requests WHERE message LIKE 'RFQ: Raw Materials - Steel Bars%'
    )
    RETURNING id
)
INSERT INTO quote_responses (
    id, quote_request_id, price, currency, quantity, unit,
    message, terms, responded_by, responded_at, is_accepted, accepted_at,
    created_at, updated_at
)
SELECT 
    gen_random_uuid()::text,
    rfq_inserted.id,
    1450.00,
    'USD',
    200.00,
    'kg',
    'We can supply high-grade steel bars. Competitive pricing with bulk discount.',
    'Payment: Net 30 days. Delivery within 1 week. Quality certificate provided.',
    (SELECT id FROM users WHERE email = 'abc@def.com' LIMIT 1),
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    true,
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '3 days',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
FROM rfq_inserted;

-- ============================================
-- RFQ 4: REJECTED - Company rejected supplier's bid
-- ============================================
WITH rfq_inserted AS (
    INSERT INTO quote_requests (
        id, company_id, supplier_id, product_id, quantity, unit,
        requested_price, currency, message, status, requested_by, responded_by, responded_at, expires_at,
        created_at, updated_at
    )
    SELECT 
        gen_random_uuid()::text,
        (SELECT tenant_id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
        (SELECT tenant_id FROM users WHERE email = 'abc@def.com' LIMIT 1),
        (SELECT id FROM products WHERE sku = 'GENERAL-RFQ-PLACEHOLDER' LIMIT 1),
        75.00,
        'pieces',
        2500.00,
        'USD',
        'RFQ: Electrical Equipment - LED Lights
Category: Electrical Supplies
We need 75 pieces of energy-efficient LED lights for our building renovation.',
        'rejected',
        (SELECT id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
        (SELECT id FROM users WHERE email = 'abc@def.com' LIMIT 1),
        CURRENT_TIMESTAMP - INTERVAL '4 days',
        CURRENT_TIMESTAMP + INTERVAL '10 days',
        CURRENT_TIMESTAMP - INTERVAL '8 days',
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    WHERE NOT EXISTS (
        SELECT 1 FROM quote_requests WHERE message LIKE 'RFQ: Electrical Equipment - LED Lights%'
    )
    RETURNING id
)
INSERT INTO quote_responses (
    id, quote_request_id, price, currency, quantity, unit,
    message, terms, responded_by, responded_at, is_accepted,
    created_at, updated_at
)
SELECT 
    gen_random_uuid()::text,
    rfq_inserted.id,
    3200.00,
    'USD',
    75.00,
    'pieces',
    'We offer premium LED lighting solutions with extended warranty.',
    'Payment: 100% upfront. Delivery in 3 weeks. 5-year warranty.',
    (SELECT id FROM users WHERE email = 'abc@def.com' LIMIT 1),
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    false,
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days'
FROM rfq_inserted;

-- ============================================
-- RFQ 5: COUNTER-NEGOTIATED - Company sent counter-offer
-- ============================================
WITH rfq_inserted AS (
    INSERT INTO quote_requests (
        id, company_id, supplier_id, product_id, quantity, unit,
        requested_price, currency, message, status, requested_by, responded_by, responded_at, expires_at,
        created_at, updated_at
    )
    SELECT 
        gen_random_uuid()::text,
        (SELECT tenant_id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
        (SELECT tenant_id FROM users WHERE email = 'abc@def.com' LIMIT 1),
        (SELECT id FROM products WHERE sku = 'GENERAL-RFQ-PLACEHOLDER' LIMIT 1),
        150.00,
        'sqft',
        8000.00,
        'USD',
        'RFQ: Flooring Materials - Tiles
Category: Building Materials
We need 150 sqft of premium ceramic tiles for our office renovation project.',
        'responded',
        (SELECT id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
        (SELECT id FROM users WHERE email = 'abc@def.com' LIMIT 1),
        CURRENT_TIMESTAMP - INTERVAL '2 days',
        CURRENT_TIMESTAMP + INTERVAL '25 days',
        CURRENT_TIMESTAMP - INTERVAL '7 days',
        CURRENT_TIMESTAMP - INTERVAL '1 hour'
    WHERE NOT EXISTS (
        SELECT 1 FROM quote_requests WHERE message LIKE 'RFQ: Flooring Materials - Tiles%'
    )
    RETURNING id
),
supplier_response AS (
    INSERT INTO quote_responses (
        id, quote_request_id, price, currency, quantity, unit,
        message, terms, responded_by, responded_at, is_accepted,
        created_at, updated_at
    )
    SELECT 
        gen_random_uuid()::text,
        rfq_inserted.id,
        8500.00,
        'USD',
        150.00,
        'sqft',
        'Premium ceramic tiles with installation service included.',
        'Payment: 40% deposit, 60% on completion. Installation included. 2-year warranty.',
        (SELECT id FROM users WHERE email = 'abc@def.com' LIMIT 1),
        CURRENT_TIMESTAMP - INTERVAL '2 days',
        false,
        CURRENT_TIMESTAMP - INTERVAL '2 days',
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    FROM rfq_inserted
    RETURNING quote_request_id, id as response_id
)
-- Company's counter-offer (stored as a response from company user)
INSERT INTO quote_responses (
    id, quote_request_id, price, currency, quantity, unit,
    message, terms, responded_by, responded_at, is_accepted,
    created_at, updated_at
)
SELECT 
    gen_random_uuid()::text,
    supplier_response.quote_request_id,
    8200.00,
    'USD',
    150.00,
    'sqft',
    'Counter-offer: We can accept $8,200 for the tiles with installation. This is our best offer.',
    'Counter-negotiation for response ' || supplier_response.response_id,
    (SELECT id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
    CURRENT_TIMESTAMP - INTERVAL '1 hour',
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 hour',
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
FROM supplier_response;

-- ============================================
-- RFQ 6: MULTIPLE BIDS - Multiple responses from supplier (re-bidding scenario)
-- ============================================
WITH rfq_inserted AS (
    INSERT INTO quote_requests (
        id, company_id, supplier_id, product_id, quantity, unit,
        requested_price, currency, message, status, requested_by, responded_by, responded_at, expires_at,
        created_at, updated_at
    )
    SELECT 
        gen_random_uuid()::text,
        (SELECT tenant_id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
        (SELECT tenant_id FROM users WHERE email = 'abc@def.com' LIMIT 1),
        (SELECT id FROM products WHERE sku = 'GENERAL-RFQ-PLACEHOLDER' LIMIT 1),
        500.00,
        'liters',
        4000.00,
        'USD',
        'RFQ: Paint and Coating Materials
Category: Building Materials
We need 500 liters of premium paint for our building exterior renovation.',
        'responded',
        (SELECT id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
        (SELECT id FROM users WHERE email = 'abc@def.com' LIMIT 1),
        CURRENT_TIMESTAMP - INTERVAL '6 hours',
        CURRENT_TIMESTAMP + INTERVAL '18 days',
        CURRENT_TIMESTAMP - INTERVAL '3 days',
        CURRENT_TIMESTAMP - INTERVAL '1 hour'
    WHERE NOT EXISTS (
        SELECT 1 FROM quote_requests WHERE message LIKE 'RFQ: Paint and Coating Materials%'
    )
    RETURNING id
)
-- First bid from supplier
INSERT INTO quote_responses (
    id, quote_request_id, price, currency, quantity, unit,
    message, terms, responded_by, responded_at, is_accepted,
    created_at, updated_at
)
SELECT 
    gen_random_uuid()::text,
    rfq_inserted.id,
    4200.00,
    'USD',
    500.00,
    'liters',
    'Initial quote for premium paint with weather-resistant coating.',
    'Payment: Net 45 days. Delivery in 2 weeks. Color matching service available.',
    (SELECT id FROM users WHERE email = 'abc@def.com' LIMIT 1),
    CURRENT_TIMESTAMP - INTERVAL '6 hours',
    false,
    CURRENT_TIMESTAMP - INTERVAL '6 hours',
    CURRENT_TIMESTAMP - INTERVAL '6 hours'
FROM rfq_inserted
-- Second bid (updated/re-bid) from same supplier
UNION ALL
SELECT 
    gen_random_uuid()::text,
    rfq_inserted.id,
    3950.00,
    'USD',
    500.00,
    'liters',
    'Updated quote: We can offer a better price of $3,950 with bulk discount.',
    'Payment: Net 30 days. Delivery in 1.5 weeks. Same quality guarantee.',
    (SELECT id FROM users WHERE email = 'abc@def.com' LIMIT 1),
    CURRENT_TIMESTAMP - INTERVAL '1 hour',
    false,
    CURRENT_TIMESTAMP - INTERVAL '1 hour',
    CURRENT_TIMESTAMP - INTERVAL '1 hour'
FROM rfq_inserted;

-- ============================================
-- RFQ 7: EXPIRED - RFQ that has passed expiration date
-- ============================================
INSERT INTO quote_requests (
    id, company_id, supplier_id, product_id, quantity, unit,
    requested_price, currency, message, status, requested_by, expires_at,
    created_at, updated_at
)
SELECT 
    gen_random_uuid()::text,
    (SELECT tenant_id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
    (SELECT tenant_id FROM users WHERE email = 'abc@def.com' LIMIT 1),
    (SELECT id FROM products WHERE sku = 'GENERAL-RFQ-PLACEHOLDER' LIMIT 1),
    30.00,
    'units',
    1200.00,
    'USD',
    'RFQ: Plumbing Fixtures - Faucets
Category: Plumbing Supplies
We need 30 units of modern faucets for our bathroom renovation project.',
    'expired',
    (SELECT id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
    CURRENT_TIMESTAMP - INTERVAL '5 days',
    CURRENT_TIMESTAMP - INTERVAL '20 days',
    CURRENT_TIMESTAMP - INTERVAL '5 days'
WHERE NOT EXISTS (
    SELECT 1 FROM quote_requests WHERE message LIKE 'RFQ: Plumbing Fixtures - Faucets%'
);

-- ============================================
-- RFQ 8: CANCELLED - Company cancelled the RFQ
-- ============================================
INSERT INTO quote_requests (
    id, company_id, supplier_id, product_id, quantity, unit,
    requested_price, currency, message, status, requested_by, expires_at,
    created_at, updated_at
)
SELECT 
    gen_random_uuid()::text,
    (SELECT tenant_id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
    (SELECT tenant_id FROM users WHERE email = 'abc@def.com' LIMIT 1),
    (SELECT id FROM products WHERE sku = 'GENERAL-RFQ-PLACEHOLDER' LIMIT 1),
    25.00,
    'pieces',
    1800.00,
    'USD',
    'RFQ: Security Equipment - Cameras
Category: Security Systems
We need 25 pieces of security cameras for our office building.',
    'cancelled',
    (SELECT id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1),
    CURRENT_TIMESTAMP + INTERVAL '12 days',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE NOT EXISTS (
    SELECT 1 FROM quote_requests WHERE message LIKE 'RFQ: Security Equipment - Cameras%'
);

-- ============================================
-- Verification Queries
-- ============================================

-- View all RFQs for the test company
-- SELECT 
--     qr.id,
--     qr.message,
--     qr.status,
--     qr.created_at,
--     qr.expires_at,
--     COUNT(qresp.id) as response_count
-- FROM quote_requests qr
-- LEFT JOIN quote_responses qresp ON qr.id = qresp.quote_request_id
-- WHERE qr.company_id = (SELECT tenant_id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1)
-- GROUP BY qr.id, qr.message, qr.status, qr.created_at, qr.expires_at
-- ORDER BY qr.created_at DESC;

-- View all RFQs for the test supplier
-- SELECT 
--     qr.id,
--     qr.message,
--     qr.status,
--     qr.created_at,
--     qr.expires_at,
--     COUNT(qresp.id) as response_count
-- FROM quote_requests qr
-- LEFT JOIN quote_responses qresp ON qr.id = qresp.quote_request_id
-- WHERE qr.supplier_id = (SELECT tenant_id FROM users WHERE email = 'abc@def.com' LIMIT 1)
-- GROUP BY qr.id, qr.message, qr.status, qr.created_at, qr.expires_at
-- ORDER BY qr.created_at DESC;

-- View RFQ status distribution
-- SELECT 
--     status,
--     COUNT(*) as count
-- FROM quote_requests
-- WHERE company_id = (SELECT tenant_id FROM users WHERE email = 'testcompany@gmail.com' LIMIT 1)
--    OR supplier_id = (SELECT tenant_id FROM users WHERE email = 'abc@def.com' LIMIT 1)
-- GROUP BY status
-- ORDER BY count DESC;
