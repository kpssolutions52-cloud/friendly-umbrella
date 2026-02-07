import fs from "fs";
import path from "path";

const outputDir = path.resolve("database/catalog");
fs.mkdirSync(outputDir, { recursive: true });

const units = [
  { code: "each", name: "Each", symbol: "ea", unitType: "count" },
  { code: "set", name: "Set", symbol: "set", unitType: "count" },
  { code: "pair", name: "Pair", symbol: "pr", unitType: "count" },
  { code: "box", name: "Box", symbol: "box", unitType: "count" },
  { code: "roll", name: "Roll", symbol: "roll", unitType: "count" },
  { code: "sheet", name: "Sheet", symbol: "sheet", unitType: "count" },
  { code: "bag", name: "Bag", symbol: "bag", unitType: "count" },
  { code: "pail", name: "Pail", symbol: "pail", unitType: "count" },
  { code: "bundle", name: "Bundle", symbol: "bundle", unitType: "count" },
  { code: "piece", name: "Piece", symbol: "pc", unitType: "count" },
  { code: "meter", name: "Meter", symbol: "m", unitType: "length" },
  { code: "square_meter", name: "Square Meter", symbol: "m2", unitType: "area" },
  { code: "cubic_meter", name: "Cubic Meter", symbol: "m3", unitType: "volume" },
  { code: "liter", name: "Liter", symbol: "L", unitType: "volume" },
  { code: "kilogram", name: "Kilogram", symbol: "kg", unitType: "weight" },
  { code: "ton", name: "Metric Ton", symbol: "t", unitType: "weight" },
];

const sourceNote =
  "Derived from common Singapore practice (BCA CDE Data Standard, iNPQS references) and international classification standards (ISO 6707, Uniclass 2015, OmniClass, MasterFormat).";

