# Fantasy Premier League Prediction Tools

A comprehensive system for fetching Fantasy Premier League fixture data and creating advanced prediction games with Google Sheets integration.

## 🎯 Features

- **Live FPL Data**: Fetch fixtures from the official Fantasy Premier League API
- **Advanced Scoring**: 8/3 point system with bonuses and multipliers
- **Captain Mechanics**: 2x points for selected captain matches
- **Special Chips**: Triple Captain (3x) and All Captain (2x all matches)
- **Upset Bonuses**: Extra points for predicting underdog victories
- **Google Sheets Integration**: Automated scoring and league tables
- **Season Table Predictions**: Bonus points for accurate final table predictions

## 📁 Project Structure

```
fantsy_premier_league_tools/
├── src/                           # Source code
│   ├── core/                      # Core business logic
│   │   ├── fpl_api.py            # FPL API interactions
│   │   ├── advanced_scoring_system.py  # Advanced scoring logic
│   │   └── constants.py          # Team mappings and constants
│   ├── utils/                     # Utility functions
│   │   ├── data_utils.py         # Data processing
│   │   ├── save_utils.py         # File operations
│   │   └── results_utils.py      # Results analysis
│   └── google_sheets/             # Google Sheets integration
│       └── advanced_google_apps_script.js  # Advanced Apps Script
├── scripts/                       # Executable scripts
│   ├── fixtures.py               # Fetch fixture data
│   ├── results_tool.py           # Compare predictions vs results
│   └── create_advanced_setup.py  # Generate complete game system
├── data/                          # Data files
│   ├── fixtures/                  # Fixture data
│   │   ├── all_fixtures_2025.csv
│   │   └── advanced_master_data.csv
│   └── templates/                 # Player templates
│       ├── advanced_player_*.csv
│       └── advanced_scoring_rules.csv
├── tests/                         # Test suite
│   ├── test_*.py                 # Unit tests
│   └── test_data/                # Test data files
└── docs/                          # Documentation
    ├── advanced_setup_instructions.md
    └── TEST_SUITE.md
```

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <repository-url>
cd fantsy_premier_league_tools

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install requests
```

### 2. Fetch Latest FPL Data

```bash
# First, fetch the current season fixtures
python scripts/fixtures.py
# Choose option 3 for CSV format
```

### 3. Generate Complete System

```bash
# Generate all templates and data files
python scripts/create_advanced_setup.py
```

This creates:
- Master fixture data with prediction categories
- Individual player templates with captain selection
- Scoring rules documentation
- Setup instructions

### 4. Google Sheets Setup

1. Create a new Google Sheets document
2. Go to **Extensions → Apps Script**
3. Copy code from `src/google_sheets/advanced_google_apps_script.js`
4. Import CSV files from `data/` folders
5. Follow instructions in `docs/advanced_setup_instructions.md`

## 🎮 Game Features

### Scoring System
- **Exact Score**: 8 points + 2 point goal difference bonus = 10 total
- **Correct Result**: 3 points  
- **Correct Goal Difference**: 2 points (excluding draws)
- **Upset Bonuses**: 1-6 points based on favorite strength
- **Weekly Goals Bonus**: 5 points for correct total goals
- **Table Accuracy Bonus**: Up to 100 points at season end

### Captain & Chips
- **Captain**: 2x multiplier for selected match
- **Triple Captain**: 3x multiplier (once per season)
- **All Captain**: 2x multiplier for entire gameweek (once per season)

### Strategic Elements
- Predict underdog victories for upset bonuses
- Select captain for double points
- Use chips strategically for maximum impact
- Predict final league table for season bonus

## 🛠 Usage Examples

### Fetch Latest Fixtures
```bash
python scripts/fixtures.py
```

### Compare Predictions vs Results
```bash
python scripts/results_tool.py
```

### Generate New Player Template
```python
from src.core.advanced_scoring_system import export_advanced_player_template
from src.utils.data_utils import load_fixtures_data

fixtures = load_fixtures_data('data/fixtures/all_fixtures_2025.csv')
export_advanced_player_template('New Player', fixtures)
```

## 📊 Google Sheets Integration

The system provides full Google Sheets automation:
- Individual player sheets with privacy
- Automatic score calculations
- Captain selection tracking
- Chip usage monitoring
- Real-time league tables
- Season summary statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes following the existing structure
4. Test your changes thoroughly
5. Submit a pull request

## 📝 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues or questions:
1. Check the documentation in `docs/`
2. Review existing issues
3. Create a new issue with detailed description

---

**Built for FPL enthusiasts who want the most advanced prediction game possible! 🏆**
