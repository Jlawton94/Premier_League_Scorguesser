"""
Advanced Google Sheets Setup Tool
Creates the complete advanced prediction game system from your fixtures CSV
"""
import csv
import sys
import os
from typing import List, Dict, Any

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.core.advanced_scoring_system import (
    export_advanced_player_template,
    create_player_sheet_structure,
    create_gameweek_summary_structure,
    create_season_summary_structure,
    SCORING_CONFIG
)


def get_project_path(*path_parts):
    """Get absolute path relative to project root"""
    script_dir = os.path.dirname(__file__)
    project_root = os.path.join(script_dir, '..')
    return os.path.abspath(os.path.join(project_root, *path_parts))


def parse_fixtures_csv(csv_file: str) -> List[Dict[str, Any]]:
    """
    Parse the fixtures CSV file into structured data
    
    Args:
        csv_file: Path to the all_fixtures_2025.csv file
        
    Returns:
        List of fixture dictionaries
    """
    fixtures = []
    current_gameweek = None
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.reader(file)
            
            for row in reader:
                if not row:  # Skip empty rows
                    continue
                    
                # Check for gameweek header
                if row[0].startswith('GAMEWEEK'):
                    current_gameweek = int(row[0].split()[1])
                    continue
                
                # Skip header row
                if row[0] == 'Home Team':
                    continue
                
                # Parse fixture data
                if len(row) >= 6 and current_gameweek:
                    fixture = {
                        'gameweek': current_gameweek,
                        'home_team': row[0],
                        'home_score': row[1] if row[1] else None,
                        'away_score': row[2] if row[2] else None,
                        'away_team': row[3],
                        'kickoff': row[4],
                        'match_prediction': row[5]
                    }
                    fixtures.append(fixture)
    
    except FileNotFoundError:
        print(f"❌ Error: Could not find {csv_file}")
        return []
    except Exception as e:
        print(f"❌ Error parsing CSV: {e}")
        return []
    
    return fixtures


