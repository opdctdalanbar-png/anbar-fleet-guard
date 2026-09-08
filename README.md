# Anbar Power Hub

Build a complete, production-ready, zero-data web application for "Oil Products Distribution Company - Anbar Branch" (شركة توزيع المنتجات النفطية - فرع الأنبار / القسم الفني / شعبة الكهرباء / وحدة المولدات) using React, Tailwind CSS, and Lucide Icons with full RTL support and modern oil-industry dark/light green branding.

---

1. FULL-WIDTH HEADER BANNER:

- Make the main header banner image span full-width (w-full / max-w-full) with proper aspect ratio across ALL pages (Login Page, Engineer Dashboard, Official Auditor View, Field Technician View).

2. AUTHENTICATION & ROLES:

- Accept test credentials and dynamic accounts stored in LocalStorage:

  * System Engineer (Admin): 'eng_admin' / 'Eng#2026'

  * Official Auditor: 'official_user' / 'Auth#2026'

  * Field Technician: 'tech_anbar' / 'Tech#2026'

- Display an active credential helper card on the login screen.

3. ZERO-BASED DASHBOARD & FLEET MANAGEMENT:

- Initial state must start at ZERO (0 Generators, 0 Active, 0 Under Maintenance).

- Dynamic 'تحت الصيانة' Counter: Automatically increments when a generator's status is changed manually OR when a technician submits a report with 'صيانة طارئة' or 'عطل دائم'.

- Free-Text Location Input: 'الموقع العام' must be a FREE TEXT INPUT FIELD (<input type="text">) across all modals (Add Generator, Add Technician) to allow typing custom division names freely (e.g., شعبة هيت, شعبة القائم).

4. DYNAMIC STATUS BADGES & QUICK FILTERING:

- In the Fleet Table, display colored status badges reflecting the technician's latest daily report:

  * Green badge for 'قيد العمل'

  * Yellow/Blue badge for 'صيانة وقائية'

  * Red badge for 'عطل دائم / طارئ'

- Add a quick filter dropdown above the Fleet Table to isolate generators by status: [الكل, قيد العمل, صيانة وقائية, عطل دائم / تحت الصيانة].

- Add table header click-to-sort (A-Z / Z-A) for 'الموقع العام' and 'الحالة'.

5. TECHNICIAN MANAGEMENT (ADMIN):

- Full Technician CRUD: Engineer can Add, Edit, and Delete technician accounts.

- Include explicit "تعديل" (Edit) and "حذف" (Delete) action buttons/icons on each technician card.

- Newly created or updated technician accounts must immediately persist in LocalStorage for login.

6. FIELD TECHNICIAN WORKFLOW:

- Strict Location Filtering: Technicians ONLY see generators matching their assigned 'General Location'.

- Form Sections: Meter Hours, Maintenance Type (وقائية / طارئة / عطل), Oil & Filter status, Cooling, Battery/Charging voltages, work notes, and photo uploads (up to 5 photos stored as Base64 strings).

- Enforce "One Report Per Generator Per Day" rule (auto-opens in Edit Mode if submitted today).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://anbar-fleet-guard.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3bb6bf04-44f7-49a0-b251-11236fea1d7e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
