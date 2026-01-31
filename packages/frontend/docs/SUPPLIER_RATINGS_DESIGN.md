# Supplier Ratings System - Design Document

## 🎯 Overview

**Supplier Ratings** allow QS professionals to rate suppliers based on their experiences, helping other QS make better decisions when comparing quotes and selecting suppliers.

---

## 🏗️ Database Schema

### New Model: SupplierRating

```prisma
// Supplier Ratings (QS rates Suppliers)
model SupplierRating {
  id          String   @id @default(uuid())
  supplierId  String   @map("supplier_id") // Organization (supplier type)
  raterId     String   @map("rater_id")     // User (QS type)
  companyId   String?  @map("company_id")   // Optional: which company the QS works for
  
  // Rating scores (1-5 stars)
  overallRating    Int @db.SmallInt // 1-5
  priceRating      Int @db.SmallInt // 1-5
  deliveryRating   Int @db.SmallInt // 1-5
  qualityRating    Int @db.SmallInt // 1-5
  communicationRating Int @db.SmallInt // 1-5
  
  // Review text
  review      String?  @db.Text
  pros        String?  @db.Text // What they did well
  cons        String?  @db.Text // What could improve
  
  // Context
  orderId     String?  @map("order_id") // Optional: link to specific order
  projectId   String?  @map("project_id") // Optional: link to project
  
  // Metadata
  isVerified  Boolean  @default(false) // Only verified if order was placed
  isPublic    Boolean  @default(true) // Can be hidden by supplier
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  supplier Organization @relation("SupplierRatings", fields: [supplierId], references: [id], onDelete: Cascade)
  rater    User         @relation("SupplierRater", fields: [raterId], references: [id], onDelete: Cascade)
  company  Organization? @relation("CompanyRatings", fields: [companyId], references: [id], onDelete: SetNull)
  order    Order?       @relation(fields: [orderId], references: [id], onDelete: SetNull)
  project  Project?     @relation(fields: [projectId], references: [id], onDelete: SetNull)
  
  @@unique([supplierId, raterId, orderId]) // One rating per supplier per QS per order
  @@index([supplierId])
  @@index([raterId])
  @@index([companyId])
  @@index([overallRating])
  @@map("supplier_ratings")
}
```

### Update Organization Model

```prisma
model Organization {
  // ... existing fields ...
  
  // Add ratings relation
  ratingsReceived SupplierRating[] @relation("SupplierRatings")
  ratingsGiven    SupplierRating[] @relation("CompanyRatings")
  
  // ... rest of model ...
}
```

### Update User Model

```prisma
model User {
  // ... existing fields ...
  
  // Add ratings relation
  supplierRatings SupplierRating[] @relation("SupplierRater")
  
  // ... rest of model ...
}
```

### Update Order Model

```prisma
model Order {
  // ... existing fields ...
  
  // Add rating relation
  rating SupplierRating?
  
  // ... rest of model ...
}
```

### Update Project Model

```prisma
model Project {
  // ... existing fields ...
  
  // Add rating relation
  ratings SupplierRating[]
  
  // ... rest of model ...
}
```

---

## 💬 User Flows

### Flow 1: QS Rates Supplier (After Order)

```
1. QS places order with Supplier A
2. Order is delivered
3. System prompts: "Rate your experience with Supplier A"
4. QS rates:
   - Overall: ⭐⭐⭐⭐⭐
   - Price: ⭐⭐⭐⭐
   - Delivery: ⭐⭐⭐⭐⭐
   - Quality: ⭐⭐⭐⭐
   - Communication: ⭐⭐⭐⭐⭐
5. QS writes review (optional)
6. Rating saved
7. Supplier sees rating (if public)
```

### Flow 2: QS Views Supplier Ratings

```
1. QS asks: "What's the price of cement?"
2. AI shows prices + ratings:
   "Cement prices:
   - Supplier A: $48/bag ⭐⭐⭐⭐⭐ (4.8/5)
   - Supplier B: $50/bag ⭐⭐⭐⭐ (4.2/5)
   - Supplier C: $52/bag ⭐⭐⭐ (3.5/5)
   
   Best: $48/bag from Supplier A (highest rated)"
```

### Flow 3: QS Compares Suppliers with Ratings

