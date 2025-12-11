-- Seed Service Categories
-- This script seeds the service categories based on Civil Consultancy & Part-Time Job Categories

-- A. Civil Consultancy Service Categories

-- A1. Structural Design & Assessment
INSERT INTO "service_categories" ("id", "name", "description", "parent_id", "is_active", "display_order") VALUES
(gen_random_uuid(), 'Structural Design & Assessment', 'Structural design, assessment, and analysis services', NULL, true, 1)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- Get the parent ID for subcategories
WITH parent_cat AS (
    SELECT "id" FROM "service_categories" WHERE "name" = 'Structural Design & Assessment' AND "parent_id" IS NULL
)
INSERT INTO "service_categories" ("name", "description", "parent_id", "is_active", "display_order")
SELECT subcat_name, subcat_desc, parent_cat.id, true, row_number() OVER ()
FROM parent_cat,
(VALUES
    ('Site Visit & Initial Structural Assessment', 'Initial site assessment and structural evaluation'),
    ('New House Structural Design (Low-Rise)', 'Structural design for new low-rise residential buildings'),
    ('Renovation & Extension Feasibility Study', 'Feasibility studies for renovations and extensions'),
    ('Retrofitting & Structural Strengthening Design', 'Design for structural retrofitting and strengthening'),
    ('Soil Testing & Foundation Recommendation (Coordination)', 'Coordination of soil testing and foundation recommendations'),
    ('Technical Second Opinion & Peer Review', 'Second opinion and peer review services')
) AS subcats(subcat_name, subcat_desc)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- A2. Architecture & Visualisation
INSERT INTO "service_categories" ("id", "name", "description", "parent_id", "is_active", "display_order") VALUES
(gen_random_uuid(), 'Architecture & Visualisation', 'Architectural planning and visualization services', NULL, true, 2)
ON CONFLICT ("name", "parent_id") DO NOTHING;

WITH parent_cat AS (
    SELECT "id" FROM "service_categories" WHERE "name" = 'Architecture & Visualisation' AND "parent_id" IS NULL
)
INSERT INTO "service_categories" ("name", "description", "parent_id", "is_active", "display_order")
SELECT subcat_name, subcat_desc, parent_cat.id, true, row_number() OVER ()
FROM parent_cat,
(VALUES
    ('Architectural Planning & 2D Layout Drawings', '2D architectural planning and layout drawings'),
    ('3D Modeling & Visualisation (Exterior & Interior)', '3D modeling and visualization services')
) AS subcats(subcat_name, subcat_desc)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- A3. Estimation & Quantity Surveying
INSERT INTO "service_categories" ("id", "name", "description", "parent_id", "is_active", "display_order") VALUES
(gen_random_uuid(), 'Estimation & Quantity Surveying', 'Cost estimation and quantity surveying services', NULL, true, 3)
ON CONFLICT ("name", "parent_id") DO NOTHING;

WITH parent_cat AS (
    SELECT "id" FROM "service_categories" WHERE "name" = 'Estimation & Quantity Surveying' AND "parent_id" IS NULL
)
INSERT INTO "service_categories" ("name", "description", "parent_id", "is_active", "display_order")
SELECT subcat_name, subcat_desc, parent_cat.id, true, row_number() OVER ()
FROM parent_cat,
(VALUES
    ('Estimation, BOQ & Costing', 'Bill of quantities, estimation and costing services')
) AS subcats(subcat_name, subcat_desc)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- A4. Site Supervision & Quality Control
INSERT INTO "service_categories" ("id", "name", "description", "parent_id", "is_active", "display_order") VALUES
(gen_random_uuid(), 'Site Supervision & Quality Control', 'Construction supervision and quality monitoring services', NULL, true, 4)
ON CONFLICT ("name", "parent_id") DO NOTHING;

WITH parent_cat AS (
    SELECT "id" FROM "service_categories" WHERE "name" = 'Site Supervision & Quality Control' AND "parent_id" IS NULL
)
INSERT INTO "service_categories" ("name", "description", "parent_id", "is_active", "display_order")
SELECT subcat_name, subcat_desc, parent_cat.id, true, row_number() OVER ()
FROM parent_cat,
(VALUES
    ('Construction Supervision & Quality Monitoring', 'On-site supervision and quality control services')
) AS subcats(subcat_name, subcat_desc)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- A5. Approvals & Regulatory Services
INSERT INTO "service_categories" ("id", "name", "description", "parent_id", "is_active", "display_order") VALUES
(gen_random_uuid(), 'Approvals & Regulatory Services', 'Approval drawings and regulatory submission services', NULL, true, 5)
ON CONFLICT ("name", "parent_id") DO NOTHING;

