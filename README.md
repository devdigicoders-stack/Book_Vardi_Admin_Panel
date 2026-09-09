# Book Vardi Admin Console (`bookvardiadmin`)

Master administrative and operations portal for the **Book Vardi** multi-vendor school uniform and educational marketplace.

## Features & 14 Admin Working Tabs
- **Dashboard**: Overall platform overview, KPIs, GMV, live audit feed & pending approval queue.
- **Products**: Approve, reject, edit, add, and remove catalog merchandise across categories.
- **Orders**: Full retail and institutional school bulk PO management with tracking and refund triggers.
- **Sellers**: Vendor KYC verification, commission rate adjustment, and payout balance disbursement.
- **Schools**: Onboard partner institutions, configure school-specific uniform/book kits and revenue share.
- **Users**: Manage parents, students, and teachers with access control and order histories.
- **Inventory**: Real-time warehouse stock tracking, low-stock threshold alerts, and Excel export.
- **Finance**: Gross GMV, net commission revenue, vendor settlement ledger, and GST compliance.
- **Marketing**: Campaign promo codes, discount coupons, and storefront announcement ticker.
- **Reviews & Reports**: Content moderation queue for ratings and customer grievances.
- **Analytics**: Business intelligence, monthly GMV trends, category share, and seller leaderboard.
- **Notifications**: Broadcast alerts via Push, SMS, and Email with delivery history.
- **Settings**: Commission rates, free shipping rules, payment methods, and RBAC matrix.
- **Support**: Customer ticket resolution, size exchange handling, and parent FAQ knowledgebase.

## Cross-App Ecosystem Ports
- **Customer Storefront (`bookvardiuser`)**: `http://localhost:5173`
- **Merchant Hub (`bookvardiseller`)**: `http://localhost:5174`
- **Master Admin (`bookvardiadmin`)**: `http://localhost:5175`

## Development
```bash
npm install
npm run dev
```
