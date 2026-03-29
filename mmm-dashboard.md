# MMM Dashboard - Project Overview & Structure

Welcome to the **MMM (Marketing Mix Modeling) Dashboard** project. This document serves as a comprehensive guide for developers and agents to understand the architecture, technology stack, and operational details of the application.

## 🚀 Quick Start (Localhost Services)

The application consists of multiple interconnected services. Ensure these are running for full functionality:

| Service | Localhost URL | Description |
| :--- | :--- | :--- |
| **Frontend** | [http://localhost:5173](http://localhost:5173) | Main React Web Application (Vite) |
| **Backend/Server** | [http://localhost:3001](http://localhost:3001) | Express API & AI Agent Backend |
| **Dataiku Interface** | [http://localhost:11200](http://localhost:11200) | External Dataiku integration for data processing |
| **AI Model (LM Studio)** | `http://localhost:1234` | Local LLM server (if configured for `lmstudio`) |

---

## 🛠️ Technology Stack

### **Frontend**
- **Core**: React 19 + TypeScript (Powered by Vite)
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand (for reactive, global state)
- **Visualization**: Recharts (Interactive charts and data plots)
- **Icons**: Lucide React
- **API Client**: Axios & Supabase JS
- **Data Parsing**: Papaparse (Standardized CSV processing)
- **Local Persistence**: `idb-keyval` (IndexedDB for storing large datasets locally)

### **Backend (Server)**
- **Runtime**: Node.js with TypeScript (`tsx`)
- **Framework**: Express 5
- **Database/Auth**: Supabase (Cloud-hosted PostgreSQL + Auth)
- **Integration**: Dataiku API for heavy-duty data transformations
- **Utilities**: `xml2js`, `cheerio` (for web scraping/XML handling)

### **AI Agent (Internal)**
- **Architecture**: Planner / Runner pattern
- **Location**: Found in `server/agent/`
- **Core Logic**: TypeScript-based decision making and tool execution
- **Tools**: Custom toolset for data querying, transformation, and analysis

---

## 📂 Project Structure

```text
MMM/
├── src/                    # Frontend Application
│   ├── components/         # Reusable UI components (Sidebar, Charts, Cards)
│   ├── pages/              # Page components (Optimize, Connect, Measure, etc.)
│   ├── store/              # Zustand state stores (useDataStore.ts)
│   ├── hooks/              # Custom React hooks (hooks/useDashboardSync.ts)
│   ├── lib/                # Utility functions (formatters, types)
│   └── App.tsx             # Main routing and layout wrapper
├── server/                 # Backend Server & Agent
│   ├── index.ts            # Express server entry point
│   ├── agent/              # AI Agent implementation
│   │   ├── planner.ts      # Task planning logic
│   │   ├── runner.ts       # Task execution logic
│   │   ├── tools.ts        # Agent capabilities (search, calculate, etc.)
│   │   └── knowledge/      # Agent-specific documentation and prompts
│   ├── test_rag.ts         # Testing script for retrieval-augmented generation
│   └── package.json        # Server-specific dependencies
├── docs/                   # Project documentation and help files
├── .env                    # Environment variables (Supabase keys, API URLs)
└── package.json            # Root project/Frontend dependencies
```

---

## 💡 Key Implementation Details

### **Data Syncing**
The dashboard uses a specialized hook (`useDashboardSync.ts`) to automatically persist the state of the dashboard to Supabase. This ensures that any changes to mappings, filters, or optimization parameters are saved across sessions.

### **Optimization Engine**
Budget optimization logic is handled via `useOptimizeData.ts`, which simulates spend allocation based on historical performance data and projected ROAS.

### **Agent Interaction**
The internal agent is designed to assist with complex data tasks. It can be triggered via the `ChatPage` and uses the logic defined in `server/agent` to process requests, formulate plans, and execute them using the provided tools.

### **Dataiku Integration**
The project is configured to connect to a local Dataiku instance for advanced data engineering tasks. Configuration is managed via the `.env` file under `DATAIKU_*` variables.

---

## 📝 Guidelines for Agents

- **Modifying UI**: Use the predefined design system (Tailwind colors like `brand-primary`, `brand-secondary`).
- **Adding Tools**: New agent capabilities should be added to `server/agent/tools.ts`.
- **Environment**: Always check the `.env` for the current `VITE_AI_MODEL` setting to understand which AI provider is being used.
- **Routing**: Navigation is handled via the `activePage` state in `useDataStore`. Adding a new page requires an entry in `App.tsx` and `Sidebar.tsx`.