WITH parent_cat AS (
    SELECT "id" FROM "service_categories" WHERE "name" = 'Approvals & Regulatory Services' AND "parent_id" IS NULL
)
INSERT INTO "service_categories" ("name", "description", "parent_id", "is_active", "display_order")
SELECT subcat_name, subcat_desc, parent_cat.id, true, row_number() OVER ()
FROM parent_cat,
(VALUES
    ('Approval Drawings & Local Authority Submissions', 'Preparation and submission of approval drawings to local authorities')
) AS subcats(subcat_name, subcat_desc)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- A6. Land Survey & Setting Out
INSERT INTO "service_categories" ("id", "name", "description", "parent_id", "is_active", "display_order") VALUES
(gen_random_uuid(), 'Land Survey & Setting Out', 'Land surveying and setting out coordination services', NULL, true, 6)
ON CONFLICT ("name", "parent_id") DO NOTHING;

WITH parent_cat AS (
    SELECT "id" FROM "service_categories" WHERE "name" = 'Land Survey & Setting Out' AND "parent_id" IS NULL
)
INSERT INTO "service_categories" ("name", "description", "parent_id", "is_active", "display_order")
SELECT subcat_name, subcat_desc, parent_cat.id, true, row_number() OVER ()
FROM parent_cat,
(VALUES
    ('Land Surveying & Setting Out (Coordination Service)', 'Coordination of land surveying and setting out services')
) AS subcats(subcat_name, subcat_desc)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- A7. Water, Drainage & Infrastructure Design
INSERT INTO "service_categories" ("id", "name", "description", "parent_id", "is_active", "display_order") VALUES
(gen_random_uuid(), 'Water, Drainage & Infrastructure Design', 'Water, drainage, and infrastructure design services', NULL, true, 7)
ON CONFLICT ("name", "parent_id") DO NOTHING;

WITH parent_cat AS (
    SELECT "id" FROM "service_categories" WHERE "name" = 'Water, Drainage & Infrastructure Design' AND "parent_id" IS NULL
)
INSERT INTO "service_categories" ("name", "description", "parent_id", "is_active", "display_order")
SELECT subcat_name, subcat_desc, parent_cat.id, true, row_number() OVER ()
FROM parent_cat,
(VALUES
    ('Drainage, Stormwater & Septic System Design', 'Design of drainage, stormwater and septic systems'),
    ('Road, Driveway & Pavement Design', 'Design of roads, driveways and pavements')
) AS subcats(subcat_name, subcat_desc)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- A8. Project Management & Planning
INSERT INTO "service_categories" ("id", "name", "description", "parent_id", "is_active", "display_order") VALUES
(gen_random_uuid(), 'Project Management & Planning', 'Project management and construction scheduling services', NULL, true, 8)
ON CONFLICT ("name", "parent_id") DO NOTHING;

WITH parent_cat AS (
    SELECT "id" FROM "service_categories" WHERE "name" = 'Project Management & Planning' AND "parent_id" IS NULL
)
INSERT INTO "service_categories" ("name", "description", "parent_id", "is_active", "display_order")
SELECT subcat_name, subcat_desc, parent_cat.id, true, row_number() OVER ()
FROM parent_cat,
(VALUES
    ('Project Management & Construction Scheduling', 'Project management and construction scheduling services')
) AS subcats(subcat_name, subcat_desc)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- B. Part-Time / Freelance Civil Job Categories

-- B1. Site-Based Roles
INSERT INTO "service_categories" ("id", "name", "description", "parent_id", "is_active", "display_order") VALUES
(gen_random_uuid(), 'Site-Based Roles', 'Part-time and freelance site-based positions', NULL, true, 9)
ON CONFLICT ("name", "parent_id") DO NOTHING;

WITH parent_cat AS (
    SELECT "id" FROM "service_categories" WHERE "name" = 'Site-Based Roles' AND "parent_id" IS NULL
)
INSERT INTO "service_categories" ("name", "description", "parent_id", "is_active", "display_order")
SELECT subcat_name, subcat_desc, parent_cat.id, true, row_number() OVER ()
FROM parent_cat,
(VALUES
    ('Part-Time Site Supervisor (House / Small Projects)', 'Part-time site supervision for residential and small projects'),
    ('Junior Site Engineer (Evening / Weekend Support)', 'Junior site engineering support during evenings and weekends'),
    ('Part-Time Land Survey Assistant', 'Part-time assistance with land surveying tasks'),
    ('Health & Safety (HSE) Inspector – Part-Time', 'Part-time health and safety inspection services'),
    ('Site Measurement & As-Built Drawing Assistant', 'Assistance with site measurements and as-built drawings')
) AS subcats(subcat_name, subcat_desc)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- B2. Design & Draughting
INSERT INTO "service_categories" ("id", "name", "description", "parent_id", "is_active", "display_order") VALUES
(gen_random_uuid(), 'Design & Draughting', 'Freelance design and drafting services', NULL, true, 10)
ON CONFLICT ("name", "parent_id") DO NOTHING;

