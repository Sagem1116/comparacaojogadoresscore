# FM Scouting Engine - Quick Start Guide

## 5-Minute Setup

### 1. Start the Application
```bash
cd scores
npm install  # One time only
npm run dev
```
Open http://localhost:5173

### 2. Prepare Your Data

The system requires TWO CSV files from FMDataLab exports:

**File 1: Statistics CSV**
- Contains all player metrics and statistics
- Must have columns: Player, Club, Age, Position, Minutes
- Additional columns become available metrics
- Example columns: Tackles Won %, Interceptions/90, Passes/90, etc.

**File 2: Role Scores CSV**
- Contains FMDataLab attribute-based role scores
- Must have columns: Player, Club, Age
- Role score columns (auto-detected): Any column ending in "Score"
- Example: "Ball Winning Midfielder Score", "Advanced Forward Score"

We've included sample files:
- `sample_statistics.csv`
- `sample_role_scores.csv`

### 3. Import Data
1. Click "Import Data" on dashboard
2. Upload Statistics CSV
3. Upload Role Scores CSV
4. Click "Import Files"
5. System automatically:
   - Parses both CSV files
   - Matches players between datasets
   - Detects available roles
   - Displays import statistics

### 4. Configure a Role
1. Select a detected role from the import
2. Choose 5-10 key metrics
3. Adjust metric weights (higher = more important)
4. Set a final scoring formula
5. Save configuration

Example configuration for "Ball Winning Midfielder":
```
Metrics:
- Tackles Won % (weight: 30)
- Interceptions/90 (weight: 25)
- Pressures/90 (weight: 25)
- Progressive Passes/90 (weight: 20)

Formula:
(CustomMetricScore * 0.7) + (RoleScore * 0.3)
```

### 5. View Analysis Results
1. Go to "Analysis" page
2. All players ranked by final score
3. View top players, young talents, best value
4. Click any player for detailed profile

### 6. Export Results
- Download analysis as CSV
- Save configuration as JSON for later reuse

---

## Understanding the Scoring System

### Custom Metric Score
Weighted average of normalized metrics you select:
```
Score = Σ(normalized_metric * weight) / total_weights
```

Each metric is normalized to 0-100 scale based on all players' data.

### FMDataLab Role Score
Direct value from your role scores CSV (0-100).

### Final Score
Calculated using your custom formula:
```
Default: (CustomMetricScore * 0.7) + (RoleScore * 0.3)
```

You can customize this completely!

---

## Formula Builder Examples

### Simple Blend
```
(CustomMetricScore * 0.6) + (RoleScore * 0.4)
60% custom metrics + 40% FMDataLab role score
```

### Metrics Only
```
CustomMetricScore
Use only your weighted metrics, ignore FMDataLab scores
```

### With Age Factor
```
(CustomMetricScore * 0.6) + (RoleScore * 0.3) + (Age / 100 * 0.1)
Favors younger players
```

### Advanced Weighting
```
((CustomMetricScore * CustomMetricScore) + (RoleScore * 2)) / 3
```

### Available Variables
- `CustomMetricScore` - Your weighted metric average
- `RoleScore` - FMDataLab role score
- `Age` - Player age
- `MinutesPlayed` - Total minutes played
- `MarketValue` - Player market value (if available)

---

## Metric Normalization Types

### Min-Max (Default)
```
normalized = (value - min) / (max - min)
Scales all values between 0-1 based on min/max in dataset
```

### Z-Score
```
z = (value - mean) / standard_deviation
Maps to sigmoid curve, centers around player population mean
```

### Percentile
```
normalized = percentile_rank / 100
Direct percentile ranking within dataset
```

### Inverse Metrics
Check "Inverse" for metrics where LOWER is better:
- Fouls committed (lower = better)
- Yellow cards (lower = better)
- Errors (lower = better)

---

## Advanced Workflows

### Create Role Presets
1. Configure multiple roles
2. Use "Export Configuration" to save
3. Share JSON file with colleagues
4. Others can "Import Configuration" to reuse

