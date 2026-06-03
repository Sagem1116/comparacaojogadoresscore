# FM Scouting Engine - Professional Player Evaluation Platform

A sophisticated, modular web application for analyzing football player data using FMDataLab exports. Dynamically generates role scoring systems and customizable metric profiles with real-time player ranking.

## Architecture Overview

### Core Systems

**1. Dynamic Data Import**
- CSV parsing with PapaParse
- Automatic player matching between datasets
- Dynamic role detection from CSV columns
- Large dataset support (50k+ rows)

**2. Metric Calculation Engine**
- Min-Max normalization
- Z-Score normalization  
- Percentile-based scoring
- Weighted metric aggregation
- Configurable inverse metrics

**3. Role Scoring System**
- FMDataLab attribute score extraction
- Dynamic role profile generation
- Per-role metric configuration
- Custom formula builder with validation

**4. Analysis Pipeline**
- Per-player analysis calculation
- Percentile ranking across all players
- Comparative statistics
- Export to CSV

### Key Features

✨ **Fully Dynamic** - No hardcoded football logic; everything data-driven  
📊 **Modular Architecture** - Easy to extend with new analysis modules  
⚡ **High Performance** - Handles large datasets efficiently  
🎯 **Role Detection** - Automatically identifies available roles from data  
🔧 **Customizable Formulas** - Build complex scoring formulas with validation  
📤 **Export/Import** - Save and share configurations as JSON  
🎨 **Professional UI** - Dark mode analytics interface inspired by FMDataLab/Wyscout

## Getting Started

### Installation

```bash
npm install
npm run dev  # Development server on http://localhost:5173
npm run build  # Production build
```

### Usage Workflow

1. **Import Data**
   - Upload Statistics CSV (player metrics and performance data)
   - Upload Role Scores CSV (FMDataLab attribute scores)
   - App automatically detects roles and matches players

2. **Configure Roles**
   - Select a detected role
   - Choose which metrics to use
   - Set metric weights
   - Define a custom formula for final scoring

3. **Run Analysis**
   - View all players ranked by final score
   - Filter and sort results
   - Examine player profiles in detail

4. **Export Results**
   - Save analysis as CSV
   - Export configuration as JSON
   - Share setups with colleagues

## CSV Format Requirements

### Statistics CSV
Required columns:
- `Player Name` or `Player` (player identifier)
- `Club` or `Team` (club name)
- `Age` (player age)
- `Position` or `Pos` (playing position)
- `Minutes` or `MP` (minutes played)
- Additional columns treated as metrics

### Role Scores CSV
Required columns:
- `Player Name` or `Player` (must match statistics CSV)
- `Club` or `Team` (for player matching)
- `Age` (for validation)
- One or more columns ending with "Score" or containing "Role"

Example role score columns:
- Ball Winning Midfielder Score
- Deep Lying Playmaker Score  
- Inverted Winger Score
- Advanced Forward Score

## Architecture Details

### State Management (Zustand)
- Global data store for players, roles, configurations
- Separate stores for import progress, UI state, analyses
- Persistent selection tracking

### Services
- `importService.ts` - CSV import orchestration
- `analysisService.ts` - Player analysis and ranking calculation
- `csvParser.ts` - Dynamic CSV parsing and column detection
- `playerMatching.ts` - Fuzzy and exact player matching

### Utilities
- `metrics.ts` - Normalization and weighted scoring
- `formula.ts` - Safe formula validation and evaluation
- `csvParser.ts` - Column detection and data validation

### Components
- **Pages**: Import, RoleConfiguration, ScoutingTable, PlayerProfile, Dashboard
- **Layout**: Navigation, ErrorBoundary
- **Hooks**: usePlayerAnalysis, useFilteredAnalyses, usePagination

## Configuration Examples

### Basic Formula
```
(CustomMetricScore * 0.7) + (RoleScore * 0.3)
```
70% weighted custom metrics + 30% FMDataLab role score

### Advanced Formula
```
(CustomMetricScore * 0.6) + (RoleScore * 0.3) + (Age / 100 * 0.1)
```
Includes age factor for valuing younger players

### Metric-Only Formula
```
CustomMetricScore
```
Pure metric-based scoring without role scores

## Performance Considerations

- Virtualized table rendering for large datasets
- Lazy metric statistics calculation
- Memoized analysis results
- Optimized re-renders with React hooks
- Supports 50k+ player datasets

## Extensibility

The architecture supports future modules:
- 🔄 Similar Player Finder
- 🎯 Team Fit Analysis
- 🏗️ Squad Builder
- 💰 Transfer Value Prediction
- 📈 Player Development Tracking
- 🔍 Advanced Analytics

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **Zustand** - State management
- **TanStack Table** - Advanced table features
- **Recharts** - Data visualization
- **PapaParse** - CSV parsing
- **Lucide React** - Icons
- **React Router** - Navigation

## Project Structure

```
src/
├── components/
│   ├── pages/
│   │   ├── ImportPage.tsx
│   │   ├── RoleConfigurationPage.tsx
│   │   ├── ScoutingTablePage.tsx
│   │   ├── PlayerProfilePage.tsx
│   │   └── DashboardPage.tsx
│   ├── Navigation.tsx
│   └── ErrorBoundary.tsx
├── services/
│   ├── importService.ts
│   ├── analysisService.ts
│   └── csvParser.ts
├── utils/
│   ├── metrics.ts
│   ├── formula.ts
│   ├── playerMatching.ts
│   └── csvParser.ts
├── hooks/
│   └── useAnalysis.ts
├── stores/
│   └── dataStore.ts
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

## Development

TypeScript strict mode enabled for type safety.
Path aliases configured for clean imports:
- `@types/*` → `src/types/*`
- `@utils/*` → `src/utils/*`
- `@services/*` → `src/services/*`
- etc.

## Future Roadmap

- [ ] Supabase integration for data persistence
- [ ] Multi-user collaboration
- [ ] Advanced visualization (radar charts, heatmaps)
- [ ] ML-based player recommendations
- [ ] API for external integrations
- [ ] Mobile companion app

## License

Professional Scouting Application © 2026
