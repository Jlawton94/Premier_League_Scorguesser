"""
Advanced FPL Prediction Game - Google Sheets Integration
Creates the complete scoring system with captain mechanics, chips, and table predictions
"""
import csv
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import json


# Scoring configuration
SCORING_CONFIG = {
    'EXACT_SCORE': 8,
    'CORRECT_RESULT': 3,
    'CORRECT_GOAL_DIFF': 2,
    'UPSET_SLIGHT': 1,      # Slight favorite loses
    'UPSET_FAVORITE': 3,    # Favorite loses
    'UPSET_STRONG': 6,      # Strong favorite loses
    'WEEKLY_GOALS': 5,      # Correct total goals in gameweek
    
    'CAPTAIN_MULTIPLIER': 2,
    'TRIPLE_CAPTAIN_MULTIPLIER': 3,
    'ALL_CAPTAIN_MULTIPLIER': 2,  # Applied to all matches in gameweek
}

# Upset bonus mapping based on prediction categories
UPSET_MAPPING = {
    'Strong Favorites': SCORING_CONFIG['UPSET_STRONG'],
    'Favorites': SCORING_CONFIG['UPSET_FAVORITE'], 
    'Slight Favorites': SCORING_CONFIG['UPSET_SLIGHT']
}


def parse_prediction_category(match_prediction: str) -> Tuple[str, str]:
    """
    Parse match prediction to extract favorite team and strength
    
    Args:
        match_prediction: e.g., "Liverpool Favorites", "Arsenal Slight Favorites"
        
    Returns:
        Tuple of (favorite_team, strength_category)
    """
    if 'Strong Favorites' in match_prediction:
        favorite = match_prediction.replace(' Strong Favorites', '')
        return favorite, 'Strong Favorites'
    elif 'Favorites' in match_prediction and 'Slight' not in match_prediction:
        favorite = match_prediction.replace(' Favorites', '')
        return favorite, 'Favorites'
    elif 'Slight Favorites' in match_prediction:
        favorite = match_prediction.replace(' Slight Favorites', '')
        return favorite, 'Slight Favorites'
    else:
        return '', 'Even Match'


def calculate_match_points(
    predicted_home: int,
    predicted_away: int,
    actual_home: int, 
    actual_away: int,
    home_team: str,
    away_team: str,
    match_prediction: str,
    is_captain: bool = False,
    captain_multiplier: int = 2
) -> Dict[str, Any]:
    """
    Calculate points for a single match prediction
    
    Returns:
        Dictionary with point breakdown and total
    """
    points_breakdown = {
        'base_points': 0,
        'upset_bonus': 0,
        'goal_diff_bonus': 0,
        'multiplier': 1,
        'total_points': 0,
        'breakdown_text': []
    }
    
    # Core scoring: exact score or correct result
    if predicted_home == actual_home and predicted_away == actual_away:
        points_breakdown['base_points'] = SCORING_CONFIG['EXACT_SCORE']
        points_breakdown['breakdown_text'].append(f"Exact score: {SCORING_CONFIG['EXACT_SCORE']} pts")
    else:
        # Check for correct result
        pred_result = get_match_result(predicted_home, predicted_away)
        actual_result = get_match_result(actual_home, actual_away)
        
        if pred_result == actual_result:
            points_breakdown['base_points'] = SCORING_CONFIG['CORRECT_RESULT']
            points_breakdown['breakdown_text'].append(f"Correct result: {SCORING_CONFIG['CORRECT_RESULT']} pts")
    
    # Goal difference bonus (excluding draws)
    actual_gd = actual_home - actual_away
    predicted_gd = predicted_home - predicted_away
    
    if actual_gd != 0 and predicted_gd == actual_gd:
        points_breakdown['goal_diff_bonus'] = SCORING_CONFIG['CORRECT_GOAL_DIFF']
        points_breakdown['breakdown_text'].append(f"Correct goal difference: {SCORING_CONFIG['CORRECT_GOAL_DIFF']} pts")
    
    # Upset bonus
    favorite_team, strength = parse_prediction_category(match_prediction)
    if favorite_team and strength in UPSET_MAPPING:
        # Check if underdog won
        actual_result = get_match_result(actual_home, actual_away)
        predicted_result = get_match_result(predicted_home, predicted_away)
        
        # Determine if prediction was for underdog to win
        if favorite_team == home_team and predicted_result == 'A' and actual_result == 'A':
            # Predicted away team (underdog) to win, and they did
            points_breakdown['upset_bonus'] = UPSET_MAPPING[strength]
            points_breakdown['breakdown_text'].append(f"Upset bonus ({strength}): {UPSET_MAPPING[strength]} pts")
        elif favorite_team == away_team and predicted_result == 'H' and actual_result == 'H':
            # Predicted home team (underdog) to win, and they did
            points_breakdown['upset_bonus'] = UPSET_MAPPING[strength]
            points_breakdown['breakdown_text'].append(f"Upset bonus ({strength}): {UPSET_MAPPING[strength]} pts")
    
    # Apply captain multiplier
    base_total = points_breakdown['base_points'] + points_breakdown['upset_bonus'] + points_breakdown['goal_diff_bonus']
    
    if is_captain:
        points_breakdown['multiplier'] = captain_multiplier
        points_breakdown['breakdown_text'].append(f"Captain (x{captain_multiplier})")
    
    points_breakdown['total_points'] = base_total * points_breakdown['multiplier']
    
    return points_breakdown


