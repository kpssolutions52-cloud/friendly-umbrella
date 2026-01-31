# General User Role - Design Document

## 🎯 Overview

**General Users** are homeowners, individuals, or small businesses who have construction projects and need end-to-end guidance with real-time supplier pricing and project management.

**This role expands the platform from B2B to B2C, creating massive market expansion and viral potential.**

---

## 👥 User Types

### 1. QS Professionals
- **Who:** Quantity Surveyors working for construction companies
- **Need:** Fast pricing, quote generation, project management
- **Use Case:** Professional construction cost estimation

### 2. Suppliers
- **Who:** Material suppliers, service providers
- **Need:** Manage inventory, prices, respond to quotes
- **Use Case:** Business operations, customer management

### 3. General Users ⭐ NEW
- **Who:** Homeowners, individuals, small businesses
- **Need:** Build/renovate something, need guidance + pricing
- **Use Case:** Personal construction projects

---

## 💡 Why General Users?

### Market Expansion
- **B2B Market:** ~100,000 QS professionals globally
- **B2C Market:** ~50 million homeowners doing renovations annually
- **Market Size:** 500x larger potential market

### Viral Potential
- Homeowners share on social media: "I got instant quotes for my kitchen renovation!"
- Word-of-mouth growth
- Consumer reviews and testimonials
- Media coverage ("AI helps homeowners build")

### Network Effects
- More users = more data = better AI
- More projects = better price predictions
- More suppliers = better competition
- More reviews = better trust

### Revenue Potential
- B2C subscription model
- Transaction fees
- Premium features
- Marketplace commissions

---

## 🎨 General User Experience

### The Journey

```
1. General User: "I want to build a kitchen"
   ↓
2. AI: "Great! Let me guide you through this.
        First, what's your budget?"
   ↓
3. General User: "$20,000"
   ↓
4. AI: "Perfect! For $20,000, you can get:
        - Basic kitchen: $15,000
        - Mid-range: $20,000
        - Premium: $25,000+
        
        What style do you prefer?"
   ↓
5. General User: "Modern, mid-range"
   ↓
6. AI: "Here's your project plan:
        
        Materials Needed:
        - Cabinets: $8,000
        - Countertops: $4,000
        - Appliances: $5,000
        - Flooring: $2,000
        - Other: $1,000
        
        Total: $20,000
        
        Real-time Quotes:
        - Supplier A: $19,500 ⭐⭐⭐⭐⭐
        - Supplier B: $20,200 ⭐⭐⭐⭐
        - Supplier C: $21,000 ⭐⭐⭐
        
        Timeline: 4-6 weeks
        Steps: [Detailed guide]
        
        [Start Project] [Get More Quotes]"
```

---

## 🚀 General User Features

### 1. Project Wizard (Step-by-Step Guide)

**AI guides users through entire process:**

```
Step 1: What do you want to build?
- Kitchen renovation
- Bathroom remodel
- Home addition
- Deck/patio
- Roof replacement
- etc.

Step 2: Budget Planning
- "What's your budget?"
- AI suggests realistic budgets
- Shows what's possible

Step 3: Style & Preferences
- Modern, traditional, etc.
- Material preferences
- Color schemes

Step 4: Material Selection
- AI suggests materials
- Shows real-time prices
- Explains options

Step 5: Quote Generation
- Real-time supplier quotes
- Price comparison
- Recommendations

Step 6: Project Timeline
- Estimated timeline
- Step-by-step schedule
- Milestone tracking

Step 7: Project Management
- Track progress
- Budget tracking
- Timeline updates
```

### 2. Simplified AI Chat

**Even simpler than QS interface:**

```
General User: "I want to renovate my kitchen"

AI: "I'd love to help! Let's start:
    1. What's your budget?
    2. What style do you like?
    3. When do you want to start?
    
    Or I can create a quick estimate based on average kitchen sizes."

General User: "Budget is $20,000, modern style"

AI: "Perfect! For $20,000 modern kitchen:
    
    📋 Project Breakdown:
    - Cabinets: $8,000
    - Countertops: $4,000
    - Appliances: $5,000
    - Flooring: $2,000
    - Installation: $1,000
    
    💰 Real-time Quotes:
    - Supplier A: $19,500 (Best price + highest rated)
    - Supplier B: $20,200
    - Supplier C: $21,000
    
    ⏱️ Timeline: 4-6 weeks
    
    [Create Project] [Get Detailed Quote] [See Timeline]"
```

### 3. Educational Content

**Help users understand construction:**

- Material guides
- Cost breakdowns
- Timeline expectations
- Common issues
- Best practices
- DIY vs professional

### 4. Budget Planning

**Help users plan and track:**

- Budget calculator
- Cost breakdowns
- Over-budget alerts
- Savings suggestions
- Payment planning

### 5. Project Timeline

**Visual timeline with milestones:**

```
Week 1-2: Planning & Design
Week 3-4: Material Ordering
Week 5-6: Demolition
Week 7-8: Installation
Week 9-10: Finishing
Week 11-12: Final Inspection
```

### 6. Real-Time Quotes

**Same as QS, but simplified:**