```
1. QS: "Compare suppliers for cement"
2. AI shows:
   "Supplier Comparison:
   
   Supplier A
   - Price: $48/bag
   - Rating: ⭐⭐⭐⭐⭐ (4.8/5)
   - Reviews: 25
   - "Great prices, fast delivery" - QS from Company X
   
   Supplier B
   - Price: $50/bag
   - Rating: ⭐⭐⭐⭐ (4.2/5)
   - Reviews: 15
   - "Good quality, reliable" - QS from Company Y"
```

---

## 🎨 AI Integration

### AI Shows Ratings in Responses

**Price Query:**
```
QS: "What's the price of cement?"

AI: "Cement prices:
- Supplier A: $48/bag ⭐⭐⭐⭐⭐ (4.8/5, 25 reviews)
  "Best prices, always on time" - Verified buyer
  
- Supplier B: $50/bag ⭐⭐⭐⭐ (4.2/5, 15 reviews)
  "Good quality, reliable service"
  
Best price: $48/bag from Supplier A (also highest rated)"
```

**Quote Comparison:**
```
QS: "Compare quotes for Office Building"

AI: "Quote Comparison:

Supplier A - $14,500
- Rating: ⭐⭐⭐⭐⭐ (4.8/5)
- "Fast delivery, great prices"
- Recommended ⭐

Supplier B - $14,800
- Rating: ⭐⭐⭐⭐ (4.2/5)
- "Good quality, reliable"

I recommend Supplier A - best price AND highest rating."
```

**Supplier Recommendation:**
```
QS: "Who should I use for cement?"

AI: "I recommend Supplier A:
- Best price: $48/bag
- Highest rating: ⭐⭐⭐⭐⭐ (4.8/5)
- 25 verified reviews
- Fast delivery (avg 2 days)
- Great communication

Based on your company's history, you've used them 5 times with 100% satisfaction."
```

---

## 📊 Rating Criteria

### 1. Overall Rating (Required)
- 1-5 stars
- Overall experience

### 2. Price Rating (Required)
- 1-5 stars
- Value for money
- Competitive pricing

### 3. Delivery Rating (Required)
- 1-5 stars
- On-time delivery
- Delivery speed
- Packaging quality

### 4. Quality Rating (Required)
- 1-5 stars
- Product quality
- Meets specifications
- Durability

### 5. Communication Rating (Required)
- 1-5 stars
- Responsiveness
- Clarity
- Professionalism

### 6. Review Text (Optional)
- Free-form text
- What went well
- What could improve
- Overall experience

### 7. Pros/Cons (Optional)
- Quick pros list
- Quick cons list
- Easy to scan

---

## 🎯 Features

### For QS Professionals

1. **Rate After Order**
   - Prompt after delivery
   - Quick rating form
   - Optional detailed review

2. **View Ratings**
   - See ratings when comparing quotes
   - See ratings in AI responses
   - Filter by rating in supplier list

3. **Search by Rating**
   - "Show me 5-star suppliers for cement"
   - "Find highly rated suppliers"

4. **Rating History**
   - See your past ratings
   - Edit/update ratings
   - Delete ratings

### For Suppliers

1. **View Ratings**
   - See all ratings received
   - Average ratings
   - Rating breakdown by category

2. **Respond to Reviews**
   - Reply to QS reviews
   - Thank for positive reviews
   - Address concerns

3. **Rating Analytics**
   - Rating trends over time
   - Category breakdown
   - Comparison to competitors

4. **Privacy Settings**
   - Hide specific ratings (if inappropriate)
   - Make ratings public/private

---

## 🔔 Notifications

### For QS
- "You have a pending rating for Supplier A"
- "New rating added for Supplier B"
- "Supplier A responded to your review"

### For Suppliers
- "You received a new rating from Company X"
- "Your rating improved to 4.8/5"
- "QS from Company Y left a review"

---

## 📱 UI Components

### Rating Display

```
┌─────────────────────────────────────┐
│ Supplier A                          │
│ ⭐⭐⭐⭐⭐ 4.8/5 (25 reviews)        │
│                                     │
│ Price: ⭐⭐⭐⭐                      │
│ Delivery: ⭐⭐⭐⭐⭐                 │
│ Quality: ⭐⭐⭐⭐                    │
│ Communication: ⭐⭐⭐⭐⭐            │
│                                     │
│ "Great prices, always on time"      │
│ - QS from Company X (Verified)     │
└─────────────────────────────────────┘
```

### Rating Form

