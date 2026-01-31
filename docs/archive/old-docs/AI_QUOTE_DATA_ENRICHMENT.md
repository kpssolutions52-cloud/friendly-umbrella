# AI Quote Data Enrichment Guide

This document outlines data you can enrich in your database to enable more advanced AI query analysis and insights.

## Current Database Structure

Your database already has:
- ✅ Basic product info (name, description, SKU, unit)
- ✅ Categories (ProductCategory, ServiceCategory)
- ✅ Pricing (DefaultPrice, PrivatePrice)
- ✅ Metadata JSON fields (Product.metadata, Tenant.metadata) - **Currently underutilized**
- ✅ Supplier/Service Provider info
- ✅ Images (ProductImage)

## Recommended Data Enrichment

### 1. Product Specifications (Use Product.metadata JSON)

**Why:** Enables AI to match products based on technical requirements, dimensions, material properties, etc.

**Data to Add:**
```json
{
  "specifications": {
    "dimensions": {
      "length": "2.4m",
      "width": "1.2m",
      "height": "0.1m",
      "weight": "25kg"
    },
    "material": "Concrete",
    "grade": "C30",
    "strength": "30 MPa",
    "color": "Gray",
    "finish": "Smooth",
    "certifications": ["ISO 9001", "CE Mark"],
    "warranty": "1 year",
    "countryOfOrigin": "Singapore"
  }
}
```

**AI Benefits:**
- Match products by technical specifications ("I need C30 concrete")
- Filter by dimensions ("2.4m x 1.2m panels")
- Consider material properties for compatibility
- Suggest alternatives based on similar specs

### 2. Location & Geographic Data

**Why:** Enable location-based recommendations, shipping cost estimates, and regional availability.

**Add to Tenant (Supplier) metadata:**
```json
{
  "location": {
    "address": "123 Construction St",
    "city": "Singapore",
    "state": "Central",
    "country": "Singapore",
    "postalCode": "123456",
    "coordinates": {
      "lat": 1.3521,
      "lng": 103.8198
    },
    "serviceAreas": ["Singapore", "Malaysia", "Thailand"],
    "deliveryRadius": 50, // km
    "deliveryZones": ["Zone A", "Zone B"]
  }
}
```

**Add to Product metadata:**
```json
{
  "availability": {
    "regions": ["Singapore", "Malaysia"],
    "warehouseLocations": ["Singapore Central", "Malaysia KL"],
    "shippingAvailable": true,
    "localPickup": true
  }
}
```

**AI Benefits:**
- "Find suppliers near me" queries
- Shipping cost estimation
- Regional availability analysis
- Delivery time estimates

### 3. Lead Times & Availability

**Why:** Critical for project planning and timeline estimation.

**Add to Product metadata:**
```json
{
  "availability": {
    "stockStatus": "in_stock", // in_stock, low_stock, out_of_stock, made_to_order
    "quantityAvailable": 500,
    "leadTime": {
      "standard": "2-3 days",
      "express": "1 day",
      "madeToOrder": "2-3 weeks"
    },
    "minimumOrderQuantity": 10,
    "bulkDiscountThreshold": 100
  }
}
```

**AI Benefits:**
- Timeline estimation ("When can I get this?")
- Urgency-based recommendations
- Stock availability warnings
- Bulk ordering suggestions

### 4. Quality Ratings & Reviews

**Why:** Help users make informed decisions based on quality and reliability.

**Add to Product metadata:**
```json
{
  "quality": {
    "rating": 4.5, // 1-5
    "reviewCount": 23,
    "qualityGrade": "Premium", // Economy, Standard, Premium
    "durability": "High",
    "warranty": "2 years",
    "certifications": ["ISO 9001", "Green Building Certified"]
  }
}
```

**Add to Tenant (Supplier) metadata:**
```json
{
  "supplier": {
    "rating": 4.7,
    "reviewCount": 150,
    "yearsInBusiness": 15,
    "specializations": ["Commercial Construction", "Residential"],
    "certifications": ["ISO 9001", "BCA Certified"]
  }
}
```

**AI Benefits:**
- Quality-based recommendations
- Supplier reliability analysis
- "Best value" suggestions
- Risk assessment based on ratings

### 5. Product Relationships

**Why:** Enable AI to suggest compatible items, alternatives, and complementary products.

**Create new table or use metadata:**
```json
{
  "relationships": {
    "alternatives": ["product-id-1", "product-id-2"], // Similar products
    "compatibleWith": ["product-id-3", "product-id-4"], // Works with
    "requires": ["product-id-5"], // Needs this to work
    "bundledWith": ["product-id-6"], // Often sold together
    "upgrades": ["product-id-7"], // Better version
    "downgrades": ["product-id-8"] // Cheaper alternative
  }
}
```

