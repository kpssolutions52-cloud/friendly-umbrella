# Getting Started Guide

Welcome to the Construction Pricing Platform! This guide will help you get started with the platform.

## Table of Contents

1. [What is the Construction Pricing Platform?](#what-is-the-construction-pricing-platform)
2. [Account Types](#account-types)
3. [Registration](#registration)
4. [Login](#login)
5. [First Steps](#first-steps)

## What is the Construction Pricing Platform?

The Construction Pricing Platform is a real-time pricing system that connects construction suppliers with companies. It enables:

- **Suppliers** to manage their product catalogs and pricing
- **Companies** to browse supplier catalogs and view real-time prices
- **Private pricing** for specific company-supplier relationships
- **Real-time price updates** via WebSocket connections

## Account Types

The platform supports two types of accounts:

### Supplier Account
- Manage product catalog
- Set default prices for all companies
- Create private prices for specific companies
- Track product statistics and price views

### Company Account
- Browse supplier catalogs
- Search for products across all suppliers
- View real-time prices (default and private)
- Export price lists

## Registration

### Step 1: Access the Registration Page

1. Open your web browser
2. Navigate to `http://localhost:3000/auth/register`
3. You'll see the registration form

### Step 2: Fill in Registration Details

**For Suppliers:**
- **Tenant Name**: Your company name (e.g., "ABC Suppliers")
- **Tenant Type**: Select "Supplier"
- **Email**: Your business email address
- **Password**: Create a strong password (minimum 8 characters)
- **First Name**: Your first name
- **Last Name**: Your last name

**For Companies:**
- **Tenant Name**: Your company name (e.g., "XYZ Construction")
- **Tenant Type**: Select "Company"
- **Email**: Your business email address
- **Password**: Create a strong password (minimum 8 characters)
- **First Name**: Your first name
- **Last Name**: Your last name

### Step 3: Submit Registration

1. Review all information
2. Click the "Register" button
3. You'll be automatically logged in and redirected to your dashboard

## Login

### Step 1: Access the Login Page

1. Navigate to `http://localhost:3000/auth/login`
2. Enter your credentials

### Step 2: Enter Credentials

- **Email**: The email address you used during registration
- **Password**: Your account password

### Step 3: Sign In

1. Click the "Login" button
2. You'll be redirected to your dashboard based on your account type

## First Steps

### For Suppliers

After logging in, you'll see the Supplier Dashboard. Here's what to do next:

1. **Add Your First Product**
   - Click the "Add Product" button
   - Fill in product details (SKU, Name, Unit are required)
   - Set a default price if needed
   - Click "Create Product"

2. **View Your Products**
   - Click on any stat card (Total Products, Active Products, etc.)
   - View your product list in the table below

3. **Set Prices**
   - Products can have default prices visible to all companies
   - You can also set private prices for specific companies

### For Companies

After logging in, you'll see the Company Dashboard. Here's what to do next:

1. **Browse Suppliers**
   - View the list of available suppliers
   - Click on a supplier to see their details

2. **Search Products**
   - Use the search bar to find products
   - Filter by category or supplier

3. **View Prices**
   - See default prices for all products
   - Private prices (if set) will be shown automatically

## Need Help?

- Check the [Supplier Guide](./supplier-guide.md) for detailed supplier instructions
- Check the [Company Guide](./company-guide.md) for detailed company instructions
- Review the [API Testing Guide](./api-testing.md) for API access