- Show best prices
- Highlight recommended suppliers
- Explain why recommended
- Show ratings and reviews
- One-click quote request

### 7. Project Dashboard

**Simple visual dashboard:**

```
┌─────────────────────────────────────┐
│ My Kitchen Renovation                │
├─────────────────────────────────────┤
│ Budget: $20,000                      │
│ Spent: $12,500                       │
│ Remaining: $7,500                    │
│                                     │
│ Timeline: Week 6 of 12               │
│ Progress: ████████░░░░ 50%          │
│                                     │
│ Next Steps:                         │
│ ✅ Order materials                  │
│ ⏳ Schedule installation            │
│ ⏳ Final inspection                 │
│                                     │
│ Active Quotes: 3                    │
│ Orders: 2                           │
└─────────────────────────────────────┘
```

---

## 🎯 Use Cases

### Use Case 1: Kitchen Renovation

```
General User: "I want to renovate my kitchen"

AI: [Guides through entire process]
    - Budget planning
    - Style selection
    - Material selection
    - Real-time quotes
    - Timeline
    - Project tracking
```

### Use Case 2: Home Addition

```
General User: "I want to add a room to my house"

AI: [Provides complete guide]
    - Permits needed
    - Cost estimates
    - Timeline
    - Material requirements
    - Real-time quotes
```

### Use Case 3: Bathroom Remodel

```
General User: "How much to remodel a bathroom?"

AI: [Instant estimate]
    - Average costs
    - Material breakdown
    - Real-time quotes
    - Timeline
    - Step-by-step guide
```

---

## 🏗️ Database Schema Updates

### Update UserType Enum

```prisma
enum UserType {
  qs
  supplier
  general_user  // NEW
}
```

### Update Organization Model

```prisma
model Organization {
  // ... existing fields ...
  
  type      OrgType  // company | supplier | individual (for general users)
  
  // ... rest of model ...
}

enum OrgType {
  company
  supplier
  individual  // NEW - for general users
}
```

### General User Projects

```prisma
model Project {
  // ... existing fields ...
  
  // General users can have projects too
  // No company required for general users
  companyId   String?  @map("company_id") // Optional for general users
  
  // ... rest of model ...
}
```

---

## 🎨 UI/UX Differences

### QS Interface
- Professional, data-heavy
- Multiple projects
- Advanced features
- Power user tools

### Supplier Interface
- Business-focused
- Inventory management
- Order management
- Analytics

### General User Interface ⭐
- **Simplified, friendly**
- **Step-by-step guidance**
- **Visual, easy to understand**
- **Educational content**
- **One project at a time (usually)**
- **Mobile-first**

---

## 💬 AI Chat Examples

### Example 1: Project Planning

```
General User: "I want to build a deck"

AI: "Great! Let's plan your deck project.
     
     First, a few questions:
     1. What size deck? (e.g., 12x20 feet)
     2. What's your budget?
     3. What material? (wood, composite, etc.)
     4. When do you want to start?
     
     Or I can give you a quick estimate based on average deck sizes."

General User: "12x20 feet, $10,000 budget, composite"

AI: "Perfect! For a 12x20 composite deck:
     
     📋 Materials Needed:
     - Composite decking: $4,500
     - Frame materials: $2,000
     - Railings: $1,500
     - Hardware: $500
     - Installation: $1,500
     
     Total: $10,000
     
     💰 Real-time Quotes:
     - Supplier A: $9,800 ⭐⭐⭐⭐⭐
     - Supplier B: $10,200 ⭐⭐⭐⭐
     
     ⏱️ Timeline: 2-3 weeks
     
     📝 Next Steps:
     1. Get permits (if needed)
     2. Order materials
     3. Schedule installation
     4. Track progress
     
     [Create Project] [Get Quotes] [See Timeline]"
```

### Example 2: Budget Planning

```
General User: "What can I build with $15,000?"

AI: "With $15,000, you can:
     
     🏠 Kitchen Renovation
     - Basic: $12,000
     - Mid-range: $15,000
     - Premium: $20,000+
     
     🚿 Bathroom Remodel
     - Basic: $8,000
     - Mid-range: $12,000
     - Premium: $15,000+
     
     🏡 Home Addition
     - Small room: $15,000
     - Medium room: $25,000+
     
     🪵 Deck/Patio
     - Basic: $5,000
     - Mid-range: $10,000
     - Premium: $15,000+
     
     Which project interests you?"
```

### Example 3: Project Tracking

```
General User: "How's my kitchen project going?"

AI: "Your Kitchen Renovation Project:
     
     📊 Progress: Week 6 of 12 (50% complete)
     
     ✅ Completed:
     - Design finalized
     - Materials ordered
     - Demolition done
     
     ⏳ In Progress:
     - Installation (Week 6-8)
     
     📅 Upcoming:
     - Finishing (Week 9-10)
     - Final inspection (Week 11-12)
     
     💰 Budget:
     - Budget: $20,000
     - Spent: $12,500
     - Remaining: $7,500
     - On track! ✅
     
     📦 Orders:
     - Order #1: Delivered ✅
     - Order #2: In transit 🚚
     
     [View Details] [Track Orders] [Update Progress]"
```