**AI Benefits:**
- "What else do I need?" suggestions
- Alternative product recommendations
- Bundle suggestions
- Upgrade/downgrade options

### 6. Usage Context & Applications

**Why:** Help AI understand when and where products are typically used.

**Add to Product metadata:**
```json
{
  "usage": {
    "applications": [
      "Residential foundations",
      "Commercial flooring",
      "Driveway construction"
    ],
    "projectTypes": ["New Construction", "Renovation", "Repair"],
    "suitableFor": ["Indoor", "Outdoor", "Both"],
    "environmentalConditions": ["Weather resistant", "Waterproof"],
    "installationComplexity": "Moderate", // Simple, Moderate, Complex
    "requiresProfessionalInstallation": false
  }
}
```

**AI Benefits:**
- Context-aware matching ("concrete for driveway")
- Project type recommendations
- Installation complexity assessment
- Environmental suitability

### 7. Historical Pricing Trends

**Why:** Enable price trend analysis and market insights.

**Create new table: PriceHistory**
```prisma
model PriceHistory {
  id          String   @id @default(uuid())
  productId   String
  price       Decimal
  currency    String
  recordedAt  DateTime @default(now())
  priceType   PriceType // default or private
  
  @@index([productId, recordedAt])
}
```

**Or track in metadata:**
```json
{
  "pricing": {
    "priceHistory": [
      {"date": "2024-01-01", "price": 100, "currency": "USD"},
      {"date": "2024-02-01", "price": 105, "currency": "USD"}
    ],
    "priceTrend": "increasing", // increasing, decreasing, stable
    "volatility": "low", // low, medium, high
    "seasonalVariation": true
  }
}
```

**AI Benefits:**
- Price trend predictions
- "Best time to buy" recommendations
- Market volatility warnings
- Historical price comparisons

### 8. Installation & Maintenance Info

**Why:** Help users understand total cost of ownership and requirements.

**Add to Product metadata:**
```json
{
  "installation": {
    "complexity": "Moderate",
    "estimatedTime": "2-3 hours",
    "requiredTools": ["Drill", "Level", "Trowel"],
    "requiredSkills": ["Basic DIY", "Professional"],
    "installationCostEstimate": 200,
    "maintenance": {
      "frequency": "Annual",
      "cost": 50,
      "requirements": "Regular cleaning"
    }
  }
}
```

**AI Benefits:**
- Total cost of ownership estimates
- DIY vs professional recommendations
- Maintenance planning
- Tool requirements

### 9. Environmental & Sustainability Data

**Why:** Enable eco-conscious recommendations and compliance checking.

**Add to Product metadata:**
```json
{
  "environmental": {
    "carbonFootprint": 2.5, // kg CO2 per unit
    "recyclable": true,
    "recycledContent": 30, // percentage
    "energyEfficiency": "A+",
    "greenCertifications": ["LEED", "Green Mark"],
    "sustainabilityRating": 4.2
  }
}
```

**AI Benefits:**
- Eco-friendly recommendations
- Sustainability scoring
- Green building compliance
- Carbon footprint calculations

### 10. Project Templates & Use Cases

**Why:** Enable AI to suggest complete project packages.

**Create new table: ProjectTemplate**
```prisma
model ProjectTemplate {
  id          String   @id @default(uuid())
  name        String   // "Residential Foundation"
  description String?
  products    Json     // Array of product IDs with quantities
  estimatedCost Decimal
  estimatedTime String
  complexity   String
}
```

**AI Benefits:**
- "Complete project" suggestions
- Project cost estimation
- Material list generation
- Timeline planning

### 11. Supplier Performance Metrics

**Why:** Enable supplier comparison and recommendations.

**Add to Tenant metadata:**
```json
{
  "performance": {
    "averageResponseTime": "2 hours",
    "onTimeDelivery": 95, // percentage
    "orderAccuracy": 98,
    "customerSatisfaction": 4.6,
    "totalOrders": 1250,
    "averageOrderValue": 5000,
    "specializations": ["Commercial", "Industrial"],
    "minimumOrderValue": 100
  }
}
```

**AI Benefits:**
- Supplier reliability scoring
- Performance-based recommendations
- Delivery time estimates
- Order accuracy predictions

### 12. Quantity-Based Pricing Tiers

**Why:** Enable bulk pricing analysis and recommendations.

