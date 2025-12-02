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

The platform offers four registration options depending on your needs:

### Registration Types

1. **New Company Registration** - Register a new company organization (becomes admin)
2. **New Supplier Registration** - Register a new supplier organization (becomes admin)
3. **New User for a Company** - Join an existing company (requires admin approval)
4. **New User for a Supplier** - Join an existing supplier (requires admin approval)

### Step 1: Access the Registration Page

1. Open your web browser
2. Navigate to `http://localhost:3000/auth/register`
3. You'll see the registration form with a "Registration Type" dropdown

### Step 2: Select Registration Type

Choose the appropriate registration type from the dropdown:
- If creating a new organization, select "New Company Registration" or "New Supplier Registration"
- If joining an existing organization, select "New User for a Company" or "New User for a Supplier"

### Step 3: Fill in Registration Details

**For New Company/Supplier Registration:**
- **Registration Type**: Select "New Company Registration" or "New Supplier Registration"
- **Company/Supplier Name**: Your organization name (e.g., "ABC Suppliers" or "XYZ Construction")
- **Email**: Your business email address (you'll become the admin)
- **Password**: Create a strong password (minimum 8 characters)
- **First Name** (Optional): Your first name
- **Last Name** (Optional): Your last name

**For New User Registration:**
- **Registration Type**: Select "New User for a Company" or "New User for a Supplier"
- **Select Organization**: Choose from the dropdown list of active companies/suppliers
- **Email**: Your email address
- **Password**: Create a strong password (minimum 8 characters)
- **First Name** (Optional): Your first name
- **Last Name** (Optional): Your last name

### Step 4: Submit Registration

1. Review all information
2. Click the "Create account" button
3. You'll see a success message

### Step 5: Approval Process

**For New Company/Supplier:**
- Your registration is pending Super Admin approval
- You'll be redirected to the login page with a pending approval notice
- Once approved, you can log in and access your admin dashboard

**For New User:**
- Your registration is pending approval by your organization's admin
- You'll be redirected to the login page with a pending approval notice
- Once approved by your admin, you can log in

> **Note**: You cannot log in until your account is approved. Contact your organization's admin or the Super Admin if you have questions.

For detailed information about the registration and approval process, see the [User Registration and Role Management Guide](./user-registration-and-roles.md).

## Login

### Step 1: Access the Login Page

1. Navigate to `http://localhost:3000/auth/login`
2. Enter your credentials

### Step 2: Enter Credentials

- **Email**: The email address you used during registration
- **Password**: Your account password

### Step 3: Sign In

1. Click the "Login" button
2. If your account is pending approval, you'll see a notice on the login page
3. Once approved, you'll be redirected to your dashboard based on your account type

> **Note**: If you see a "Pending approval" message, your account is still awaiting approval. Contact your organization's admin or the Super Admin for assistance.

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

- Check the [User Registration and Role Management Guide](./user-registration-and-roles.md) for registration and user management details
- Check the [Supplier Guide](./supplier-guide.md) for detailed supplier instructions
- Check the [Company Guide](./company-guide.md) for detailed company instructions
- Review the [API Testing Guide](./api-testing.md) for API access








