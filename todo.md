# Omiyage Go - Project TODO

## Core Features (Completed)
- [x] Core UI/UX implementation (5 main screens: Home, Search Conditions, Results, Product Detail, Store Detail)
- [x] Reusable components (badges, chips, guarantee cards, facility tags)
- [x] Google Maps integration with clustering, route guidance, and traffic layers
- [x] Favorites functionality with LocalStorage persistence and comparison modal
- [x] Search history and browsing history with re-search feature
- [x] Share functionality (LINE, X/Twitter, URL copy, Web Share API)
- [x] Free-text search page with real-time filtering
- [x] Nationwide souvenir database (98 products from 15 major tourist regions)
- [x] Geolocation integration with user location detection
- [x] Regional filtering with prefecture-level search
- [x] Database schema migration (5 tables created)
- [x] Project upgraded to full-stack (web-db-user template)

## Admin Panel Implementation (Complete)
- [x] Database query helpers in server/db.ts
- [x] Admin dashboard scaffolding with DashboardLayout
- [x] Admin routing setup (/admin, /admin/products, etc.)
- [x] Admin authentication check (role-based access control)
- [x] Product management page UI (list view with CRUD buttons)
- [x] Product form page (add/edit form with all required fields)
- [x] tRPC API endpoints for admin operations (list, get, create, update, delete)
- [x] Connect frontend forms to tRPC mutations
- [x] Implement database persistence for product CRUD (createProduct, updateProduct, deleteProduct)
- [x] Add facility management page
- [x] Add seller/location management page (placeholder)
- [x] Add data migration page (mockData.ts → PostgreSQL)

## Frontend Integration
- [x] Update AdminProducts.tsx to use trpc.admin.products.list query
- [x] Update AdminProductForm.tsx to use trpc.admin.products.create/update mutations
- [x] Add loading states and error handling in admin pages
- [x] Add toast notifications for success/error feedback
- [x] Add form validation with better error messages
- [x] Add auto-refresh functionality after mutations (invalidate on mutation success)
- [x] Add JSON file upload functionality to AdminDataMigration

## Database & Backend
- [x] Implement actual database INSERT/UPDATE/DELETE in tRPC procedures
- [ ] Add transaction support for related data (product + sellers + giftMessages)
- [x] Create data migration page (AdminDataMigration.tsx) for mockData.ts and JSON import
- [ ] Add database indexes for performance
- [ ] Add audit logging for admin changes
- [x] Support JSON file upload from Gemini-generated data

## Testing
- [x] Write vitest tests for database query helpers (admin.test.ts)
- [ ] Write vitest tests for admin API endpoints (routers)
- [ ] Test admin authentication and authorization
- [ ] Test form validation and error handling
- [ ] Test product CRUD operations end-to-end

## Remaining Prefectures
- [ ] Add souvenirs from remaining 32 prefectures (currently only 15 covered)
- [ ] Update facility data for new regions
- [ ] Add regional seller information

## Deployment & Publishing
- [ ] Create checkpoint before publishing
- [ ] Verify all features work in production
- [ ] Set up admin user account
- [ ] Document admin panel usage