def create_master_data_csv(fixtures: List[Dict], output_file: str = None):
    """
    Create master data CSV for Google Sheets import
    """
    if output_file is None:
        output_file = get_project_path("data", "fixtures", "advanced_master_data.csv")
    headers = [
        'Gameweek', 'Home Team', 'Away Team', 'Date', 'Kickoff', 
        'Match Prediction', 'Actual Home', 'Actual Away', 'Finished'
    ]
    
    rows = [headers]
    
    for fixture in fixtures:
        # Extract date from kickoff timestamp
        kickoff_str = fixture['kickoff']
        try:
            date_part = kickoff_str.split()[0] if kickoff_str else ''
            time_part = kickoff_str.split()[1] if len(kickoff_str.split()) > 1 else ''
        except:
            date_part = kickoff_str
            time_part = ''
        
        row = [
            fixture['gameweek'],
            fixture['home_team'],
            fixture['away_team'], 
            date_part,
            time_part,
            fixture['match_prediction'],
            fixture['home_score'] or '',  # Actual scores (empty initially)
            fixture['away_score'] or '',
            'FALSE' if not fixture['home_score'] else 'TRUE'
        ]
        rows.append(row)
    
    # Write to CSV
    try:
        with open(output_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerows(rows)
        
        print(f"✅ Master data created: {output_file}")
        print(f"📋 {len(fixtures)} fixtures across {max(f['gameweek'] for f in fixtures)} gameweeks")
        
    except Exception as e:
        print(f"❌ Error creating master data: {e}")


def create_advanced_player_templates(fixtures: List[Dict], players: List[str]):
    """
    Create advanced player templates with captain selection and chip tracking
    """
    print(f"\n👥 Creating advanced templates for {len(players)} players...")
    
    # Group fixtures by gameweek for better structure
    gameweeks = {}
    for fixture in fixtures:
        gw = fixture['gameweek']
        if gw not in gameweeks:
            gameweeks[gw] = []
        gameweeks[gw].append(fixture)
    
    for player in players:
        filename = get_project_path("data", "templates", f"advanced_player_{player.lower().replace(' ', '_')}.csv")
        
        try:
            rows = []
            
            # Headers
            headers = [
                'Gameweek', 'Home Team', 'Away Team', 'Date', 'Kickoff',
                'Home Pred', 'Away Pred', 'Captain?', 'Match Points', 'Breakdown',
                'Actual Home', 'Actual Away'
            ]
            rows.append(headers)
            
            # Process each gameweek
            for gw in sorted(gameweeks.keys()):
                # Gameweek separator
                rows.append([f"--- GAMEWEEK {gw} ---"] + [''] * (len(headers) - 1))
                
                gw_start_row = len(rows)
                
                # Add fixtures for this gameweek
                for fixture in gameweeks[gw]:
                    date_part = fixture['kickoff'].split()[0] if fixture['kickoff'] else ''
                    time_part = fixture['kickoff'].split()[1] if len(fixture['kickoff'].split()) > 1 else ''
                    
                    row = [
                        gw,
                        fixture['home_team'],
                        fixture['away_team'],
                        date_part,
                        time_part,
                        '',  # Home Prediction
                        '',  # Away Prediction
                        'FALSE',  # Captain checkbox
                        '',  # Match Points (calculated)
                        '',  # Breakdown
                        '',  # Actual Home
                        ''   # Actual Away
                    ]
                    rows.append(row)
                
                # Gameweek summary
                gw_end_row = len(rows)
                summary_row = [''] * len(headers)
                summary_row[0] = f"GW{gw} TOTAL:"
                summary_row[8] = f"=SUM(I{gw_start_row + 2}:I{gw_end_row})"  # Sum match points
                rows.append(summary_row)
                
                # Chip selection
                chip_row = [''] * len(headers)
                chip_row[0] = "Chips:"
                chip_row[1] = "Triple Captain"
                chip_row[2] = "All Captain"
                chip_row[3] = "Weekly Goals Bonus"
                rows.append(chip_row)
                
                # Blank separator
                rows.append([''] * len(headers))
            
            # Season summary section
            rows.append(['--- SEASON SUMMARY ---'] + [''] * (len(headers) - 1))
            rows.append(['Total Points:', '=SUM(all gameweek totals)'] + [''] * (len(headers) - 2))
            rows.append(['Exact Scores:', '=COUNTIF(J:J,"*Exact*")'] + [''] * (len(headers) - 2))
            rows.append(['Correct Results:', '=COUNTIF(J:J,"*Result*")'] + [''] * (len(headers) - 2))
            rows.append(['Captain Points:', '=SUM(captain bonuses)'] + [''] * (len(headers) - 2))
            rows.append(['Upset Bonuses:', '=COUNTIF(J:J,"*Upset*")'] + [''] * (len(headers) - 2))
            rows.append(['Weekly Goals Bonuses:', '=COUNTIF(J:J,"*Weekly*")'] + [''] * (len(headers) - 2))
            rows.append(['Triple Captain Used:', 'FALSE'] + [''] * (len(headers) - 2))
            rows.append(['All Captain Used:', 'FALSE'] + [''] * (len(headers) - 2))
            rows.append(['Table Accuracy Bonus:', '(End of season)'] + [''] * (len(headers) - 2))
            rows.append(['FINAL SCORE:', '=Total + Table Bonus'] + [''] * (len(headers) - 2))
            
            # Write to CSV
            with open(filename, 'w', newline='', encoding='utf-8') as file:
                writer = csv.writer(file)
                writer.writerows(rows)
            
            print(f"  ✅ {player}: {filename}")
            
        except Exception as e:
            print(f"  ❌ Error creating template for {player}: {e}")


def create_scoring_rules_csv(output_file: str = None):
    """
    Create CSV with scoring rules for import to Google Sheets
    """
    if output_file is None:
        output_file = get_project_path("data", "templates", "advanced_scoring_rules.csv")
    rules = [
        ["ADVANCED FPL PREDICTION GAME - SCORING RULES"],
        [""],
        ["CORE SCORING"],
        [f"Exact scoreline: {SCORING_CONFIG['EXACT_SCORE']} points"],
        [f"Correct result (W/L/D): {SCORING_CONFIG['CORRECT_RESULT']} points"],
        [""],
        ["BONUS POINTS"],
        [f"Correct goal difference (non-draws): +{SCORING_CONFIG['CORRECT_GOAL_DIFF']} points"],
        [f"Predict slight favorite to lose: +{SCORING_CONFIG['UPSET_SLIGHT']} points"],
        [f"Predict favorite to lose: +{SCORING_CONFIG['UPSET_FAVORITE']} points"],
        [f"Predict strong favorite to lose: +{SCORING_CONFIG['UPSET_STRONG']} points"],
        [f"Correct total goals in gameweek: +{SCORING_CONFIG['WEEKLY_GOALS']} points"],
        [""],
        ["CAPTAIN & CHIPS"],
        [f"Captain (one per gameweek): x{SCORING_CONFIG['CAPTAIN_MULTIPLIER']} multiplier"],
        [f"Triple Captain (once per season): x{SCORING_CONFIG['TRIPLE_CAPTAIN_MULTIPLIER']} multiplier"],
        [f"All Captain (once per season): All matches x{SCORING_CONFIG['ALL_CAPTAIN_MULTIPLIER']}"],
        [""],
        ["STRATEGIC RULES"],
        ["- Select ONE captain per gameweek (doubles points for that match)"],
        ["- Triple Captain: Use once per season for 3x points"],
        ["- All Captain: Use once per season to make ALL matches captain"],
        ["- Cannot use both chips in same gameweek"],
        ["- Predictions must be submitted before first match kicks off"],
        ["- Captain selection can be changed until first game starts"],
        [""],
        ["UPSET BONUSES"],
        ["Predict underdog to WIN when there's a clear favorite"],
        ["Example: Brighton beats 'Arsenal Favorites' = upset bonus"],
        ["Bonus depends on favorite strength (Slight/Regular/Strong)"],
        [""],
        ["SEASON BONUS"],
        ["Table accuracy: Up to 100 bonus points"],
        ["Based on final league position predictions"],
        ["Generated automatically from your scoreline predictions"],
        ["Rewards getting teams in right positions"]
    ]
    
    try:
        with open(output_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerows(rules)
        
        print(f"✅ Scoring rules created: {output_file}")
        
    except Exception as e:
        print(f"❌ Error creating scoring rules: {e}")


def create_setup_instructions(players: List[str], output_file: str = None):
    """
    Create comprehensive setup instructions
    """
    if output_file is None:
        output_file = get_project_path("docs", "advanced_setup_instructions.md")
    content = f"""# Advanced FPL Prediction Game Setup

## 🎯 Complete Setup for {len(players)} Players

### Files Generated:
- `advanced_master_data.csv` - Import to 'Game Weeks' sheet
- `advanced_scoring_rules.csv` - Import to 'Scoring Rules' sheet  
- `advanced_google_apps_script.js` - Copy to Apps Script editor
- `advanced_player_[name].csv` - Individual player templates

### Google Sheets Setup:

#### 1. Create New Spreadsheet
1. Create new Google Sheets document
2. Name it "FPL Prediction Game 2025"

#### 2. Import Master Data
1. Create sheet named "Game Weeks"
2. Import `advanced_master_data.csv`
3. This contains all fixtures with prediction categories

#### 3. Import Scoring Rules  
1. Create sheet named "Scoring Rules"
2. Import `advanced_scoring_rules.csv`
3. This explains the point system to players

#### 4. Set Up Apps Script
1. Go to `Extensions` → `Apps Script`
2. Replace default code with contents of `advanced_google_apps_script.js`
3. Save and authorize permissions

#### 5. Initialize Game
Run in Apps Script:
```javascript
initializeAdvancedGame();
```

#### 6. Add Players
Run for each player:
```javascript
{chr(10).join(f'addAdvancedPlayer("{player}");' for player in players)}
```

### Player Features:

#### 🎯 **Predictions**
- Enter scoreline predictions (e.g., 2-1)
- Select ONE captain per gameweek (2x points)
- Use chips strategically (once per season)

#### 📊 **Scoring System**
- **10 points**: Exact scoreline
- **3 points**: Correct result
- **Bonuses**: Goal difference, upsets, weekly goals
- **Captain**: Doubles your match points
- **Chips**: Triple Captain (3x) or All Captain (all matches 2x)

#### 🏆 **Advanced Features**
- Upset bonuses for predicting favorites to lose
- Weekly goals bonus for total gameweek accuracy
- Season-end table accuracy bonus
- Automatic league table generation from predictions

### Sharing Strategy:

#### Individual Access:
{chr(10).join(f'- **{player}**: Edit access to "Player_{player}" sheet only' for player in players)}

#### View-Only Access:
- Game Weeks (master fixtures)
- Scoring Rules
- Leaderboard
- Table Predictions

### Weekly Workflow:

#### Before Gameweek:
1. Players enter scoreline predictions
2. Select captain for one match
3. Optionally use chip (once per season)
4. Submit before first game kicks off

#### After Gameweek:
1. Update actual scores in master sheet
2. Run scoring calculations
3. Check leaderboard updates
4. Review table predictions

### Chip Strategy Guide:

#### Triple Captain:
- Use on a match you're very confident about
- Best when captain choice has high scoring potential
- 3x multiplier instead of 2x

#### All Captain:
- Makes every match in gameweek a captain
- Ideal for weeks with many confident predictions
- 2x multiplier on all 10 matches

### End of Season:

#### Table Accuracy Bonus:
- Generated from player scoreline predictions
- Up to 100 bonus points
- Rewards accurate league position predictions
- Calculated automatically

### Support Commands:

#### Manual Updates:
```javascript
// Update all scores after gameweek
updateAllAdvancedScores();

// Recalculate leaderboard
updateAdvancedLeaderboard();

// Generate table predictions
generateAllTablePredictions();
```

### Game Rules Summary:

1. **Deadline**: Submit before first match of gameweek
2. **Captain**: One per week, can change until first game
3. **Chips**: Each used once per season maximum
4. **Scoring**: Immediate after actual results entered
5. **Table**: Generated automatically from predictions

## Ready to Start!

Import the CSV files, set up the Apps Script, add your players, and you're ready for the most advanced FPL prediction game ever! 🚀

Players: {', '.join(players)}
"""
    
    try:
        with open(output_file, 'w', encoding='utf-8') as file:
            file.write(content)
        
        print(f"✅ Setup instructions created: {output_file}")
        
    except Exception as e:
        print(f"❌ Error creating instructions: {e}")


def get_players_list() -> List[str]:
    """Get list of players for the game"""
    players = []
    
    print("\n👥 Enter player names (press Enter with empty name to finish):")
    
    while True:
        try:
            name = input(f"Player {len(players) + 1} name: ").strip()
            
            if not name:
                if len(players) == 0:
                    print("Please enter at least one player")
                    continue
                break
            
            if name in players:
                print(f"'{name}' already added")
                continue
                
            players.append(name)
            
        except KeyboardInterrupt:
            print("\nSetup cancelled")
            exit(0)
    
    return players


def main():
    """Main setup function"""
    print("🎯 ADVANCED FPL PREDICTION GAME SETUP")
    print("=" * 60)
    print("Create the complete advanced scoring system with:")
    print("- 10/3 point scoring + bonuses")
    print("- Captain mechanics (2x points)")
    print("- Triple Captain & All Captain chips")
    print("- Upset bonuses for favorite predictions")
    print("- Weekly goals bonus")
    print("- Season table accuracy bonus")
    print()
    
    # Parse existing fixtures
    csv_file = get_project_path("data", "fixtures", "all_fixtures_2025.csv")
    print(f"📋 Reading fixtures from {csv_file}...")
    fixtures = parse_fixtures_csv(csv_file)
    
    if not fixtures:
        print("❌ No fixtures found. Make sure data/fixtures/all_fixtures_2025.csv exists.")
        return
    
    print(f"✅ Loaded {len(fixtures)} fixtures across {max(f['gameweek'] for f in fixtures)} gameweeks")
    
    # Get players
    players = get_players_list()
    
    print(f"\n📋 Setup Summary:")
    print(f"Fixtures: {len(fixtures)} matches")
    print(f"Players: {', '.join(players)}")
    print()
    
    confirm = input("Generate complete advanced system? (y/n): ").lower().strip()
    if confirm != 'y':
        print("Setup cancelled")
        return
    
    print("\n🏗️ Generating advanced prediction game files...")
    
    try:
        # 1. Create master data
        print("\n1️⃣ Creating master data...")
        create_master_data_csv(fixtures)
        
        # 2. Create scoring rules
        print("\n2️⃣ Creating scoring rules...")
        create_scoring_rules_csv()
        
        # 3. Create player templates
        print("\n3️⃣ Creating player templates...")
        create_advanced_player_templates(fixtures, players)
        
        # 4. Create setup instructions
        print("\n4️⃣ Creating setup instructions...")
        create_setup_instructions(players)
        
        # Success summary
        print("\n✅ ADVANCED SYSTEM COMPLETE!")
        print("=" * 60)
        print("📁 Files created:")
        print("- advanced_master_data.csv")
        print("- advanced_scoring_rules.csv") 
        print("- advanced_google_apps_script.js")
        print(f"- {len(players)} player template CSV files")
        print("- advanced_setup_instructions.md")
        print()
        print("📝 Next steps:")
        print("1. Create new Google Sheets document")
        print("2. Import CSV files to appropriate sheets")
        print("3. Set up Apps Script with provided code")
        print("4. Follow advanced_setup_instructions.md")
        print("5. Add players and start predicting!")
        print()
        print("🚀 You now have the most advanced FPL prediction game ever!")
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")


if __name__ == "__main__":
    main()
