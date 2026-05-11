# Hive Accounting

A professional, scalable accounting software solution built with React.

## 🏗 Architecture
This project follows a **Feature-Based Architecture** to ensure scalability and maintainability.

- `src/components`: Shared UI elements.
- `src/features`: Domain-driven modules (logic, components, and hooks per feature).
- `src/hooks`: Global reusable logic.
- `src/layouts`: Page structure wrappers.
- `src/pages`: Routed views.
- `src/services`: API communication and data fetching.
- `src/store`: Global state management.
- `src/utils`: Pure helper functions.

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS)
- npm or pnpm

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

## 🛠 Tech Stack
- **Frontend**: React 18+ / TypeScript
- **Styling**: Tailwind CSS (Recommended)
- **State Management**: Zustand / Redux Toolkit
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
