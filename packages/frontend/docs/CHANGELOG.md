# Changelog

All notable changes to the Construction Pricing Platform will be documented in this file.

## [Unreleased]

### Added
- **Postal Code Field**: Added separate postal code field to tenant registration (stored in separate column for future map integration)
- **Pending User Count Badge**: Red notification badge on User Management button showing count of pending user requests for admin users
- **Product Search**: Search bar in supplier dashboard to filter products by name (case-insensitive)
- **Searchable Filters**: Company dashboard now has searchable dropdown filters for suppliers and categories
- **Product Pagination**: Company dashboard products table paginated with 10 items per page
- **Discount Percentage Support**: Suppliers can now set special prices using either fixed price or discount percentage (0-100%)
- **Database Cleanup Script**: Script to clear all database data while preserving super admin user
- **Product Management Actions**: Added Edit, Delete, and Inactive/Activate buttons to each product row in the supplier dashboard
- **Inline Product Details**: Product details now expand inline within the table row instead of showing in a separate section
- **Supplier Contact Information View**: Companies can now view supplier phone number and location by clicking "View Details" on any product
- **Edit Product Modal**: Full-featured product editing interface with form validation
- **Delete Confirmation Modal**: Safe deletion workflow with confirmation dialog
- **Product Status Toggle**: Quick activation/deactivation of products with confirmation
- **Special Price Management UI**: Complete UI for suppliers to manage company-specific special prices
  - View all special prices for a product
  - Add new special prices for specific companies (during product creation/editing)
  - Edit existing special prices
  - Delete special prices
  - Support for both fixed price and discount percentage
  - Special prices are visible only to the assigned company
- **Companies List API**: New endpoint for suppliers to get list of active companies for special price assignment
- **Phone and Address Fields**: Registration form now requires phone number and address for new company/supplier registrations

### Changed
- **Admin Dashboard Navigation**: Removed separate tabs; Overview cards are now clickable to navigate to Companies, Suppliers, and Pending Requests
- **Company Dashboard**: Removed "Recent Price Update" and "My Supplier" sections
- **Product Sorting**: Products with special prices now appear first in company dashboard
- **Product Deletion**: Delete functionality restricted to admin users only (supplier_admin)
- **Pricing Type Selection**: Improved pricing type dropdown (Special Price vs Discount %) with proper state management
- **Discount Calculation**: Fixed discount percentage calculation (3% now correctly calculates as 3% off default price)
- **Special Price Display**: Company dashboard now shows both default and special prices, including calculated discount prices
- **Company Dashboard Product Details**: Simplified product details view to show only supplier contact information (phone and location) instead of price comparison table
- **Product Table UI**: Enhanced product table with action buttons for better product management
- **Error Handling**: Improved error handling for API delete operations (204 No Content responses)

### Fixed
- **Discount Calculation Bug**: Fixed issue where discount percentage was not calculating correctly (e.g., 3% discount showing as 3.00 price instead of calculated discount)
- **Pricing Type Selection**: Fixed issue where Discount % option was not properly selecting in dropdown
- **Pricing Type Persistence**: Fixed pricing type not being properly saved and restored when editing products
- **API Delete Handler**: Fixed issue with 204 No Content responses in delete operations
- **Product Details Loading**: Improved loading states and error handling for product details

## [Previous Releases]

### User Registration and Role Management (v1.0.0)
- Comprehensive user registration system with four registration types
- Two-level approval workflow (Super Admin and Tenant Admin)
- Role and permission management system
- Super admin dashboard for tenant management

---

**Note**: This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) principles.