def get_match_result(home_score: int, away_score: int) -> str:
    """Get match result: H (home win), A (away win), D (draw)"""
    if home_score > away_score:
        return 'H'
    elif away_score > home_score:
        return 'A'
    else:
        return 'D'


def calculate_weekly_goals_bonus(
    predicted_matches: List[Dict],
    actual_matches: List[Dict]
) -> int:
    """
    Calculate bonus for predicting correct total goals in gameweek
    
    Args:
        predicted_matches: List of match predictions
        actual_matches: List of actual results
        
    Returns:
        Bonus points (0 or WEEKLY_GOALS)
    """
    predicted_total = sum(
        match.get('predicted_home', 0) + match.get('predicted_away', 0)
        for match in predicted_matches
        if match.get('predicted_home') is not None and match.get('predicted_away') is not None
    )
    
    actual_total = sum(
        match.get('actual_home', 0) + match.get('actual_away', 0)
        for match in actual_matches
        if match.get('actual_home') is not None and match.get('actual_away') is not None
    )
    
    return SCORING_CONFIG['WEEKLY_GOALS'] if predicted_total == actual_total else 0


def generate_league_table_from_predictions(predictions: List[Dict]) -> List[Dict]:
    """
    Generate predicted league table from score predictions
    
    Args:
        predictions: List of all match predictions for the season
        
    Returns:
        List of teams with predicted points, goals, etc.
    """
    teams = {}
    
    # Initialize all teams
    for match in predictions:
        home_team = match.get('home_team')
        away_team = match.get('away_team')
        
        for team in [home_team, away_team]:
            if team and team not in teams:
                teams[team] = {
                    'team': team,
                    'played': 0,
                    'won': 0,
                    'drawn': 0,
                    'lost': 0,
                    'goals_for': 0,
                    'goals_against': 0,
                    'goal_difference': 0,
                    'points': 0
                }
    
    # Process each match
    for match in predictions:
        home_team = match.get('home_team')
        away_team = match.get('away_team')
        home_score = match.get('predicted_home')
        away_score = match.get('predicted_away')
        
        if not all([home_team, away_team, home_score is not None, away_score is not None]):
            continue
            
        # Update team stats
        teams[home_team]['played'] += 1
        teams[away_team]['played'] += 1
        
        teams[home_team]['goals_for'] += home_score
        teams[home_team]['goals_against'] += away_score
        teams[away_team]['goals_for'] += away_score
        teams[away_team]['goals_against'] += home_score
        
        # Determine result
        if home_score > away_score:
            teams[home_team]['won'] += 1
            teams[home_team]['points'] += 3
            teams[away_team]['lost'] += 1
        elif away_score > home_score:
            teams[away_team]['won'] += 1
            teams[away_team]['points'] += 3
            teams[home_team]['lost'] += 1
        else:
            teams[home_team]['drawn'] += 1
            teams[away_team]['drawn'] += 1
            teams[home_team]['points'] += 1
            teams[away_team]['points'] += 1
    
    # Calculate goal difference
    for team in teams.values():
        team['goal_difference'] = team['goals_for'] - team['goals_against']
    
    # Sort by points, then goal difference, then goals for
    sorted_teams = sorted(
        teams.values(),
        key=lambda x: (x['points'], x['goal_difference'], x['goals_for']),
        reverse=True
    )
    
    # Add position
    for i, team in enumerate(sorted_teams):
        team['position'] = i + 1
    
    return sorted_teams


def calculate_table_accuracy_bonus(
    predicted_table: List[Dict],
    actual_table: List[Dict],
    max_bonus: int = 100
) -> Dict[str, Any]:
    """
    Calculate bonus points for table prediction accuracy
    
    Args:
        predicted_table: Predicted final table
        actual_table: Actual final table  
        max_bonus: Maximum possible bonus points
        
    Returns:
        Dictionary with accuracy breakdown and bonus points
    """
    # Create position mappings
    predicted_positions = {team['team']: team['position'] for team in predicted_table}
    actual_positions = {team['team']: team['position'] for team in actual_table}
    
    total_variance = 0
    exact_positions = 0
    breakdown = []
    
    for team in actual_positions:
        if team in predicted_positions:
            predicted_pos = predicted_positions[team]
            actual_pos = actual_positions[team]
            variance = abs(predicted_pos - actual_pos)
            total_variance += variance
            
            if variance == 0:
                exact_positions += 1
                breakdown.append(f"{team}: Perfect position {actual_pos}")
            else:
                breakdown.append(f"{team}: Off by {variance} (predicted {predicted_pos}, actual {actual_pos})")
    
    # Calculate bonus (lower variance = higher bonus)
    max_possible_variance = sum(range(20))  # Maximum possible total variance
    accuracy_percentage = max(0, 1 - (total_variance / max_possible_variance))
    bonus_points = int(accuracy_percentage * max_bonus)
    
    return {
        'bonus_points': bonus_points,
        'exact_positions': exact_positions,
        'total_variance': total_variance,
        'accuracy_percentage': accuracy_percentage * 100,
        'breakdown': breakdown
    }


