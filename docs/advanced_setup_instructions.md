# Advanced FPL Prediction Game Setup

## 🎯 Complete Setup for 1 Players

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
addAdvancedPlayer("Jacob");
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
- **Jacob**: Edit access to "Player_Jacob" sheet only

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

Players: Jacob
