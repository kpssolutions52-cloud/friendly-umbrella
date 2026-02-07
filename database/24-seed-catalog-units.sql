-- Seed standardized units for catalog
INSERT INTO "catalog_units" ("code", "name", "symbol", "unit_type")
VALUES
    ('each', 'Each', 'ea', 'count'),
    ('set', 'Set', 'set', 'count'),
    ('pair', 'Pair', 'pr', 'count'),
    ('box', 'Box', 'box', 'count'),
    ('roll', 'Roll', 'roll', 'count'),
    ('sheet', 'Sheet', 'sheet', 'count'),
    ('bag', 'Bag', 'bag', 'count'),
    ('pail', 'Pail', 'pail', 'count'),
    ('bundle', 'Bundle', 'bundle', 'count'),
    ('piece', 'Piece', 'pc', 'count'),
    ('meter', 'Meter', 'm', 'length'),
    ('square_meter', 'Square Meter', 'm2', 'area'),
    ('cubic_meter', 'Cubic Meter', 'm3', 'volume'),
    ('liter', 'Liter', 'L', 'volume'),
    ('kilogram', 'Kilogram', 'kg', 'weight'),
    ('ton', 'Metric Ton', 't', 'weight')
ON CONFLICT ("code") DO NOTHING;
