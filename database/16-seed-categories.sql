-- Migration 16: Seed product categories and subcategories
-- This script inserts the default categories and subcategories into the product_categories table

-- Insert main categories first, then subcategories
-- Using CTEs to handle the hierarchical structure

DO $$
DECLARE
    -- Main category IDs (will be populated as we create them)
    cement_id TEXT;
    steel_id TEXT;
    bricks_id TEXT;
    timber_id TEXT;
    roofing_id TEXT;
    plumbing_id TEXT;
    electrical_id TEXT;
    flooring_id TEXT;
    paints_id TEXT;
    glass_id TEXT;
    hardware_id TEXT;
    waterproofing_id TEXT;
    landscaping_id TEXT;
    
    -- Display order counters
    main_order INTEGER := 0;
    sub_order INTEGER;
BEGIN
    -- 1. Cement & Concrete Materials
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        'Cement & Concrete Materials',
        'Cement, concrete, and related materials',
        NULL,
        true,
        main_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NULL
    DO UPDATE SET
        "description" = EXCLUDED."description",
        "display_order" = EXCLUDED."display_order",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO cement_id;
    
    main_order := main_order + 1;
    sub_order := 0;
    
    -- Subcategories for Cement & Concrete Materials
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES
        (gen_random_uuid()::text, 'Cement', NULL, cement_id, true, sub_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Ready-mix concrete', NULL, cement_id, true, sub_order + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Sand, gravel, aggregates', NULL, cement_id, true, sub_order + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Mortar mix, plaster mix', NULL, cement_id, true, sub_order + 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NOT NULL
    DO UPDATE SET
        "is_active" = true,
        "display_order" = EXCLUDED."display_order",
        "updated_at" = CURRENT_TIMESTAMP;

    -- 2. Steel & Metal Materials
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        'Steel & Metal Materials',
        'Steel and metal construction materials',
        NULL,
        true,
        main_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NULL
    DO UPDATE SET
        "description" = EXCLUDED."description",
        "display_order" = EXCLUDED."display_order",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO steel_id;
    
    main_order := main_order + 1;
    sub_order := 0;
    
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES
        (gen_random_uuid()::text, 'Reinforcement steel (rebar)', NULL, steel_id, true, sub_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Structural steel (I-beam, H-beam, channels, angles)', NULL, steel_id, true, sub_order + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Steel plates, sheets', NULL, steel_id, true, sub_order + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'GI sheets', NULL, steel_id, true, sub_order + 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NOT NULL
    DO UPDATE SET
        "is_active" = true,
        "display_order" = EXCLUDED."display_order",
        "updated_at" = CURRENT_TIMESTAMP;

    -- 3. Bricks, Blocks & Masonry
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        'Bricks, Blocks & Masonry',
        'Bricks, blocks, and masonry products',
        NULL,
        true,
        main_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NULL
    DO UPDATE SET
        "description" = EXCLUDED."description",
        "display_order" = EXCLUDED."display_order",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO bricks_id;
    
    main_order := main_order + 1;
    sub_order := 0;
    
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES
        (gen_random_uuid()::text, 'Clay bricks', NULL, bricks_id, true, sub_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Cement blocks', NULL, bricks_id, true, sub_order + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'AAC blocks', NULL, bricks_id, true, sub_order + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Paving blocks', NULL, bricks_id, true, sub_order + 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Stone / masonry blocks', NULL, bricks_id, true, sub_order + 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NOT NULL
    DO UPDATE SET
        "is_active" = true,
        "display_order" = EXCLUDED."display_order",
        "updated_at" = CURRENT_TIMESTAMP;

    -- 4. Timber & Wood Products
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        'Timber & Wood Products',
        'Timber and wood-based products',
        NULL,
        true,
        main_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NULL
    DO UPDATE SET
        "description" = EXCLUDED."description",
        "display_order" = EXCLUDED."display_order",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO timber_id;
    
    main_order := main_order + 1;
    sub_order := 0;
    
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES
        (gen_random_uuid()::text, 'Timber / lumber', NULL, timber_id, true, sub_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Plywood', NULL, timber_id, true, sub_order + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'MDF, chipboard', NULL, timber_id, true, sub_order + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Formwork wood', NULL, timber_id, true, sub_order + 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Doors / frames', NULL, timber_id, true, sub_order + 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NOT NULL
    DO UPDATE SET
        "is_active" = true,
        "display_order" = EXCLUDED."display_order",
        "updated_at" = CURRENT_TIMESTAMP;

    -- 5. Roofing Materials
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        'Roofing Materials',
        'Roofing materials and accessories',
        NULL,
        true,
        main_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NULL
    DO UPDATE SET
        "description" = EXCLUDED."description",
        "display_order" = EXCLUDED."display_order",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO roofing_id;
    
    main_order := main_order + 1;
    sub_order := 0;
    
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES
        (gen_random_uuid()::text, 'Roof sheets (metal, zinc, GI, aluminum)', NULL, roofing_id, true, sub_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Roof tiles', NULL, roofing_id, true, sub_order + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Shingles', NULL, roofing_id, true, sub_order + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Purlins', NULL, roofing_id, true, sub_order + 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NOT NULL
    DO UPDATE SET
        "is_active" = true,
        "display_order" = EXCLUDED."display_order",
        "updated_at" = CURRENT_TIMESTAMP;

    -- 6. Plumbing & Sanitary
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        'Plumbing & Sanitary',
        'Plumbing and sanitary products',
        NULL,
        true,
        main_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NULL
    DO UPDATE SET
        "description" = EXCLUDED."description",
        "display_order" = EXCLUDED."display_order",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO plumbing_id;
    
    main_order := main_order + 1;
    sub_order := 0;
    
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES
        (gen_random_uuid()::text, 'PVC pipes & fittings', NULL, plumbing_id, true, sub_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'GI pipes', NULL, plumbing_id, true, sub_order + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Water tanks', NULL, plumbing_id, true, sub_order + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Taps, sinks, WC, bathroom items', NULL, plumbing_id, true, sub_order + 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NOT NULL
    DO UPDATE SET
        "is_active" = true,
        "display_order" = EXCLUDED."display_order",
        "updated_at" = CURRENT_TIMESTAMP;

    -- 7. Electrical Materials
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        'Electrical Materials',
        'Electrical materials and components',
        NULL,
        true,
        main_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NULL
    DO UPDATE SET
        "description" = EXCLUDED."description",
        "display_order" = EXCLUDED."display_order",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO electrical_id;
    
    main_order := main_order + 1;
    sub_order := 0;
    
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES
        (gen_random_uuid()::text, 'Cables & wiring', NULL, electrical_id, true, sub_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Switches, sockets', NULL, electrical_id, true, sub_order + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Breakers, DB box', NULL, electrical_id, true, sub_order + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Conduits, trunking', NULL, electrical_id, true, sub_order + 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NOT NULL
    DO UPDATE SET
        "is_active" = true,
        "display_order" = EXCLUDED."display_order",
        "updated_at" = CURRENT_TIMESTAMP;

    -- 8. Flooring Materials
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        'Flooring Materials',
        'Flooring materials and products',
        NULL,
        true,
        main_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NULL
    DO UPDATE SET
        "description" = EXCLUDED."description",
        "display_order" = EXCLUDED."display_order",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO flooring_id;
    
    main_order := main_order + 1;
    sub_order := 0;
    
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES
        (gen_random_uuid()::text, 'Floor tiles', NULL, flooring_id, true, sub_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Ceramic / porcelain tiles', NULL, flooring_id, true, sub_order + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Vinyl flooring', NULL, flooring_id, true, sub_order + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Wood flooring', NULL, flooring_id, true, sub_order + 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NOT NULL
    DO UPDATE SET
        "is_active" = true,
        "display_order" = EXCLUDED."display_order",
        "updated_at" = CURRENT_TIMESTAMP;

    -- 9. Paints & Finishing Materials
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        'Paints & Finishing Materials',
        'Paints and finishing materials',
        NULL,
        true,
        main_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NULL
    DO UPDATE SET
        "description" = EXCLUDED."description",
        "display_order" = EXCLUDED."display_order",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO paints_id;
    
    main_order := main_order + 1;
    sub_order := 0;
    
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES
        (gen_random_uuid()::text, 'Paint, primer, putty', NULL, paints_id, true, sub_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Varnish', NULL, paints_id, true, sub_order + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Adhesives & chemicals', NULL, paints_id, true, sub_order + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NOT NULL
    DO UPDATE SET
        "is_active" = true,
        "display_order" = EXCLUDED."display_order",
        "updated_at" = CURRENT_TIMESTAMP;

    -- 10. Glass, Windows & Doors
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        'Glass, Windows & Doors',
        'Glass, windows, and door products',
        NULL,
        true,
        main_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NULL
    DO UPDATE SET
        "description" = EXCLUDED."description",
        "display_order" = EXCLUDED."display_order",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO glass_id;
    
    main_order := main_order + 1;
    sub_order := 0;
    
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES
        (gen_random_uuid()::text, 'Glass panels', NULL, glass_id, true, sub_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Aluminum frames', NULL, glass_id, true, sub_order + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Doors, windows', NULL, glass_id, true, sub_order + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Shower screens', NULL, glass_id, true, sub_order + 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NOT NULL
    DO UPDATE SET
        "is_active" = true,
        "display_order" = EXCLUDED."display_order",
        "updated_at" = CURRENT_TIMESTAMP;

    -- 11. Hardware & Tools
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        'Hardware & Tools',
        'Hardware and construction tools',
        NULL,
        true,
        main_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NULL
    DO UPDATE SET
        "description" = EXCLUDED."description",
        "display_order" = EXCLUDED."display_order",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO hardware_id;
    
    main_order := main_order + 1;
    sub_order := 0;
    
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES
        (gen_random_uuid()::text, 'Nails, screws, bolts', NULL, hardware_id, true, sub_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Hand tools', NULL, hardware_id, true, sub_order + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Power tools', NULL, hardware_id, true, sub_order + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Safety gear', NULL, hardware_id, true, sub_order + 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NOT NULL
    DO UPDATE SET
        "is_active" = true,
        "display_order" = EXCLUDED."display_order",
        "updated_at" = CURRENT_TIMESTAMP;

    -- 12. Waterproofing & Insulation
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        'Waterproofing & Insulation',
        'Waterproofing and insulation materials',
        NULL,
        true,
        main_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NULL
    DO UPDATE SET
        "description" = EXCLUDED."description",
        "display_order" = EXCLUDED."display_order",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO waterproofing_id;
    
    main_order := main_order + 1;
    sub_order := 0;
    
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES
        (gen_random_uuid()::text, 'Membranes', NULL, waterproofing_id, true, sub_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Waterproof coatings', NULL, waterproofing_id, true, sub_order + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Insulation boards', NULL, waterproofing_id, true, sub_order + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Rockwool / glasswool', NULL, waterproofing_id, true, sub_order + 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NOT NULL
    DO UPDATE SET
        "is_active" = true,
        "display_order" = EXCLUDED."display_order",
        "updated_at" = CURRENT_TIMESTAMP;

    -- 13. Landscaping & Outdoor Materials
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES (
        gen_random_uuid()::text,
        'Landscaping & Outdoor Materials',
        'Landscaping and outdoor construction materials',
        NULL,
        true,
        main_order,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NULL
    DO UPDATE SET
        "description" = EXCLUDED."description",
        "display_order" = EXCLUDED."display_order",
        "is_active" = true,
        "updated_at" = CURRENT_TIMESTAMP
    RETURNING "id" INTO landscaping_id;
    
    sub_order := 0;
    
    INSERT INTO "product_categories" ("id", "name", "description", "parent_id", "is_active", "display_order", "created_at", "updated_at")
    VALUES
        (gen_random_uuid()::text, 'Pavers', NULL, landscaping_id, true, sub_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Garden stones', NULL, landscaping_id, true, sub_order + 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid()::text, 'Fencing materials', NULL, landscaping_id, true, sub_order + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("name", "parent_id") WHERE "parent_id" IS NOT NULL
    DO UPDATE SET
        "is_active" = true,
        "display_order" = EXCLUDED."display_order",
        "updated_at" = CURRENT_TIMESTAMP;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'Category Seed Summary';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Main categories created/updated: 13';
    RAISE NOTICE 'Subcategories created/updated: 56';
    RAISE NOTICE '========================================';
END $$;