def create_player_sheet_structure() -> List[str]:
    """
    Define the column structure for player prediction sheets
    
    Returns:
        List of column headers
    """
    return [
        'Gameweek',
        'Home Team', 
        'Away Team',
        'Date',
        'Kickoff',
        'Home Prediction',
        'Away Prediction', 
        'Captain?',           # Checkbox column
        'Match Points',
        'Points Breakdown',
        'Actual Home',
        'Actual Away'
    ]


def create_gameweek_summary_structure() -> List[str]:
    """
    Define structure for gameweek summary section
    """
    return [
        'Gameweek',
        'Base Points',
        'Bonus Points', 
        'Captain Bonus',
        'Weekly Goals Bonus',
        'Chip Used',
        'Total Points',
        'Running Total'
    ]


def create_season_summary_structure() -> List[str]:
    """
    Define structure for season summary
    """
    return [
        'Player Name',
        'Total Points',
        'Gameweeks Played',
        'Average Per Week',
        'Exact Scores',
        'Correct Results',
        'Captain Points',
        'Chips Used',
        'Table Accuracy Bonus',
        'Final Position'
    ]


def export_advanced_player_template(
    player_name: str,
    fixtures_data: List[Dict],
    output_file: Optional[str] = None
) -> None:
    """
    Create advanced player template with captain selection and chip tracking
    
    Args:
        player_name: Name of the player
        fixtures_data: Complete fixtures data
        output_file: Output filename
    """
    if output_file is None:
        output_file = f"advanced_player_{player_name.lower().replace(' ', '_')}_template.csv"
    
    # Group fixtures by gameweek
    gameweeks = {}
    for fixture in fixtures_data:
        gw = fixture.get('gameweek', 1)
        if gw not in gameweeks:
            gameweeks[gw] = []
        gameweeks[gw].append(fixture)
    
    rows = []
    
    # Add player sheet headers
    headers = create_player_sheet_structure()
    rows.append(headers)
    
    # Add fixtures grouped by gameweek
    for gw in sorted(gameweeks.keys()):
        # Add gameweek separator
        rows.append([f"=== GAMEWEEK {gw} ==="] + [''] * (len(headers) - 1))
        
        # Add fixtures for this gameweek
        for fixture in gameweeks[gw]:
            row = [
                gw,
                fixture.get('home_team', ''),
                fixture.get('away_team', ''),
                fixture.get('date', ''),
                fixture.get('kickoff', ''),
                '',  # Home Prediction
                '',  # Away Prediction
                'FALSE',  # Captain checkbox
                '',  # Match Points (calculated)
                '',  # Points Breakdown
                '',  # Actual Home (filled when results available)
                ''   # Actual Away
            ]
            rows.append(row)
        
        # Add gameweek summary row
        summary_row = [''] * len(headers)
        summary_row[0] = f"GW{gw} Total:"
        summary_row[8] = f'=SUM(I{len(rows)-len(gameweeks[gw])+1}:I{len(rows)})'  # Sum match points
        rows.append(summary_row)
        
        # Add chip selection for this gameweek
        chip_row = [''] * len(headers)
        chip_row[0] = "Chip Used:"
        chip_row[1] = "[ ] Triple Captain"
        chip_row[2] = "[ ] All Captain"
        rows.append(chip_row)
        
        # Add blank row between gameweeks
        rows.append([''] * len(headers))
    
    # Add season summary section
    rows.append(['=== SEASON SUMMARY ==='] + [''] * (len(headers) - 1))
    rows.append(['Total Points:', '=SUM(all gameweek totals)'] + [''] * (len(headers) - 2))
    rows.append(['Table Accuracy Bonus:', '(calculated at season end)'] + [''] * (len(headers) - 2))
    rows.append(['Final Score:', '=Total + Table Bonus'] + [''] * (len(headers) - 2))
    
    # Write to CSV
    try:
        with open(output_file, 'w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerows(rows)
        
        print(f"✅ Advanced player template created: {output_file}")
        print(f"👤 Player: {player_name}")
        print(f"📋 Features: Captain selection, chip tracking, automatic scoring")
        
    except Exception as e:
        print(f"❌ Error creating template: {e}")


if __name__ == "__main__":
    print("🎯 Advanced FPL Prediction Game System")
    print("=" * 50)
    print("Features:")
    print("- 10/3 point scoring with bonuses")
    print("- Captain mechanics (2x points)")
    print("- Triple Captain & All Captain chips")
    print("- Upset bonuses based on favorites")
    print("- Weekly goals total bonus")
    print("- Season-end table accuracy bonus")
    print("- Automatic league table generation")
    print()
    print("Run create_advanced_sheets_setup.py to generate complete system")