```
┌─────────────────────────────────────┐
│ Rate Supplier A                     │
│                                     │
│ Overall: ⭐⭐⭐⭐⭐                  │
│ Price: ⭐⭐⭐⭐                      │
│ Delivery: ⭐⭐⭐⭐⭐                 │
│ Quality: ⭐⭐⭐⭐                    │
│ Communication: ⭐⭐⭐⭐⭐            │
│                                     │
│ Review (optional):                 │
│ [Text area]                         │
│                                     │
│ Pros:                               │
│ [Text area]                         │
│                                     │
│ Cons:                               │
│ [Text area]                         │
│                                     │
│ [Submit Rating]                     │
└─────────────────────────────────────┘
```

---

## 🚀 Implementation Priority

### MVP (Week 1-2)
1. ✅ Database schema
2. ✅ Basic rating model
3. ✅ Rate supplier API
4. ✅ View ratings API
5. ✅ Display ratings in price queries

### Phase 2 (Week 3-4)
6. ✅ Rating form UI
7. ✅ Rating display in AI responses
8. ✅ Rating history
9. ✅ Average rating calculation

### Phase 3 (Later)
10. ✅ Supplier response to reviews
11. ✅ Rating analytics
12. ✅ Rating filters
13. ✅ Verified ratings

---

## 💡 AI Integration Examples

### Example 1: Price Query with Ratings

```
QS: "What's the price of cement?"

AI: "Cement prices with ratings:

1. Supplier A: $48/bag
   ⭐⭐⭐⭐⭐ 4.8/5 (25 reviews)
   "Best prices, fast delivery" - Verified
   [View Details]

2. Supplier B: $50/bag
   ⭐⭐⭐⭐ 4.2/5 (15 reviews)
   "Good quality, reliable"
   [View Details]

3. Supplier C: $52/bag
   ⭐⭐⭐ 3.5/5 (8 reviews)
   "Average service"
   [View Details]

💡 Recommendation: Supplier A - best price AND highest rating!"
```

### Example 2: Quote Comparison with Ratings

```
QS: "Compare quotes for Office Building"

AI: "Quote Comparison:

Supplier A - $14,500
⭐⭐⭐⭐⭐ 4.8/5
"Fast delivery, great prices"
25 verified reviews
✅ Recommended

Supplier B - $14,800
⭐⭐⭐⭐ 4.2/5
"Good quality, reliable"
15 reviews

Supplier C - $15,000
⭐⭐⭐ 3.5/5
"Average service"
8 reviews

I recommend Supplier A - best value (price + rating)."
```

### Example 3: Supplier Recommendation

```
QS: "Who should I use for steel?"

AI: "I recommend Supplier A for steel:

✅ Best price: $195/unit
✅ Highest rating: ⭐⭐⭐⭐⭐ (4.8/5)
✅ 25 verified reviews
✅ Fast delivery (avg 2 days)
✅ Great communication

Recent reviews:
- "Best prices, always on time" - Company X
- "Excellent quality, highly recommend" - Company Y

Based on your company's history, you've used them 5 times with 100% satisfaction."
```

---

## 🎯 Success Metrics

### Engagement
- % of orders with ratings
- Average rating given
- Review completion rate

### Quality
- Average supplier rating
- Rating distribution
- Verified vs unverified ratings

### Impact
- Do QS use ratings in decisions?
- Do higher-rated suppliers get more orders?
- Rating correlation with repeat orders

---

## ✅ MVP Checklist

### Database
- [ ] SupplierRating model
- [ ] Relations to Organization, User, Order
- [ ] Indexes for performance

### Backend
- [ ] POST /api/v1/ratings - Create rating
- [ ] GET /api/v1/ratings/:supplierId - Get ratings
- [ ] GET /api/v1/suppliers/:id/rating - Get average rating
- [ ] PUT /api/v1/ratings/:id - Update rating
- [ ] DELETE /api/v1/ratings/:id - Delete rating

### Frontend
- [ ] Rating form component
- [ ] Rating display component
- [ ] Rating stars component
- [ ] Rating list view

### AI Integration
- [ ] Include ratings in price queries
- [ ] Include ratings in quote comparisons
- [ ] Rating-based recommendations

---

## 🎨 Design Principles

1. **Trust** - Verified ratings only
2. **Transparency** - Show all ratings
3. **Fairness** - Suppliers can respond
4. **Usefulness** - Help QS make decisions
5. **Simplicity** - Easy to rate, easy to view

---

**Supplier ratings make the platform more valuable by helping QS make informed decisions!**