---

## 🎯 Features Comparison

| Feature | QS Professional | Supplier | General User |
|---------|----------------|----------|--------------|
| AI Chat | ✅ Advanced | ✅ Business | ✅ Simplified |
| Price Queries | ✅ Yes | ❌ No | ✅ Yes |
| Quote Generation | ✅ Yes | ❌ No | ✅ Yes |
| Project Management | ✅ Multiple | ❌ No | ✅ Single |
| Order Management | ✅ Yes | ✅ Yes | ✅ Yes |
| Rating Suppliers | ✅ Yes | ❌ No | ✅ Yes |
| Educational Content | ❌ No | ❌ No | ✅ Yes |
| Budget Planning | ✅ Basic | ❌ No | ✅ Advanced |
| Step-by-Step Guide | ❌ No | ❌ No | ✅ Yes |
| Timeline Tracking | ✅ Yes | ❌ No | ✅ Yes |

---

## 🚀 MVP Features for General Users

### MVP 1 (Weeks 1-4)
- ✅ Sign up as General User
- ✅ AI Chat (simplified)
- ✅ "I want to build X" → AI guides
- ✅ Real-time price queries
- ✅ Basic project creation
- ✅ Simple dashboard

### MVP 2 (Weeks 5-8)
- ✅ Project wizard (step-by-step)
- ✅ Budget planning
- ✅ Timeline tracking
- ✅ Quote generation
- ✅ Educational content

### MVP 3 (Weeks 9-12)
- ✅ Complete project management
- ✅ Order tracking
- ✅ Progress updates
- ✅ Budget alerts
- ✅ Timeline notifications

---

## 📊 Market Impact

### Before (B2B Only)
- Market: ~100,000 QS professionals
- Revenue: B2B subscriptions
- Growth: Linear

### After (B2B + B2C)
- Market: ~50 million homeowners
- Revenue: B2B + B2C subscriptions + transactions
- Growth: Exponential (viral potential)

### Competitive Advantage
- **Only platform** serving all three user types
- **Network effects** across all users
- **Data advantage** from all user types
- **Market leadership** in construction AI

---

## 🎯 Success Metrics

### General User Adoption
- [ ] 1,000+ general users in first month
- [ ] 10,000+ projects created
- [ ] 50%+ project completion rate
- [ ] 80%+ user satisfaction

### Viral Growth
- [ ] 10+ social media shares per day
- [ ] 5+ media mentions per month
- [ ] 20%+ referral rate
- [ ] Word-of-mouth growth

### Revenue
- [ ] B2C subscription revenue
- [ ] Transaction fees
- [ ] Premium features
- [ ] Marketplace commissions

---

## ✅ Implementation Checklist

### Database
- [ ] Add `general_user` to UserType enum
- [ ] Add `individual` to OrgType enum
- [ ] Update Project model (companyId optional)
- [ ] Add general user specific fields

### Backend
- [ ] General user registration
- [ ] Simplified AI chat endpoint
- [ ] Project wizard API
- [ ] Budget planning API
- [ ] Educational content API

### Frontend
- [ ] General user sign up flow
- [ ] Simplified chat interface
- [ ] Project wizard UI
- [ ] Budget planning UI
- [ ] Timeline tracking UI
- [ ] Educational content pages

### AI Integration
- [ ] General user intent recognition
- [ ] Project planning responses
- [ ] Budget guidance
- [ ] Educational responses

---

## 🎯 Why This Is a "Wow" Factor

### 1. Market Expansion
- **500x larger market** (B2C vs B2B)
- **Viral potential** (homeowners share)
- **Network effects** (more users = better)

### 2. Differentiation
- **Only platform** serving all user types
- **Complete ecosystem** (QS + Suppliers + Users)
- **Unique value** (end-to-end guidance)

### 3. Revenue Potential
- **Multiple revenue streams**
- **B2C subscriptions**
- **Transaction fees**
- **Marketplace commissions**

### 4. Social Proof
- **Consumer reviews** (more credible)
- **Media coverage** (homeowner stories)
- **Word-of-mouth** (viral growth)

---

## 🚀 Go-to-Market Strategy

### Phase 1: B2B Launch (Weeks 1-14)
- Launch with QS + Suppliers
- Build reputation
- Gather data

### Phase 2: B2C Launch (Weeks 15-20)
- Add General Users
- Marketing campaign
- Social media push
- Media outreach

### Phase 3: Growth (Weeks 21+)
- Viral features
- Referral program
- Content marketing
- Partnerships

---

## 💡 Key Insights

**General Users need:**
- **Guidance** (not just tools)
- **Simplicity** (not complexity)
- **Education** (not assumptions)
- **Support** (hand-holding)

**This is different from QS who need:**
- **Speed** (fast pricing)
- **Accuracy** (precise quotes)
- **Efficiency** (save time)

**By serving both, we create:**
- **Complete platform**
- **Network effects**
- **Market leadership**
- **Sustainable advantage**

---

**Adding General Users transforms this from a B2B tool to a complete construction platform! 🚀**