### Compare Different Approaches
```
Role Config 1: Heavy metrics focus
Formula: CustomMetricScore * 1.0

Role Config 2: Balanced approach  
Formula: (CustomMetricScore * 0.7) + (RoleScore * 0.3)

Role Config 3: FMDataLab focused
Formula: RoleScore * 1.0
```

### Talent Identification
Focus on young, high-scoring players:
```
Metrics: Ball Winning Midfielder setup
Filter: Age < 24, Score > 65
Sort by: Final Score descending
Focus on: Top 20 results
```

### Transfer Value Analysis
```
Metrics: Position-specific setup
Formula: (Score * 1.2) + (Age / 100)
Filter: Minutes > 1000 (proven)
Sort by: Value score descending
```

---

## Tips & Tricks

✅ **DO**
- Start with 5-8 key metrics, expand gradually
- Test different formulas with same data
- Export configurations for future use
- Match CSV column names carefully
- Validate import statistics

❌ **DON'T**
- Use conflicting metrics (e.g., both % and raw)
- Create formulas with 20+ metrics (performance)
- Ignore warning about low match rates
- Hardcode role names in formulas
- Use metrics with mostly missing data

---

## Troubleshooting

### "No players matched"
- Check CSV column names (Player, Club, Age)
- Verify both files use same spelling for clubs/players
- Try with sample CSV files first

### "No roles detected"
- Check role scores CSV column names
- Must contain "Score" in column name
- Examples: "Ball Winning Midfielder Score"

### Import takes too long
- Large files (50k+ rows) may take 30-60 seconds
- Try with first 1000 rows while testing
- Check browser console for errors

### Formula calculation error
- Verify all variables exist in formula
- Check parentheses are balanced
- Test with simpler formula first
- Review available variable names

---

## Sample Workflows

### Quick Test (5 minutes)
```
1. Use provided sample_statistics.csv
2. Use provided sample_role_scores.csv
3. Import
4. Configure "Ball Winning Midfielder" with:
   - Tackles Won % (weight: 40)
   - Interceptions/90 (weight: 35)
   - Pressures/90 (weight: 25)
5. Use formula: (CustomMetricScore * 0.75) + (RoleScore * 0.25)
6. View results
```

### Production Analysis (30 minutes)
```
1. Export full FMDataLab stats
2. Export FMDataLab role scores
3. Import both files
4. Configure 3-5 key roles for your club
5. Export configurations as JSON
6. Share with recruitment team
7. Run analysis monthly with fresh data
```

### Comparison Study (1 hour)
```
1. Import data
2. Configure same role with 3 different formulas
3. Export each analysis
4. Compare top 10 players in each
5. Identify formula that matches your evaluation
6. Use winning formula for all future analyses
```

---

## Performance Notes

**Processing Times (Approximate)**
- Small dataset (5k players): < 2 seconds
- Medium dataset (25k players): 5-10 seconds
- Large dataset (50k+ players): 15-30 seconds

**Recommendations**
- Use for datasets up to 100k rows
- Filter to relevant leagues/positions for speed
- Use fewer metrics to reduce calculation time
- Formulas with multiplication are slower

---

## Next Steps

1. **Import sample data** - Get familiar with the flow
2. **Test different formulas** - Understand scoring
3. **Export a configuration** - Learn the JSON format
4. **Create role presets** - Build your analysis library
5. **Integrate with workflow** - Use for recruitment decisions

---

## Support & Feedback

For questions or issues:
- Check the ARCHITECTURE.md for technical details
- Review example configurations in exported JSONs
- Verify CSV format matches requirements
- Check browser console for error messages

**Common Questions**

Q: Can I use my own formula?
A: Yes! Any valid mathematical expression using available variables.

Q: How do I include multiple datasets?
A: Run separate imports, each creates independent analysis.

Q: Can I combine role scores across positions?
A: Roles are matched by CSV column name exactly - use consistent naming.

Q: How do I track changes over time?
A: Export configurations and results as CSV for comparison.

---

Happy scouting! 🎯⚽