**Add to DefaultPrice or metadata:**
```json
{
  "pricingTiers": [
    {"minQuantity": 1, "maxQuantity": 10, "price": 100, "discount": 0},
    {"minQuantity": 11, "maxQuantity": 50, "price": 90, "discount": 10},
    {"minQuantity": 51, "maxQuantity": 100, "price": 80, "discount": 20}
  ]
}
```

**AI Benefits:**
- Bulk discount recommendations
- Optimal order quantity suggestions
- Cost savings calculations
- Volume-based pricing insights

### 13. Compatibility & Technical Requirements

**Why:** Prevent incompatible product combinations.

**Add to Product metadata:**
```json
{
  "technical": {
    "compatibleWith": ["product-id-1", "product-id-2"],
    "incompatibleWith": ["product-id-3"],
    "systemRequirements": {
      "voltage": "220V",
      "power": "1500W",
      "waterPressure": "2-4 bar"
    },
    "standards": ["ISO 9001", "ASTM"],
    "compliance": ["Building Code 2020", "Fire Safety"]
  }
}
```

**AI Benefits:**
- Compatibility checking
- System requirement validation
- Compliance verification
- Technical compatibility warnings

### 14. Seasonal & Market Factors

**Why:** Enable market-aware recommendations.

**Add to Product metadata:**
```json
{
  "market": {
    "seasonality": {
      "peakSeason": ["Q1", "Q2"],
      "lowSeason": ["Q3"],
      "seasonalPriceVariation": 15 // percentage
    },
    "marketDemand": "High", // Low, Medium, High
    "supplyStatus": "Stable", // Short, Stable, Surplus
    "marketTrend": "Growing"
  }
}
```

**AI Benefits:**
- Seasonal pricing insights
- Best time to purchase
- Market availability warnings
- Demand forecasting

## Implementation Priority

### Phase 1: High Impact, Easy Implementation
1. **Product Specifications** (use existing metadata field)
2. **Location Data** (use existing Tenant metadata)
3. **Lead Times & Availability** (use existing metadata)
4. **Usage Context** (use existing metadata)

### Phase 2: Medium Impact, Moderate Effort
5. **Quality Ratings** (use existing metadata)
6. **Product Relationships** (new table or metadata)
7. **Installation Info** (use existing metadata)
8. **Quantity-Based Pricing** (extend DefaultPrice)

### Phase 3: Advanced Features
9. **Historical Pricing** (new PriceHistory table)
10. **Project Templates** (new table)
11. **Environmental Data** (use existing metadata)
12. **Supplier Performance** (use existing Tenant metadata)

## Example: Enriched Product Metadata

```json
{
  "specifications": {
    "dimensions": {"length": "2.4m", "width": "1.2m", "height": "0.1m"},
    "material": "Concrete",
    "grade": "C30",
    "weight": "25kg"
  },
  "availability": {
    "stockStatus": "in_stock",
    "quantityAvailable": 500,
    "leadTime": {"standard": "2-3 days"},
    "minimumOrderQuantity": 10
  },
  "usage": {
    "applications": ["Residential foundations", "Commercial flooring"],
    "projectTypes": ["New Construction", "Renovation"],
    "suitableFor": "Outdoor",
    "installationComplexity": "Moderate"
  },
  "quality": {
    "rating": 4.5,
    "qualityGrade": "Premium",
    "warranty": "2 years"
  },
  "location": {
    "warehouseLocations": ["Singapore Central"],
    "shippingAvailable": true
  },
  "pricing": {
    "priceTrend": "stable",
    "bulkDiscounts": true
  }
}
```

## How This Improves AI Analysis

With enriched data, the AI can now:

1. **Match by specifications**: "I need C30 concrete" → finds exact grade
2. **Consider location**: "Find suppliers near Jurong" → filters by location
3. **Estimate timelines**: "When can I get this?" → uses lead times
4. **Suggest alternatives**: "What's similar?" → uses relationships
5. **Quality recommendations**: "Best quality option" → uses ratings
6. **Cost optimization**: "Best bulk price" → uses pricing tiers
7. **Project planning**: "Complete foundation package" → uses templates
8. **Risk assessment**: "Reliable supplier?" → uses performance metrics
9. **Compatibility checking**: "Works with X?" → uses technical requirements
10. **Market insights**: "Best time to buy?" → uses price trends

## Next Steps

1. **Start with metadata fields** - No schema changes needed
2. **Create data import scripts** - Bulk enrich existing products
3. **Update product forms** - Allow suppliers to add enriched data
4. **Enhance AI prompts** - Update system prompts to use new data
5. **Add validation** - Ensure data quality and consistency
