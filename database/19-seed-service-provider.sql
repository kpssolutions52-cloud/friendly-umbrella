-- Seed Script: Dummy Service Provider and Services
-- This script creates a dummy service provider tenant, admin user, and sample services
-- 
-- PREREQUISITE: Run migration 18-add-service-pricing-fields.sql first to add rate_per_hour and rate_type columns

DO $body$
DECLARE
    service_provider_id UUID;
    password_hash TEXT := '$2a$12$T0uUeI1kweJ1CKt6oVDeMu9JMw4k1pXKyA4zi6bgIr288Yy4kNEzu'; -- Hash for 'password123'
    structural_id UUID;
    architecture_id UUID;
    estimation_id UUID;
    supervision_id UUID;
    project_mgmt_id UUID;
    sitevisit_sub_id UUID;
    housedesign_sub_id UUID;
    archplan_sub_id UUID;
    estimation_sub_id UUID;
    supervision_sub_id UUID;
    pm_sub_id UUID;
    column_exists BOOLEAN;
BEGIN
    -- Check if rate_per_hour column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'rate_per_hour'
    ) INTO column_exists;
    
    IF NOT column_exists THEN
        RAISE EXCEPTION 'Migration required: Please run database/18-add-service-pricing-fields.sql first to add rate_per_hour and rate_type columns to the products table';
    END IF;
    -- Step 1: Insert or update service provider tenant
    INSERT INTO "tenants" (
        "id",
        "name",
        "type",
        "email",
        "phone",
        "address",
        "postal_code",
        "status",
        "is_active",
        "created_at",
        "updated_at",
        "metadata"
    ) VALUES (
        gen_random_uuid(),
        'Civil Engineering Solutions Ltd',
        'service_provider',
        'serviceprovider@example.com',
        '+65 6123 4567',
        '123 Engineering Street, Singapore 123456',
        '123456',
        'active',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        '{"description": "Professional civil engineering consultancy services", "website": "https://civilengsolutions.com"}'::jsonb
    )
    ON CONFLICT ("email") DO UPDATE SET
        "name" = EXCLUDED."name",
        "type" = EXCLUDED."type",
        "status" = EXCLUDED."status",
        "is_active" = EXCLUDED."is_active",
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO service_provider_id;

    -- Step 2: Create admin user for service provider
    INSERT INTO "users" (
        "id",
        "tenant_id",
        "email",
        "password_hash",
        "first_name",
        "last_name",
        "role",
        "status",
        "is_active",
        "permissions",
        "created_at",
        "updated_at"
    ) VALUES (
        gen_random_uuid(),
        service_provider_id,
        'admin@serviceprovider.com',
        password_hash,
        'John',
        'Engineer',
        'service_provider_admin',
        'active',
        true,
        '{"view": true, "create": true, "admin": true}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("email") DO UPDATE SET
        "tenant_id" = EXCLUDED."tenant_id",
        "role" = EXCLUDED."role",
        "status" = EXCLUDED."status",
        "is_active" = EXCLUDED."is_active",
        "updated_at" = CURRENT_TIMESTAMP;

    -- Step 3: Get service category IDs
    SELECT "id" INTO structural_id FROM "service_categories" 
    WHERE "name" = 'Structural Design & Assessment' AND "parent_id" IS NULL LIMIT 1;
    
    SELECT "id" INTO architecture_id FROM "service_categories" 
    WHERE "name" = 'Architecture & Visualisation' AND "parent_id" IS NULL LIMIT 1;
    
    SELECT "id" INTO estimation_id FROM "service_categories" 
    WHERE "name" = 'Estimation & Quantity Surveying' AND "parent_id" IS NULL LIMIT 1;
    
    SELECT "id" INTO supervision_id FROM "service_categories" 
    WHERE "name" = 'Site Supervision & Quality Control' AND "parent_id" IS NULL LIMIT 1;
    
    SELECT "id" INTO project_mgmt_id FROM "service_categories" 
    WHERE "name" = 'Project Management & Planning' AND "parent_id" IS NULL LIMIT 1;

    -- Get subcategories
    SELECT "id" INTO sitevisit_sub_id FROM "service_categories" 
    WHERE "name" = 'Site Visit & Initial Structural Assessment' AND "parent_id" = structural_id LIMIT 1;
    
    SELECT "id" INTO housedesign_sub_id FROM "service_categories" 
    WHERE "name" = 'New House Structural Design (Low-Rise)' AND "parent_id" = structural_id LIMIT 1;
    
    SELECT "id" INTO archplan_sub_id FROM "service_categories" 
    WHERE "name" = 'Architectural Planning & 2D Layout Drawings' AND "parent_id" = architecture_id LIMIT 1;
    
    SELECT "id" INTO estimation_sub_id FROM "service_categories" 
    WHERE "name" = 'Estimation, BOQ & Costing' AND "parent_id" = estimation_id LIMIT 1;
    
    SELECT "id" INTO supervision_sub_id FROM "service_categories" 
    WHERE "name" = 'Construction Supervision & Quality Monitoring' AND "parent_id" = supervision_id LIMIT 1;
    
    SELECT "id" INTO pm_sub_id FROM "service_categories" 
    WHERE "name" = 'Project Management & Construction Scheduling' AND "parent_id" = project_mgmt_id LIMIT 1;

    -- Step 4: Insert dummy services
    INSERT INTO "products" (
        "id",
        "supplier_id",
        "type",
        "sku",
        "name",
        "description",
        "service_category_id",
        "unit",
        "rate_per_hour",
        "rate_type",
        "is_active",
        "metadata",
        "created_at",
        "updated_at"
    ) VALUES
    (
        gen_random_uuid(),
        service_provider_id,
        'service',
        'SVC-001',
        'Site Visit & Initial Structural Assessment',
        'Professional on-site structural assessment for residential and commercial buildings. Includes visual inspection, preliminary report, and recommendations.',
        COALESCE(sitevisit_sub_id, structural_id),
        'per visit',
        150.00,
        'per_hour',
        true,
        '{}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        service_provider_id,
        'service',
        'SVC-002',
        'New House Structural Design (Low-Rise)',
        'Complete structural design services for new low-rise residential buildings. Includes foundation design, structural calculations, and detailed drawings.',
        COALESCE(housedesign_sub_id, structural_id),
        'per project',
        200.00,
        'per_project',
        true,
        '{}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        service_provider_id,
        'service',
        'SVC-003',
        'Architectural Planning & 2D Layout Drawings',
        'Professional architectural planning and 2D layout drawings for residential and commercial projects. Includes floor plans, elevations, and sections.',
        COALESCE(archplan_sub_id, architecture_id),
        'per project',
        120.00,
        'per_hour',
        true,
        '{}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        service_provider_id,
        'service',
        'SVC-004',
        'Estimation, BOQ & Costing Services',
        'Detailed quantity takeoff, bill of quantities (BOQ) preparation, and cost estimation for construction projects. Includes material and labor cost analysis.',
        COALESCE(estimation_sub_id, estimation_id),
        'per project',
        100.00,
        'per_hour',
        true,
        '{}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        service_provider_id,
        'service',
        'SVC-005',
        'Construction Supervision & Quality Monitoring',
        'On-site construction supervision and quality control services. Regular site visits, progress monitoring, and quality assurance reports.',
        COALESCE(supervision_sub_id, supervision_id),
        'per hour',
        80.00,
        'per_hour',
        true,
        '{}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        service_provider_id,
        'service',
        'SVC-006',
        'Project Management & Construction Scheduling',
        'Comprehensive project management services including construction scheduling, resource planning, and progress tracking. Suitable for small to medium projects.',
        COALESCE(pm_sub_id, project_mgmt_id),
        'per project',
        5000.00,
        'fixed',
        true,
        '{}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        service_provider_id,
        'service',
        'SVC-007',
        'Renovation & Extension Feasibility Study',
        'Detailed feasibility study for building renovations and extensions. Includes structural assessment, design recommendations, and cost estimates.',
        structural_id,
        'per project',
        2500.00,
        'fixed',
        true,
        '{}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        service_provider_id,
        'service',
        'SVC-008',
        '3D Modeling & Visualisation Services',
        'Professional 3D modeling and visualization for architectural and structural projects. Includes exterior and interior renderings, walkthroughs.',
        architecture_id,
        'per project',
        180.00,
        'per_hour',
        true,
        '{}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        service_provider_id,
        'service',
        'SVC-009',
        'Retrofitting & Structural Strengthening Design',
        'Specialized design services for structural retrofitting and strengthening of existing buildings. Includes detailed engineering calculations and drawings.',
        structural_id,
        'per project',
        300.00,
        'per_hour',
        true,
        '{}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        service_provider_id,
        'service',
        'SVC-010',
        'Technical Second Opinion & Peer Review',
        'Independent technical review and second opinion services for structural designs and construction projects. Expert analysis and recommendations.',
        structural_id,
        'per review',
        200.00,
        'negotiable',
        true,
        '{}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("supplier_id", "sku") DO UPDATE SET
        "name" = EXCLUDED."name",
        "description" = EXCLUDED."description",
        "service_category_id" = EXCLUDED."service_category_id",
        "rate_per_hour" = EXCLUDED."rate_per_hour",
        "rate_type" = EXCLUDED."rate_type",
        "updated_at" = CURRENT_TIMESTAMP;

    RAISE NOTICE 'Successfully seeded service provider and services';
END $body$;
