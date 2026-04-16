# Technical Specification: Sprint 3 - History & Reports

## 1. Goal
Provide a new view where the user can consult routes from previous days and see a performance summary (total, delivered vs. rejected).

## 2. Navigation
- **Header Update**: Add a navigation toggle or buttons in the `Header` component to switch between "Ruta Actual" (`/`) and "Historial" (`/historial`).
- **Standard**: Buttons must be large and clear (h-14).

## 3. Data Strategy
- **Fetch**: Query the `stops` table in Supabase.
- **Filters**:
  - `user_id`: Must match the authenticated user.
  - `created_at`: Filter for the last 30 days by default to ensure efficiency.
  - `order`: Sort by `created_at` descending.
- **Grouping**: Logic to group records by calendar date (YYYY-MM-DD) on the client side.

## 4. Business Logic (Reports)
- **Metrics per Day**:
  - `Total Packages`: Total count of stops for that day.
  - `Delivered`: Count of stops with status `delivered`.
  - `Failed/Rejected`: Count of stops with status `failed`.
- **Format**: Dates should be displayed in a human-readable format (e.g., "Hoy", "Ayer", "Lunes 14 de Abril").

## 5. UI/UX "Mom-Friendly" Standards
- **Daily Cards**: Each day is a large card.
- **Big Numbers**: Total count, Delivered, and Failed counts displayed in large, bold font.
- **Semantic Colors**:
  - Total: Slate/Dark Gray.
  - Delivered: Green (`text-green-600`).
  - Failed: Red (`text-red-600`).
- **No Charts**: Avoid complex data visualizations; stick to clear labels and numbers.

## 6. Route Protection
- `/historial` must be protected by the existing Middleware to ensure only logged-in users can access it.

## 7. Definition of Done (DoD)
- New page `/historial` is functional and accessible.
- Users can switch between Active Route and History from the Header.
- Data is correctly grouped by day.
- Performance metrics (Total, Delivered, Failed) are accurate.
- UI follows "Mom-Friendly" standards.
- No TypeScript errors or broken links.
