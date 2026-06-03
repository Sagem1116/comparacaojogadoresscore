# FM Scouting Engine

A professional, modular scouting engine for football/soccer player evaluation using FMDataLab CSV exports. Build custom player evaluation metrics, role-specific scoring profiles, and dynamic analysis views.

## 🎯 Project Overview

FM Scouting Engine is a production-grade web application that enables scouts to:

1. **Import Data**: Load FMDataLab statistical metrics and role scores
2. **Detect Roles**: Automatically identify available roles from role scores CSV
3. **Configure Metrics**: Create custom metric profiles per role
4. **Calculate Scores**: Apply weighted formulas to generate composite scores
5. **Analyze Players**: View ranked players with detailed breakdowns
6. **Export Results**: Share configurations and analysis results

## 🏗️ Architecture

### Core Systems

#### 1. **Data Import System** (`src/services/importService.ts`)
- Parses CSV files using PapaParse
- Handles large datasets (50k+ rows)
- Automatic player matching between datasets
- Dynamic role detection
- Comprehensive error handling and validation

#### 2. **State Management** (`src/stores/dataStore.ts`)
- Zustand-based global state
- Manages players, roles, configurations, and analyses
- Type-safe state mutations
- Export/import functionality

#### 3. **Metric Calculation Engine** (`src/utils/metrics.ts`)
- Multiple normalization strategies: Min-Max, Z-Score, Percentile
- Weighted metric scoring
- Batch normalization for performance
- Percentile ranking

#### 4. **Formula Engine** (`src/utils/formula.ts`)
- Dynamic formula evaluation using safe expression evaluation
- Variable substitution (CustomMetricScore, RoleScore, Age, MarketValue, etc.)
- Formula validation and syntax checking
- Suggested formula templates

#### 5. **Analysis Service** (`src/services/analysisService.ts`)
- Player analysis calculation
- Ranking and percentile computation
- Filter and sort operations
- Statistical aggregation

#### 6. **Player Matching** (`src/utils/playerMatching.ts`)
- Intelligent player matching between datasets
- Fuzzy name matching with Levenshtein distance
- Multiple fallback matching strategies
- Duplicate detection

### Data Models (`src/types/index.ts`)

```typescript
// Core entities
Player          // Unified player with statistics and role scores
Role            // Dynamically detected role
MetricProfile   // Collection of metrics for a role
RoleConfiguration // Role + metrics + formula
PlayerAnalysis  // Calculated analysis results

// Configuration
ScoutingConfiguration  // Exportable configuration
ExportedConfiguration  // With metadata

// Tables
TableState            // Sorting, filtering, pagination
AnalysisView          // Saved analysis view
```

## 📁 Project Structure

```
src/
├── components/              # React components
│   ├── Navigation.tsx       # Main navigation
│   ├── ErrorBoundary.tsx    # Error handling
│   ├── pages/               # Page components
│   │   ├── ImportPage.tsx
│   │   ├── RoleConfigurationPage.tsx
│   │   ├── ScoutingTablePage.tsx
│   │   ├── PlayerProfilePage.tsx
│   │   └── DashboardPage.tsx
│   ├── tables/              # Table components
│   ├── forms/               # Form components
│   └── common/              # Reusable components
├── hooks/                   # React hooks
│   └── useAnalysis.ts       # Analysis-related hooks
├── services/                # Business logic
│   ├── importService.ts     # CSV import
│   └── analysisService.ts   # Analysis calculation
├── stores/                  # Zustand stores
│   └── dataStore.ts         # Global state
├── utils/                   # Utility functions
│   ├── csvParser.ts         # CSV parsing
│   ├── playerMatching.ts    # Player matching
│   ├── metrics.ts           # Metric calculations
│   └── formula.ts           # Formula engine
├── types/                   # TypeScript types
│   └── index.ts             # All type definitions
├── App.tsx                  # Main app component
├── main.tsx                 # Entry point
└── index.css                # Global styles
```

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your Supabase credentials (optional for localStorage mode)
```

### Development

```bash
# Start dev server
npm run dev

# The app opens at http://localhost:5173
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Key Features