const categories = [
  {
    code: "C01",
    name: "Preliminaries & General",
    subcategories: [
      {
        name: "Temporary Facilities & Site Setup",
        groups: [
          {
            name: "Temporary Fencing & Hoarding",
            unit: "meter",
            variants: ["Hoarding panel 2.4m", "Hoarding panel 3.0m", "Steel fence panel 2.4m"],
            tags: ["temporary", "site"],
          },
          {
            name: "Site Signage",
            unit: "each",
            variants: ["Safety sign - PPE required", "Warning sign - Authorized personnel", "Directional sign - Site office"],
            tags: ["temporary", "safety"],
          },
        ],
      },
    ],
  },
  {
    code: "C02",
    name: "Earthworks & Ground Improvement",
    subcategories: [
      {
        name: "Fill & Backfill Materials",
        groups: [
          {
            name: "Sand",
            unit: "cubic_meter",
            variants: ["Washed sand", "River sand", "Fill sand"],
            tags: ["earthworks", "fill"],
          },
          {
            name: "Gravel",
            unit: "cubic_meter",
            variants: ["10mm gravel", "20mm gravel", "40mm gravel"],
            tags: ["earthworks", "fill"],
          },
          {
            name: "Crushed Rock",
            unit: "cubic_meter",
            variants: ["Crusher run", "20mm crushed rock", "40mm crushed rock"],
            tags: ["earthworks", "fill"],
          },
          {
            name: "Topsoil",
            unit: "cubic_meter",
            variants: ["Screened topsoil", "Planting topsoil"],
            tags: ["landscaping", "soil"],
          },
        ],
      },
      {
        name: "Geosynthetics & Stabilization",
        groups: [
          {
            name: "Geotextile",
            unit: "square_meter",
            variants: ["Nonwoven 150gsm", "Nonwoven 200gsm", "Nonwoven 300gsm", "Woven 200gsm"],
            tags: ["geosynthetics", "stabilization"],
          },
          {
            name: "Geogrid",
            unit: "square_meter",
            variants: ["30/30 kN geogrid", "40/40 kN geogrid", "60/60 kN geogrid"],
            tags: ["geosynthetics", "stabilization"],
          },
          {
            name: "Geocell",
            unit: "square_meter",
            variants: ["100mm geocell", "150mm geocell", "200mm geocell"],
            tags: ["geosynthetics", "stabilization"],
          },
        ],
      },
      {
        name: "Erosion Control",
        groups: [
          {
            name: "Erosion Control Blanket",
            unit: "square_meter",
            variants: ["400gsm blanket", "700gsm blanket"],
            tags: ["erosion", "temporary"],
          },
          {
            name: "Silt Fence Fabric",
            unit: "square_meter",
            variants: ["Standard silt fence fabric"],
            tags: ["erosion", "temporary"],
          },
          {
            name: "Coir Logs",
            unit: "meter",
            variants: ["Coir log 200mm", "Coir log 300mm"],
            tags: ["erosion", "temporary"],
          },
        ],
      },
    ],
  },
  {
    code: "C03",
    name: "Substructure & Piling",
    subcategories: [
      {
        name: "Piling Materials",
        groups: [
          {
            name: "Precast Concrete Piles",
            unit: "meter",
            variants: ["250x250 pile", "300x300 pile", "350x350 pile", "400x400 pile"],
            tags: ["piling"],
          },
          {
            name: "Steel H Piles",
            unit: "meter",
            variants: ["H200", "H250", "H300", "H350"],
            tags: ["piling"],
          },
          {
            name: "Steel Sheet Piles",
            unit: "meter",
            variants: ["U-type sheet pile", "Z-type sheet pile"],
            tags: ["piling"],
          },
          {
            name: "Pile Shoes",
            unit: "each",
            variants: ["Pile shoe 250", "Pile shoe 300", "Pile shoe 350", "Pile shoe 400"],
            tags: ["piling"],
          },
        ],
      },
      {
        name: "Foundation Ancillaries",
        groups: [
          {
            name: "Blinding Concrete",
            unit: "cubic_meter",
            variants: ["Blinding concrete C10/12"],
            tags: ["foundation", "concrete"],
          },
        ],
      },
    ],
  },
  {
    code: "C04",
    name: "Concrete & Reinforcement",
    subcategories: [
      {
        name: "Ready-Mix Concrete",
        groups: [
          {
            name: "Concrete Grade",
            unit: "cubic_meter",
            variants: ["C15/20", "C20/25", "C25/30", "C30/37", "C35/45", "C40/50", "C45/55", "C50/60"],
            tags: ["concrete", "ready-mix"],
          },
        ],
      },
      {
        name: "Cement & Admixtures",
        groups: [
          {
            name: "Cement",
            unit: "bag",
            variants: ["OPC 50kg", "Rapid hardening 50kg", "Blended cement 50kg"],
            tags: ["concrete"],
          },
          {
            name: "Concrete Admixture",
            unit: "liter",
            variants: ["Plasticizer", "Superplasticizer", "Retarder", "Accelerator", "Waterproofing admixture"],
            tags: ["concrete"],
          },
        ],
      },
      {
        name: "Reinforcement",
        groups: [
          {
            name: "Rebar",
            unit: "ton",
            variants: ["10mm", "12mm", "16mm", "20mm", "25mm", "32mm", "40mm"],
            tags: ["reinforcement"],
          },
          {
            name: "Welded Mesh",
            unit: "sheet",
            variants: ["A142", "A193", "A252", "A393"],
            tags: ["reinforcement"],
          },
        ],
      },
      {
        name: "Formwork",
        groups: [
          {
            name: "Formwork Plywood",
            unit: "sheet",
            variants: ["12mm", "18mm", "21mm"],
            tags: ["formwork"],
          },
          {
            name: "Formwork Accessories",
            unit: "each",
            variants: ["Tie rod 15mm", "Wing nut 15mm", "Cone 15mm", "Form oil 20L"],
            tags: ["formwork"],
          },
        ],
      },
    ],
  },
  {
    code: "C05",
    name: "Structural Steel",
    subcategories: [
      {
        name: "Structural Sections",
        groups: [
          {
            name: "Universal Beams (UB)",
            unit: "ton",
            variants: [
              "203x102x23",
              "254x146x31",
              "254x146x37",
              "305x165x40",
              "356x171x51",
              "406x178x60",
              "457x191x67",
              "533x210x82",
            ],
            tags: ["steel"],
          },
          {
            name: "Universal Columns (UC)",
            unit: "ton",
            variants: ["203x203x46", "254x254x73", "305x305x97", "356x368x129", "406x406x178"],
            tags: ["steel"],
          },
          {
            name: "Channels",
            unit: "ton",
            variants: ["100x50", "150x75", "200x75", "250x90", "300x100"],
            tags: ["steel"],
          },
          {
            name: "Angles",
            unit: "ton",
            variants: ["50x50x5", "65x65x6", "75x75x8", "90x90x8", "100x100x10"],
            tags: ["steel"],
          },
          {
            name: "Plates",
            unit: "square_meter",
            variants: ["6mm", "8mm", "10mm", "12mm", "16mm", "20mm"],
            tags: ["steel"],
          },
        ],
      },
      {
        name: "Fasteners & Welding",
        groups: [
          {
            name: "High Strength Bolts",
            unit: "box",
            variants: ["M12", "M16", "M20", "M24", "M30"],
            tags: ["steel", "fastener"],
          },
          {
            name: "Welding Electrodes",
            unit: "box",
            variants: ["E6013 2.6mm", "E6013 3.2mm", "E7018 3.2mm", "E7018 4.0mm"],
            tags: ["steel", "welding"],
          },
        ],
      },
    ],
  },
  {
    code: "C06",
    name: "Masonry",
    subcategories: [
      {
        name: "Blocks & Bricks",
        groups: [
          {
            name: "Clay Bricks",
            unit: "each",
            variants: ["Standard clay brick", "Engineering brick"],
            tags: ["masonry"],
          },
          {
            name: "Concrete Blocks",
            unit: "each",
            variants: ["100mm block", "150mm block", "200mm block"],
            tags: ["masonry"],
          },
          {
            name: "AAC Blocks",
            unit: "each",
            variants: ["600x200x100", "600x200x150", "600x200x200"],
            tags: ["masonry"],
          },
        ],
      },
      {
        name: "Mortar & Grout",
        groups: [
          {
            name: "Masonry Mortar",
            unit: "bag",
            variants: ["M4 mortar 25kg", "M6 mortar 25kg"],
            tags: ["masonry"],
          },
          {
            name: "Tile Grout",
            unit: "bag",
            variants: ["Cementitious grout 5kg", "Cementitious grout 25kg", "Epoxy grout 5kg"],
            tags: ["masonry", "finishes"],
          },
        ],
      },
    ],
  },
  {
    code: "C07",
    name: "Timber & Carpentry",
    subcategories: [
      {
        name: "Timber & Boards",
        groups: [
          {
            name: "Softwood Timber",
            unit: "meter",
            variants: ["38x89", "38x140", "50x100", "50x150"],
            tags: ["timber"],
          },
          {
            name: "Hardwood Timber",
            unit: "meter",
            variants: ["50x50", "75x75", "100x100"],
            tags: ["timber"],
          },
          {
            name: "Plywood",
            unit: "sheet",
            variants: ["6mm", "9mm", "12mm", "18mm"],
            tags: ["timber"],
          },
          {
            name: "MDF Board",
            unit: "sheet",
            variants: ["6mm", "9mm", "12mm", "18mm"],
            tags: ["timber"],
          },
        ],
      },
      {
        name: "Timber Treatment",
        groups: [
          {
            name: "Timber Preservative",
            unit: "liter",
            variants: ["Clear preservative 5L", "Clear preservative 20L"],
            tags: ["timber"],
          },
        ],
      },
    ],
  },
  {
    code: "C08",
    name: "Waterproofing & Roofing",
    subcategories: [
      {
        name: "Waterproofing Systems",
        groups: [
          {
            name: "Bituminous Membrane",
            unit: "roll",
            variants: ["3mm membrane", "4mm membrane"],
            tags: ["waterproofing"],
          },
          {
            name: "PVC Membrane",
            unit: "square_meter",
            variants: ["1.2mm PVC membrane", "1.5mm PVC membrane"],
            tags: ["waterproofing"],
          },
          {
            name: "TPO Membrane",
            unit: "square_meter",
            variants: ["1.2mm TPO membrane", "1.5mm TPO membrane"],
            tags: ["waterproofing"],
          },
          {
            name: "Cementitious Waterproofing",
            unit: "bag",
            variants: ["20kg cementitious waterproofing"],
            tags: ["waterproofing"],
          },
          {
            name: "PU Waterproofing Coating",
            unit: "pail",
            variants: ["20L PU coating"],
            tags: ["waterproofing"],
          },
          {
            name: "Waterstop",
            unit: "meter",
            variants: ["PVC waterstop 150mm", "PVC waterstop 200mm", "Hydrophilic waterstop 20x10", "Hydrophilic waterstop 25x20"],
            tags: ["waterproofing"],
          },
        ],
      },
      {
        name: "Roofing",
        groups: [
          {
            name: "Metal Roof Sheet",
            unit: "square_meter",
            variants: ["Trapezoidal 0.42mm", "Trapezoidal 0.48mm", "Trapezoidal 0.53mm"],
            tags: ["roofing"],
          },
          {
            name: "Roof Tiles",
            unit: "each",
            variants: ["Concrete tile", "Clay tile"],
            tags: ["roofing"],
          },
          {
            name: "Gutters",
            unit: "meter",
            variants: ["uPVC gutter 100mm", "uPVC gutter 150mm", "Metal gutter 150mm"],
            tags: ["roofing"],
          },
          {
            name: "Downpipes",
            unit: "meter",
            variants: ["uPVC downpipe 75mm", "uPVC downpipe 100mm", "uPVC downpipe 150mm"],
            tags: ["roofing"],
          },
        ],
      },
    ],
  },
  {
    code: "C09",
    name: "Doors, Windows & Glazing",
    subcategories: [
      {
        name: "Windows & Frames",
        groups: [
          {
            name: "Aluminum Window",
            unit: "set",
            variants: ["Sliding window", "Casement window", "Top hung window"],
            tags: ["windows"],
          },
        ],
      },
      {
        name: "Glazing",
        groups: [
          {
            name: "Glass Panels",
            unit: "square_meter",
            variants: [
              "Clear tempered 6mm",
              "Clear tempered 8mm",
              "Clear tempered 10mm",
              "Laminated 6.38mm",
              "Laminated 8.38mm",
              "Laminated 10.38mm",
            ],
            tags: ["glazing"],
          },
        ],
      },
      {
        name: "Doors & Hardware",
        groups: [
          {
            name: "Door Leaf",
            unit: "each",
            variants: ["Solid core timber 900x2100", "Steel door 900x2100", "Fire-rated door 1hr", "Fire-rated door 2hr"],
            tags: ["door"],
          },
          {
            name: "Door Hardware",
            unit: "each",
            variants: ["Lockset", "Door closer", "Hinge 100mm", "Hinge 125mm"],
            tags: ["door", "hardware"],
          },
        ],
      },
    ],
  },
  {
    code: "C10",
    name: "Architectural Finishes",
    subcategories: [
      {
        name: "Wall & Ceiling",
        groups: [
          {
            name: "Gypsum Board",
            unit: "sheet",
            variants: ["9mm", "12mm", "15mm"],
            tags: ["finishes"],
          },
          {
            name: "Fiber Cement Board",
            unit: "sheet",
            variants: ["6mm", "9mm", "12mm"],
            tags: ["finishes"],
          },
          {
            name: "Ceiling Tile",
            unit: "sheet",
            variants: ["600x600", "600x1200"],
            tags: ["finishes"],
          },
        ],
      },
      {
        name: "Floor Finishes",
        groups: [
          {
            name: "Ceramic Tile",
            unit: "square_meter",
            variants: ["300x300", "600x600"],
            tags: ["finishes", "tile"],
          },
          {
            name: "Porcelain Tile",
            unit: "square_meter",
            variants: ["600x600", "600x1200"],
            tags: ["finishes", "tile"],
          },
          {
            name: "Vinyl Flooring",
            unit: "square_meter",
            variants: ["2mm", "3mm"],
            tags: ["finishes"],
          },
          {
            name: "Epoxy Floor Coating",
            unit: "pail",
            variants: ["20L epoxy coating"],
            tags: ["finishes"],
          },
        ],
      },
      {
        name: "Painting",
        groups: [
          {
            name: "Interior Paint",
            unit: "pail",
            variants: ["5L interior emulsion", "20L interior emulsion"],
            tags: ["finishes", "paint"],
          },
          {
            name: "Exterior Paint",
            unit: "pail",
            variants: ["20L exterior emulsion"],
            tags: ["finishes", "paint"],
          },
          {
            name: "Primer",
            unit: "pail",
            variants: ["20L primer"],
            tags: ["finishes", "paint"],
          },
        ],
      },
    ],
  },
  {
    code: "C11",
    name: "MEP - Electrical",
    subcategories: [
      {
        name: "Cables & Wires",
        groups: [
          {
            name: "LV Power Cable",
            unit: "meter",
            variants: ["2C 2.5sqmm", "2C 4sqmm", "2C 6sqmm", "4C 6sqmm", "4C 10sqmm", "4C 16sqmm", "4C 25sqmm", "4C 35sqmm", "4C 50sqmm", "4C 70sqmm", "4C 95sqmm", "4C 120sqmm"],
            tags: ["electrical", "cable"],
          },
          {
            name: "Control Cable",
            unit: "meter",
            variants: ["4C 1.5sqmm", "8C 1.5sqmm", "12C 1.5sqmm", "16C 1.5sqmm"],
            tags: ["electrical", "cable"],
          },
        ],
      },
      {
        name: "Conduits & Trunking",
        groups: [
          {
            name: "PVC Conduit",
            unit: "meter",
            variants: ["20mm", "25mm", "32mm", "40mm", "50mm"],
            tags: ["electrical", "conduit"],
          },
          {
            name: "GI Conduit",
            unit: "meter",
            variants: ["20mm", "25mm", "32mm", "40mm", "50mm"],
            tags: ["electrical", "conduit"],
          },
          {
            name: "Trunking",
            unit: "meter",
            variants: ["50x50", "100x50", "100x100", "150x50", "200x100"],
            tags: ["electrical", "trunking"],
          },
          {
            name: "Cable Tray",
            unit: "meter",
            variants: ["100mm", "150mm", "200mm", "300mm", "450mm", "600mm"],
            tags: ["electrical", "tray"],
          },
        ],
      },
      {
        name: "Switchgear & Distribution",
        groups: [
          {
            name: "MCB",
            unit: "each",
            variants: ["6A", "10A", "16A", "20A", "25A", "32A", "40A", "63A"],
            tags: ["electrical", "switchgear"],
          },
          {
            name: "MCCB",
            unit: "each",
            variants: ["100A", "160A", "250A", "400A", "630A"],
            tags: ["electrical", "switchgear"],
          },
          {
            name: "Distribution Board",
            unit: "each",
            variants: ["4-way", "8-way", "12-way", "18-way", "24-way"],
            tags: ["electrical", "switchgear"],
          },
        ],
      },
      {
        name: "Lighting",
        groups: [
          {
            name: "LED Panel",
            unit: "each",
            variants: ["600x600 36W", "1200x300 36W"],
            tags: ["electrical", "lighting"],
          },
          {
            name: "Downlight",
            unit: "each",
            variants: ["10W", "15W", "20W"],
            tags: ["electrical", "lighting"],
          },
        ],
      },
      {
        name: "Earthing & Bonding",
        groups: [
          {
            name: "Earth Rod",
            unit: "each",
            variants: ["16mm x 1.2m", "16mm x 2.4m"],
            tags: ["electrical", "earthing"],
          },
          {
            name: "Earth Tape",
            unit: "meter",
            variants: ["25x3mm", "50x6mm"],
            tags: ["electrical", "earthing"],
          },
          {
            name: "Cable Lugs",
            unit: "each",
            variants: ["16sqmm", "25sqmm", "35sqmm", "50sqmm", "70sqmm", "95sqmm", "120sqmm", "150sqmm", "185sqmm", "240sqmm"],
            tags: ["electrical", "earthing"],
          },
        ],
      },
    ],
  },
  {
    code: "C12",
    name: "MEP - Mechanical (HVAC)",
    subcategories: [
      {
        name: "Ductwork & Insulation",
        groups: [
          {
            name: "GI Duct",
            unit: "square_meter",
            variants: ["200x200", "300x200", "400x200", "600x300", "800x400"],
            tags: ["hvac", "duct"],
          },
          {
            name: "Duct Insulation",
            unit: "square_meter",
            variants: ["25mm glasswool", "50mm glasswool"],
            tags: ["hvac", "insulation"],
          },
        ],
      },
      {
        name: "Chilled Water System",
        groups: [
          {
            name: "Chilled Water Pipe (Black Steel)",
            unit: "meter",
            variants: ["25mm", "32mm", "40mm", "50mm", "65mm", "80mm", "100mm", "150mm", "200mm"],
            tags: ["hvac", "pipe"],
          },
          {
            name: "Chilled Water Valve",
            unit: "each",
            variants: ["25mm", "32mm", "40mm", "50mm", "65mm", "80mm", "100mm", "150mm", "200mm"],
            tags: ["hvac", "valve"],
          },
        ],
      },
      {
        name: "Air-Conditioning Equipment",
        groups: [
          {
            name: "Fan Coil Unit",
            unit: "each",
            variants: ["500 CFM", "750 CFM", "1000 CFM", "1500 CFM", "2000 CFM"],
            tags: ["hvac", "equipment"],
          },
          {
            name: "Air Handling Unit",
            unit: "each",
            variants: ["2000 CFM", "3000 CFM", "5000 CFM", "10000 CFM"],
            tags: ["hvac", "equipment"],
          },
          {
            name: "Copper Pipe (Refrigerant)",
            unit: "meter",
            variants: ['1/4"', '3/8"', '1/2"', '5/8"', '3/4"', '1"'],
            tags: ["hvac", "pipe"],
          },
        ],
      },
    ],
  },
  {
    code: "C13",
    name: "MEP - Plumbing & Sanitary",
    subcategories: [
      {
        name: "Pipes & Fittings",
        groups: [
          {
            name: "uPVC Pipe",
            unit: "meter",
            variants: ["50mm", "75mm", "100mm", "150mm", "200mm"],
            tags: ["plumbing", "pipe"],
          },
          {
            name: "HDPE Pipe",
            unit: "meter",
            variants: ["25mm", "32mm", "40mm", "50mm", "75mm", "110mm", "160mm", "200mm"],
            tags: ["plumbing", "pipe"],
          },
          {
            name: "PPR Pipe",
            unit: "meter",
            variants: ["20mm", "25mm", "32mm", "40mm", "50mm", "63mm", "75mm", "90mm", "110mm"],
            tags: ["plumbing", "pipe"],
          },
          {
            name: "Copper Pipe",
            unit: "meter",
            variants: ['15mm', '22mm', '28mm', '35mm', '42mm', '54mm'],
            tags: ["plumbing", "pipe"],
          },
          {
            name: "uPVC Elbow",
            unit: "each",
            variants: ["50mm", "75mm", "100mm", "150mm"],
            tags: ["plumbing", "fitting"],
          },
          {
            name: "uPVC Tee",
            unit: "each",
            variants: ["50mm", "75mm", "100mm", "150mm"],
            tags: ["plumbing", "fitting"],
          },
          {
            name: "uPVC Reducer",
            unit: "each",
            variants: ["100x50", "150x100", "200x150"],
            tags: ["plumbing", "fitting"],
          },
        ],
      },
      {
        name: "Sanitary Fixtures",
        groups: [
          {
            name: "Water Closet",
            unit: "each",
            variants: ["Close coupled WC", "Wall hung WC"],
            tags: ["sanitary"],
          },
          {
            name: "Wash Basin",
            unit: "each",
            variants: ["Countertop basin", "Wall hung basin"],
            tags: ["sanitary"],
          },
          {
            name: "Urinal",
            unit: "each",
            variants: ["Wall hung urinal"],
            tags: ["sanitary"],
          },
          {
            name: "Kitchen Sink",
            unit: "each",
            variants: ["Single bowl sink", "Double bowl sink"],
            tags: ["sanitary"],
          },
          {
            name: "Tap",
            unit: "each",
            variants: ["Basin mixer", "Sink mixer", "Bib tap"],
            tags: ["sanitary"],
          },
          {
            name: "Floor Trap",
            unit: "each",
            variants: ["100mm floor trap", "150mm floor trap"],
            tags: ["sanitary"],
          },
        ],
      },
      {
        name: "Pumps & Accessories",
        groups: [
          {
            name: "Booster Pump Set",
            unit: "set",
            variants: ["1.0 HP", "1.5 HP", "2.0 HP", "3.0 HP"],
            tags: ["plumbing", "pump"],
          },
          {
            name: "Water Heater",
            unit: "each",
            variants: ["50L", "80L", "100L", "150L"],
            tags: ["plumbing"],
          },
        ],
      },
    ],
  },
  {
    code: "C14",
    name: "MEP - Fire Protection",
    subcategories: [
      {
        name: "Sprinkler System",
        groups: [
          {
            name: "Sprinkler Pipe (GI)",
            unit: "meter",
            variants: ["25mm", "32mm", "40mm", "50mm", "65mm", "80mm", "100mm", "150mm", "200mm"],
            tags: ["fire", "pipe"],
          },
          {
            name: "Sprinkler Head",
            unit: "each",
            variants: ["Pendent 68C", "Pendent 79C", "Upright 68C", "Sidewall 68C", "Concealed 68C"],
            tags: ["fire", "sprinkler"],
          },
        ],
      },
      {
        name: "Fire Fighting Equipment",
        groups: [
          {
            name: "Fire Hose Reel Set",
            unit: "set",
            variants: ["30m hose reel set"],
            tags: ["fire"],
          },
          {
            name: "Hydrant Valve",
            unit: "each",
            variants: ["63mm", "100mm"],
            tags: ["fire"],
          },
          {
            name: "Fire Extinguisher",
            unit: "each",
            variants: ["ABC 6kg", "CO2 4.5kg", "Foam 9L"],
            tags: ["fire"],
          },
        ],
      },
      {
        name: "Fire Alarm System",
        groups: [
          {
            name: "Fire Alarm Device",
            unit: "each",
            variants: ["Smoke detector", "Heat detector", "Manual call point", "Sounder", "Strobe"],
            tags: ["fire", "alarm"],
          },
        ],
      },
    ],
  },
  {
    code: "C15",
    name: "MEP - ELV, ICT & Security",
    subcategories: [
      {
        name: "Structured Cabling",
        groups: [
          {
            name: "Data Cable",
            unit: "box",
            variants: ["Cat6 UTP 305m", "Cat6A UTP 305m"],
            tags: ["ict", "cable"],
          },
          {
            name: "Fiber Optic Cable",
            unit: "meter",
            variants: ["6 core", "12 core", "24 core", "48 core"],
            tags: ["ict", "cable"],
          },
          {
            name: "Patch Panel",
            unit: "each",
            variants: ["24-port", "48-port"],
            tags: ["ict"],
          },
        ],
      },
      {
        name: "Security & Surveillance",
        groups: [
          {
            name: "CCTV Camera",
            unit: "each",
            variants: ["Fixed dome", "Bullet", "PTZ"],
            tags: ["security"],
          },
          {
            name: "Access Control",
            unit: "each",
            variants: ["Card reader", "Electromagnetic lock", "Exit button"],
            tags: ["security"],
          },
          {
            name: "Network Switch",
            unit: "each",
            variants: ["8-port", "24-port", "48-port"],
            tags: ["ict"],
          },
        ],
      },
      {
        name: "Public Address",
        groups: [
          {
            name: "PA Speaker",
            unit: "each",
            variants: ['6" ceiling speaker', '8" ceiling speaker', "Wall-mounted speaker"],
            tags: ["pa"],
          },
          {
            name: "PA Amplifier",
            unit: "each",
            variants: ["60W", "120W", "240W"],
            tags: ["pa"],
          },
        ],
      },
    ],
  },
  {
    code: "C16",
    name: "External Works & Roads",
    subcategories: [
      {
        name: "Roads & Pavements",
        groups: [
          {
            name: "Asphalt Mix",
            unit: "ton",
            variants: ["AC14", "AC20", "AC28"],
            tags: ["roads"],
          },
          {
            name: "Road Base",
            unit: "cubic_meter",
            variants: ["Granular sub-base", "Crusher run basecourse"],
            tags: ["roads"],
          },
          {
            name: "Concrete Paver",
            unit: "square_meter",
            variants: ["200x100x60", "200x100x80"],
            tags: ["roads"],
          },
          {
            name: "Kerb",
            unit: "meter",
            variants: ["Precast kerb", "Precast mountable kerb"],
            tags: ["roads"],
          },
        ],
      },
      {
        name: "Drainage",
        groups: [
          {
            name: "RC Pipe",
            unit: "meter",
            variants: ["300mm", "450mm", "600mm", "900mm", "1200mm"],
            tags: ["drainage"],
          },
          {
            name: "uPVC Drain Pipe",
            unit: "meter",
            variants: ["100mm", "150mm", "200mm"],
            tags: ["drainage"],
          },
          {
            name: "Manhole Cover",
            unit: "each",
            variants: ["D400", "C250"],
            tags: ["drainage"],
          },
          {
            name: "Grating",
            unit: "each",
            variants: ["Ductile iron grating", "Galvanized grating"],
            tags: ["drainage"],
          },
        ],
      },
      {
        name: "Street Furniture",
        groups: [
          {
            name: "Street Lighting Pole",
            unit: "each",
            variants: ["6m pole", "9m pole", "12m pole"],
            tags: ["external"],
          },
          {
            name: "Road Marking Paint",
            unit: "pail",
            variants: ["White road marking 20L", "Yellow road marking 20L"],
            tags: ["roads"],
          },
        ],
      },
    ],
  },
  {
    code: "C17",
    name: "Utilities",
    subcategories: [
      {
        name: "Water Supply",
        groups: [
          {
            name: "Ductile Iron Pipe",
            unit: "meter",
            variants: ["100mm", "150mm", "200mm", "300mm", "450mm", "600mm"],
            tags: ["utilities", "water"],
          },
          {
            name: "HDPE Water Pipe",
            unit: "meter",
            variants: ["63mm", "90mm", "110mm", "160mm", "200mm"],
            tags: ["utilities", "water"],
          },
        ],
      },
      {
        name: "Sewer",
        groups: [
          {
            name: "uPVC Sewer Pipe",
            unit: "meter",
            variants: ["150mm", "200mm", "250mm", "300mm"],
            tags: ["utilities", "sewer"],
          },
        ],
      },
      {
        name: "Power & Telecom Ducts",
        groups: [
          {
            name: "HDPE Duct",
            unit: "meter",
            variants: ["63mm", "90mm", "110mm", "160mm"],
            tags: ["utilities", "duct"],
          },
          {
            name: "PVC Duct",
            unit: "meter",
            variants: ["100mm", "150mm", "200mm"],
            tags: ["utilities", "duct"],
          },
        ],
      },
    ],
  },
  {
    code: "C18",
    name: "Landscaping & Irrigation",
    subcategories: [
      {
        name: "Soft Landscaping",
        groups: [
          {
            name: "Turf",
            unit: "square_meter",
            variants: ["Bermuda turf", "Zoysia turf"],
            tags: ["landscaping"],
          },
          {
            name: "Plants",
            unit: "each",
            variants: ["Shrub 1L", "Shrub 3L", "Tree 2m", "Tree 3m"],
            tags: ["landscaping"],
          },
          {
            name: "Planting Soil",
            unit: "cubic_meter",
            variants: ["Planting soil mix"],
            tags: ["landscaping"],
          },
        ],
      },
      {
        name: "Irrigation",
        groups: [
          {
            name: "Irrigation Pipe",
            unit: "meter",
            variants: ["20mm", "25mm", "32mm"],
            tags: ["irrigation"],
          },
          {
            name: "Irrigation Sprinkler",
            unit: "each",
            variants: ["Pop-up sprinkler", "Drip emitter"],
            tags: ["irrigation"],
          },
        ],
      },
    ],
  },
  {
    code: "C19",
    name: "Temporary Works & Safety",
    subcategories: [
      {
        name: "Scaffolding",
        groups: [
          {
            name: "Scaffold Tube",
            unit: "meter",
            variants: ["48.3mm x 6m", "48.3mm x 3m"],
            tags: ["temporary", "scaffold"],
          },
          {
            name: "Scaffold Coupler",
            unit: "each",
            variants: ["Right angle coupler", "Swivel coupler", "Sleeve coupler"],
            tags: ["temporary", "scaffold"],
          },
          {
            name: "Scaffold Base Plate",
            unit: "each",
            variants: ["Base plate"],
            tags: ["temporary", "scaffold"],
          },
          {
            name: "Scaffold Plank",
            unit: "each",
            variants: ["Steel plank 2.0m", "Steel plank 3.0m"],
            tags: ["temporary", "scaffold"],
          },
        ],
      },
      {
        name: "Safety",
        groups: [
          {
            name: "Safety Net",
            unit: "square_meter",
            variants: ["Safety net"],
            tags: ["temporary", "safety"],
          },
          {
            name: "Safety Mesh",
            unit: "square_meter",
            variants: ["Safety mesh"],
            tags: ["temporary", "safety"],
          },
          {
            name: "Guardrail",
            unit: "meter",
            variants: ["Temporary guardrail"],
            tags: ["temporary", "safety"],
          },
        ],
      },
    ],
  },
];

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function writeCsv(filePath, headers, rows) {
  const lines = [];
  lines.push(headers.join(","));
  rows.forEach((row) => {
    lines.push(headers.map((header) => csvEscape(row[header])).join(","));
  });
  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

const categoryRows = [];
const itemRows = [];

categories.forEach((category, categoryIndex) => {
  categoryRows.push({
    code: category.code,
    name: category.name,
    parent_code: "",
    level: 1,
    display_order: categoryIndex + 1,
    source: sourceNote,
  });

  category.subcategories.forEach((subcategory, subIndex) => {
    const subCode = `${category.code}-${String(subIndex + 1).padStart(2, "0")}`;
    categoryRows.push({
      code: subCode,
      name: subcategory.name,
      parent_code: category.code,
      level: 2,
      display_order: subIndex + 1,
      source: sourceNote,
    });

    subcategory.groups.forEach((group, groupIndex) => {
      const groupCode = `${subCode}-${String(groupIndex + 1).padStart(2, "0")}`;
      categoryRows.push({
        code: groupCode,
        name: group.name,
        parent_code: subCode,
        level: 3,
        display_order: groupIndex + 1,
        source: sourceNote,
      });

      const variants = group.variants?.length ? group.variants : [""];
      variants.forEach((variant) => {
        const name = variant ? `${group.name} - ${variant}` : group.name;
        itemRows.push({
          category: category.name,
          subcategory: subcategory.name,
          item_group: group.name,
          item_name: name,
          unit: group.unit,
          description: "",
          tags: group.tags?.join(";") ?? "",
          source: sourceNote,
        });
      });
    });
  });
});

// Expand items with common size/variant families for richer coverage
const sizeFamilies = [
  {
    item_group: "Concrete Hollow Section",
    category: "Structural Steel",
    subcategory: "Structural Sections",
    unit: "ton",
    variants: ["50x50x3", "75x75x4", "100x100x5", "150x150x6", "200x200x8"],
    tags: ["steel"],
  },
  {
    item_group: "GI Pipe (Medium Class)",
    category: "MEP - Plumbing & Sanitary",
    subcategory: "Pipes & Fittings",
    unit: "meter",
    variants: ["20mm", "25mm", "32mm", "40mm", "50mm", "65mm", "80mm", "100mm", "150mm"],
    tags: ["plumbing", "pipe"],
  },
  {
    item_group: "Ductile Iron Fittings",
    category: "Utilities",
    subcategory: "Water Supply",
    unit: "each",
    variants: ["100mm elbow", "150mm elbow", "200mm elbow", "300mm tee", "450mm reducer"],
    tags: ["utilities", "water"],
  },
  {
    item_group: "Cable Glands",
    category: "MEP - Electrical",
    subcategory: "Cables & Wires",
    unit: "each",
    variants: ["M20", "M25", "M32", "M40", "M50", "M63"],
    tags: ["electrical"],
  },
  {
    item_group: "Stainless Steel Pipe",
    category: "MEP - Plumbing & Sanitary",
    subcategory: "Pipes & Fittings",
    unit: "meter",
    variants: ["15mm", "22mm", "28mm", "35mm", "42mm", "54mm"],
    tags: ["plumbing", "pipe"],
  },
  {
    item_group: "Stainless Steel Fittings",
    category: "MEP - Plumbing & Sanitary",
    subcategory: "Pipes & Fittings",
    unit: "each",
    variants: ["15mm elbow", "22mm elbow", "28mm elbow", "35mm tee", "42mm reducer"],
    tags: ["plumbing", "fitting"],
  },
  {
    item_group: "Steel Rebar Coupler",
    category: "Concrete & Reinforcement",
    subcategory: "Reinforcement",
    unit: "each",
    variants: ["12mm", "16mm", "20mm", "25mm", "32mm"],
    tags: ["reinforcement"],
  },
  {
    item_group: "Polyethylene Sheet",
    category: "Waterproofing & Roofing",
    subcategory: "Waterproofing Systems",
    unit: "square_meter",
    variants: ["0.2mm", "0.3mm", "0.5mm"],
    tags: ["waterproofing"],
  },
  {
    item_group: "Expansion Joint",
    category: "Architectural Finishes",
    subcategory: "Wall & Ceiling",
    unit: "meter",
    variants: ["25mm joint", "50mm joint", "75mm joint"],
    tags: ["finishes"],
  },
  {
    item_group: "Access Panel",
    category: "Architectural Finishes",
    subcategory: "Wall & Ceiling",
    unit: "each",
    variants: ["300x300", "450x450", "600x600"],
    tags: ["finishes"],
  },
];

const pipeSizesSmall = ["15mm", "20mm", "25mm", "32mm", "40mm", "50mm"];
const pipeSizesMedium = ["63mm", "75mm", "90mm", "100mm", "110mm", "125mm", "150mm", "160mm", "200mm"];
const pipeSizesLarge = ["225mm", "250mm", "300mm", "375mm", "450mm", "525mm", "600mm", "750mm", "900mm", "1200mm"];

function addFamily({ item_group, category, subcategory, unit, variants, tags }) {
  variants.forEach((variant) => {
    itemRows.push({
      category,
      subcategory,
      item_group,
      item_name: `${item_group} - ${variant}`,
      unit,
      description: "",
      tags: tags?.join(";") ?? "",
      source: sourceNote,
    });
  });
}

sizeFamilies.forEach(addFamily);

[
  { material: "uPVC", sizes: ["50mm", "75mm", "100mm", "150mm", "200mm"] },
  { material: "HDPE", sizes: pipeSizesMedium },
  { material: "PPR", sizes: ["20mm", "25mm", "32mm", "40mm", "50mm", "63mm", "75mm", "90mm", "110mm"] },
].forEach(({ material, sizes }) => {
  ["Elbow", "Tee", "Reducer", "Coupling", "End Cap"].forEach((fitting) => {
    addFamily({
      item_group: `${material} ${fitting}`,
      category: "MEP - Plumbing & Sanitary",
      subcategory: "Pipes & Fittings",
      unit: "each",
      variants: sizes,
      tags: ["plumbing", "fitting"],
    });
  });
});

addFamily({
  item_group: "Drainage uPVC Pipe",
  category: "External Works & Roads",
  subcategory: "Drainage",
  unit: "meter",
  variants: ["100mm", "150mm", "200mm", "250mm", "300mm", "375mm", "450mm", "600mm"],
  tags: ["drainage"],
});

addFamily({
  item_group: "RC Pipe",
  category: "External Works & Roads",
  subcategory: "Drainage",
  unit: "meter",
  variants: pipeSizesLarge,
  tags: ["drainage"],
});

addFamily({
  item_group: "Ductile Iron Pipe",
  category: "Utilities",
  subcategory: "Water Supply",
  unit: "meter",
  variants: pipeSizesLarge,
  tags: ["utilities", "water"],
});

addFamily({
  item_group: "HDPE Water Pipe",
  category: "Utilities",
  subcategory: "Water Supply",
  unit: "meter",
  variants: pipeSizesMedium,
  tags: ["utilities", "water"],
});

addFamily({
  item_group: "GI Pipe",
  category: "MEP - Plumbing & Sanitary",
  subcategory: "Pipes & Fittings",
  unit: "meter",
  variants: pipeSizesSmall.concat(["65mm", "80mm", "100mm", "150mm"]),
  tags: ["plumbing", "pipe"],
});

const valveSizes = ["20mm", "25mm", "32mm", "40mm", "50mm", "65mm", "80mm", "100mm", "150mm", "200mm"];
["Gate Valve", "Globe Valve", "Check Valve", "Butterfly Valve"].forEach((valve) => {
  addFamily({
    item_group: valve,
    category: "MEP - Plumbing & Sanitary",
    subcategory: "Pumps & Accessories",
    unit: "each",
    variants: valveSizes,
    tags: ["plumbing", "valve"],
  });
});

const cableSizes = ["1.5sqmm", "2.5sqmm", "4sqmm", "6sqmm", "10sqmm", "16sqmm", "25sqmm", "35sqmm", "50sqmm", "70sqmm", "95sqmm", "120sqmm"];
["1C", "2C", "3C", "4C"].forEach((cores) => {
  addFamily({
    item_group: `Copper Cable ${cores}`,
    category: "MEP - Electrical",
    subcategory: "Cables & Wires",
    unit: "meter",
    variants: cableSizes,
    tags: ["electrical", "cable"],
  });
});

addFamily({
  item_group: "Cable Tray Cover",
  category: "MEP - Electrical",
  subcategory: "Conduits & Trunking",
  unit: "meter",
  variants: ["100mm", "150mm", "200mm", "300mm", "450mm", "600mm"],
  tags: ["electrical", "tray"],
});

addFamily({
  item_group: "Aluminum Composite Panel",
  category: "Architectural Finishes",
  subcategory: "Wall & Ceiling",
  unit: "square_meter",
  variants: ["3mm", "4mm", "5mm"],
  tags: ["finishes", "cladding"],
});

addFamily({
  item_group: "Stone Tile",
  category: "Architectural Finishes",
  subcategory: "Floor Finishes",
  unit: "square_meter",
  variants: ["300x300", "600x300", "600x600"],
  tags: ["finishes", "tile"],
});

addFamily({
  item_group: "Galvanized Steel Grating",
  category: "External Works & Roads",
  subcategory: "Drainage",
  unit: "square_meter",
  variants: ["25x3", "30x3", "40x5"],
  tags: ["drainage"],
});

const conduitSizes = ["20mm", "25mm", "32mm", "40mm", "50mm"];
["PVC", "GI"].forEach((material) => {
  ["Coupling", "Bend", "Junction Box", "Saddle"].forEach((fitting) => {
    addFamily({
      item_group: `${material} Conduit ${fitting}`,
      category: "MEP - Electrical",
      subcategory: "Conduits & Trunking",
      unit: "each",
      variants: conduitSizes,
      tags: ["electrical", "conduit"],
    });
  });
});

const tileSizes = ["100x100", "150x150", "200x200", "300x300", "300x600", "400x400", "450x450", "600x600", "600x1200", "800x800", "100x200", "200x400"];
["Ceramic Tile", "Porcelain Tile", "Stone Tile", "Mosaic Tile"].forEach((tile) => {
  addFamily({
    item_group: tile,
    category: "Architectural Finishes",
    subcategory: "Floor Finishes",
    unit: "square_meter",
    variants: tileSizes,
    tags: ["finishes", "tile"],
  });
});

const boltSizes = ["M6", "M8", "M10", "M12", "M16", "M20", "M24", "M30"];
["Hex Bolt", "Hex Nut", "Washer"].forEach((fastener) => {
  addFamily({
    item_group: fastener,
    category: "Structural Steel",
    subcategory: "Fasteners & Welding",
    unit: "box",
    variants: boltSizes,
    tags: ["fastener"],
  });
});

addFamily({
  item_group: "Self-Drilling Screw",
  category: "Timber & Carpentry",
  subcategory: "Timber & Boards",
  unit: "box",
  variants: ["#8 x 25", "#8 x 50", "#10 x 25", "#10 x 50", "#12 x 50", "#12 x 75"],
  tags: ["fastener"],
});

addFamily({
  item_group: "Common Nail",
  category: "Timber & Carpentry",
  subcategory: "Timber & Boards",
  unit: "box",
  variants: ["25mm", "38mm", "50mm", "63mm", "75mm", "90mm", "100mm", "125mm", "150mm"],
  tags: ["fastener"],
});

const ductAccessorySizes = ["200x200", "300x300", "400x400", "600x600", "800x800"];
["Volume Control Damper", "Fire Damper", "Air Diffuser", "Return Air Grille"].forEach((accessory) => {
  addFamily({
    item_group: accessory,
    category: "MEP - Mechanical (HVAC)",
    subcategory: "Ductwork & Insulation",
    unit: "each",
    variants: ductAccessorySizes,
    tags: ["hvac", "duct"],
  });
});

const armoredCableSizes = ["2.5sqmm", "4sqmm", "6sqmm", "10sqmm", "16sqmm"];
["2C", "3C", "4C", "5C", "8C", "12C"].forEach((cores) => {
  addFamily({
    item_group: `Armored Cable ${cores}`,
    category: "MEP - Electrical",
    subcategory: "Cables & Wires",
    unit: "meter",
    variants: armoredCableSizes,
    tags: ["electrical", "cable"],
  });
});

const steelThicknesses = ["3mm", "4mm", "5mm", "6mm", "8mm", "10mm", "12mm", "16mm", "20mm"];
["Mild Steel Sheet", "Stainless Steel Sheet"].forEach((sheet) => {
  addFamily({
    item_group: sheet,
    category: "Structural Steel",
    subcategory: "Structural Sections",
    unit: "square_meter",
    variants: steelThicknesses,
    tags: ["steel"],
  });
});

writeCsv(
  path.join(outputDir, "catalog_units.csv"),
  ["code", "name", "symbol", "unit_type"],
  units
);

writeCsv(
  path.join(outputDir, "catalog_categories.csv"),
  ["code", "name", "parent_code", "level", "display_order", "source"],
  categoryRows
);

writeCsv(
  path.join(outputDir, "catalog_items.csv"),
  ["category", "subcategory", "item_group", "item_name", "unit", "description", "tags", "source"],
  itemRows
);

const itemCount = itemRows.length;
const categoryCount = categoryRows.length;
console.log(`Generated ${categoryCount} categories and ${itemCount} items.`);
if (itemCount < 1000) {
  console.warn("WARNING: Item count is below 1000. Expand generators.");
}