WITH parent_cat AS (
    SELECT "id" FROM "service_categories" WHERE "name" = 'Design & Draughting' AND "parent_id" IS NULL
)
INSERT INTO "service_categories" ("name", "description", "parent_id", "is_active", "display_order")
SELECT subcat_name, subcat_desc, parent_cat.id, true, row_number() OVER ()
FROM parent_cat,
(VALUES
    ('Freelance AutoCAD / Revit Draughtsman', 'Freelance drafting services using AutoCAD and Revit'),
    ('Freelance Structural Design Assistant', 'Freelance assistance with structural design work'),
    ('Freelance 3D Visualiser & Walkthrough Creator', 'Freelance 3D visualization and walkthrough creation')
) AS subcats(subcat_name, subcat_desc)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- B3. Quantity Surveying & Estimation
INSERT INTO "service_categories" ("id", "name", "description", "parent_id", "is_active", "display_order") VALUES
(gen_random_uuid(), 'Quantity Surveying & Estimation', 'Part-time quantity surveying and estimation services', NULL, true, 11)
ON CONFLICT ("name", "parent_id") DO NOTHING;

WITH parent_cat AS (
    SELECT "id" FROM "service_categories" WHERE "name" = 'Quantity Surveying & Estimation' AND "parent_id" IS NULL
)
INSERT INTO "service_categories" ("name", "description", "parent_id", "is_active", "display_order")
SELECT subcat_name, subcat_desc, parent_cat.id, true, row_number() OVER ()
FROM parent_cat,
(VALUES
    ('Part-Time Quantity Surveyor / Estimator', 'Part-time quantity surveying and estimation services')
) AS subcats(subcat_name, subcat_desc)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- B4. Coordination & Back-Office Support
INSERT INTO "service_categories" ("id", "name", "description", "parent_id", "is_active", "display_order") VALUES
(gen_random_uuid(), 'Coordination & Back-Office Support', 'Remote coordination and back-office support services', NULL, true, 12)
ON CONFLICT ("name", "parent_id") DO NOTHING;

WITH parent_cat AS (
    SELECT "id" FROM "service_categories" WHERE "name" = 'Coordination & Back-Office Support' AND "parent_id" IS NULL
)
INSERT INTO "service_categories" ("name", "description", "parent_id", "is_active", "display_order")
SELECT subcat_name, subcat_desc, parent_cat.id, true, row_number() OVER ()
FROM parent_cat,
(VALUES
    ('Project Coordinator (Remote)', 'Remote project coordination services'),
    ('Procurement & Material Sourcing Assistant', 'Assistance with procurement and material sourcing'),
    ('Document & Drawing Controller (Remote)', 'Remote document and drawing control services'),
    ('Customer Support & Technical Help Desk', 'Customer support and technical help desk services')
) AS subcats(subcat_name, subcat_desc)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- B5. Education & Content Creation
INSERT INTO "service_categories" ("id", "name", "description", "parent_id", "is_active", "display_order") VALUES
(gen_random_uuid(), 'Education & Content Creation', 'Education and content creation services', NULL, true, 13)
ON CONFLICT ("name", "parent_id") DO NOTHING;

WITH parent_cat AS (
    SELECT "id" FROM "service_categories" WHERE "name" = 'Education & Content Creation' AND "parent_id" IS NULL
)
INSERT INTO "service_categories" ("name", "description", "parent_id", "is_active", "display_order")
SELECT subcat_name, subcat_desc, parent_cat.id, true, row_number() OVER ()
FROM parent_cat,
(VALUES
    ('Civil Engineering Tutor / Mentor (Online)', 'Online tutoring and mentoring for civil engineering'),
    ('Content Creator – Civil Tips & Guides', 'Content creation for civil engineering tips and guides')
) AS subcats(subcat_name, subcat_desc)
ON CONFLICT ("name", "parent_id") DO NOTHING;

-- Verification
SELECT 
    COUNT(*) as total_categories,
    COUNT(*) FILTER (WHERE "parent_id" IS NULL) as main_categories,
    COUNT(*) FILTER (WHERE "parent_id" IS NOT NULL) as subcategories
FROM "service_categories";