### Dynamic Role Detection
- Automatically detects all role score columns from CSV
- No hardcoded roles - fully data-driven
- Creates Role entities for each detected role

### Customizable Metric Profiles
- Select any metrics from the imported dataset
- Assign individual weights
- Enable/disable metrics
- Choose normalization strategy per metric
- Set inverse (lower = better) flags
- Define thresholds

### Formula System
- Custom final score formulas
- Available variables: CustomMetricScore, RoleScore, Age, MinutesPlayed, MarketValue
- Formula validation and syntax checking
- Real-time recalculation
- Pre-built formula templates

### Professional Table
- TanStack Table integration
- Sorting, filtering, searching
- Column visibility control
- Pagination with configurable page size
- Sticky headers
- Export to CSV
- Multi-select player rows

### Player Profile Page
- Full statistical profile
- Metric breakdown with normalized values
- Role score analysis
- Percentile rankings
- Radar chart visualization
- Similar player recommendations

### Dashboard
- Key statistics overview
- Top 10 ranked players
- Youngest talents
- Best value players
- Recent imports
- Saved configurations

## 📊 Workflow Example

### 1. Import Data
```typescript
// User uploads two CSVs:
// - fm_stats.csv (player stats)
// - fm_roles.csv (role scores)

// System automatically:
// - Parses files
// - Detects roles (Ball Winning Midfielder, Advanced Forward, etc.)
// - Matches players
// - Creates unified dataset
```

### 2. Configure Role
```typescript
// For "Ball Winning Midfielder" role:
// - Select metrics: Tackles Won %, Interceptions/90, Pressures/90, Progressive Passes/90
// - Assign weights: [30, 25, 25, 20]
// - Choose normalization: Min-Max
// - Set inverse: No
```

### 3. Define Formula
```typescript
// Custom formula:
// (CustomMetricScore * 0.7) + (RoleScore * 0.3)
// This weights custom metrics 70% and FMDataLab role score 30%
```

### 4. Generate Analysis
```typescript
// System:
// 1. Normalizes all metrics
// 2. Calculates weighted metric score per player
// 3. Extracts FMDataLab role score
// 4. Evaluates formula for final score
// 5. Ranks players and calculates percentiles
// 6. Displays results in scouting table
```

## 🧮 Calculation Pipeline

```
Player Data
    ↓
[Metric Normalization]
  ├─ For each metric:
  │  ├─ Calculate stats across all players
  │  ├─ Normalize using selected strategy
  │  └─ Apply inverse if needed
    ↓
[Weighted Scoring]
  ├─ Custom Metric Score = Σ(normalized_metric * weight)
  ├─ Extract FMDataLab Role Score
  ├─ Clamp to valid ranges
    ↓
[Formula Evaluation]
  ├─ Substitute variables
  ├─ Evaluate formula expression
  ├─ Generate Final Score
    ↓
[Ranking & Percentiles]
  ├─ Sort by final score
  ├─ Calculate percentile ranks
  ├─ Assign positions
    ↓
[Results]
  └─ Display in scouting table
```

## 🛠️ Extension Points

The architecture is designed for easy expansion:

### Adding New Calculations
```typescript
// Create new service in src/services/
// Export calculations in analysisService.ts
// Hook via useDataStore()
```

### New Table Views
```typescript
// Create component in src/components/tables/
// Use useFilteredAnalyses() hook for filtering
// Wrap with usePagination() for pagination
```

### New Filter/Sort Options
```typescript
// Extend FilterCriteria type in src/types/
// Add logic in useFilteredAnalyses() hook
```

### New Metrics
```typescript
// Import any CSV column automatically
// Create MetricConfig for each metric
// Assign weights and normalization
```

## 📝 Configuration Export Format

Configurations are exported as JSON:

```json
{
  "version": "1.0.0",
  "exportedAt": "2024-01-15T10:30:00Z",
  "configuration": {
    "id": "config-1234567890",
    "name": "FM Scouting Configuration",
    "roles": [
      {
        "id": "role-123",
        "name": "Ball Winning Midfielder",
        "columnName": "Ball Winning Midfielder Score",
        "isActive": true
      }
    ],
    "metricProfiles": [
      {
        "id": "profile-123",
        "roleId": "role-123",
        "metrics": [
          {
            "name": "Tackles Won %",
            "columnName": "tackles_won_pct",
            "weight": 30,
            "normalizationType": "minMax",
            "enabled": true,
            "inverse": false
          }
        ]
      }
    ],
    "formulas": [
      {
        "roleId": "role-123",
        "expression": "(CustomMetricScore * 0.7) + (RoleScore * 0.3)"
      }
    ]
  },
  "metadata": {
    "description": "Custom scouting configuration",
    "author": "Scout Name",
    "tags": ["football", "scouting"]
  }
}
```

## 🔄 To Continue Development

### 1. Create Page Components
- [ ] `ImportPage.tsx` - CSV import interface with progress tracking
- [ ] `RoleConfigurationPage.tsx` - Metric profile builder
- [ ] `ScoutingTablePage.tsx` - Main analysis table
- [ ] `PlayerProfilePage.tsx` - Detailed player view
- [ ] `DashboardPage.tsx` - Overview and stats

### 2. Create Form Components
- [ ] `MetricSelector.tsx` - Metric selection and weighting
- [ ] `FormulaBuilder.tsx` - Formula editor with validation
- [ ] `FileUploader.tsx` - CSV file upload
- [ ] `FilterPanel.tsx` - Advanced filtering UI

### 3. Create Table Components
- [ ] `ScoutingTable.tsx` - Main results table with TanStack Table
- [ ] `PlayerComparisonTable.tsx` - Side-by-side player comparison
- [ ] `MetricBreakdownTable.tsx` - Metric details per player

### 4. Create Visualization Components
- [ ] `RadarChart.tsx` - Recharts radar visualization
- [ ] `PercentileChart.tsx` - Player percentile visualization
- [ ] `MetricDistribution.tsx` - Distribution charts per metric
- [ ] `ComparisonChart.tsx` - Head-to-head player charts

### 5. Create Utility Components
- [ ] `LoadingSpinner.tsx` - Loading state
- [ ] `Modal.tsx` - Reusable modal dialog
- [ ] `Toast.tsx` - Notification system
- [ ] `DataTable.tsx` - Reusable data table wrapper

### 6. Implement Missing Hooks
- [ ] `useImport.ts` - Import workflow hook
- [ ] `useConfiguration.ts` - Configuration management
- [ ] `useExportImport.ts` - JSON export/import
- [ ] `useLocalStorage.ts` - Persistence

### 7. Add Services
- [ ] `storageService.ts` - LocalStorage/IndexedDB persistence
- [ ] `exportService.ts` - Export to CSV, JSON
- [ ] `supabaseService.ts` - Optional Supabase integration

## 🎨 UI Design

The app follows FMDataLab/Wyscout aesthetic:
- **Dark mode**: Slate-950 background, slate-100 text
- **Dense layout**: Compact spacing for data density
- **Professional palette**: Blue accents, muted colors
- **Clear hierarchy**: Large sections with subtle borders
- **Responsive**: Mobile-first, optimized for desktop

## 📦 Dependencies

- **React 18.2** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Zustand 4.4** - State management
- **TanStack Table** - Advanced tables
- **Recharts** - Data visualization
- **PapaParse 5.4** - CSV parsing
- **Lucide Icons** - Icon library
- **React Router 6.20** - Routing
- **UUID** - ID generation

## 🚀 Performance Considerations

- **CSV Parsing**: Streaming parser for large files
- **State Management**: Zustand for minimal re-renders
- **Table Virtualization**: TanStack Table with virtualization
- **Memoization**: useMemo for expensive calculations
- **Lazy Loading**: Code splitting by route

## 📄 License

Built for the FM Scouting Engine project.

## 🤝 Contributing

This is a foundation architecture. Extend by:
1. Adding new calculation types
2. Creating new visualization components
3. Implementing persistence layers
4. Adding real-time collaboration

---

**Next Steps**: Start by creating `ImportPage.tsx` using the import workflow already defined in `importService.ts`.
