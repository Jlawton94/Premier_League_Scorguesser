"""
Data processing utilities for Fantasy Premier League fixtures
"""
from typing import Dict, List, Any, Optional
from ..core.fpl_api import fetch_fixture_ids, fetch_teams
from ..core.constants import TOTAL_GAMEWEEKS, FIRST_GAMEWEEK, PREDICTION_THRESHOLDS, REQUIRED_FIXTURE_FIELDS


def validate_fixture_data(fixture: Dict[str, Any]) -> bool:
    """
    Validate that a fixture contains all required fields
    
    Args:
        fixture: Fixture dictionary to validate
        
    Returns:
        bool: True if fixture is valid, False otherwise
    """
    return all(field in fixture and fixture[field] is not None for field in REQUIRED_FIXTURE_FIELDS)


def _get_team_name(team_id: Optional[int], teams_map: Dict[int, Dict[str, Any]]) -> str:
    """Helper function to get team name from teams map"""
    if team_id is None:
        return "Unknown Team"
    return teams_map.get(team_id, {}).get('name', f'Team {team_id}')


def _calculate_difficulty_difference(team_h_difficulty: int, team_a_difficulty: int) -> int:
    """Helper function to calculate difficulty difference"""
    return team_a_difficulty - team_h_difficulty


def _get_match_prediction(difficulty_difference: int, team_h_name: str, team_a_name: str) -> str:
    """
    Convert difficulty difference to human-readable prediction with team names
    
    Args:
        difficulty_difference (int): Raw difficulty difference (away_difficulty - home_difficulty)
        team_h_name (str): Home team name
        team_a_name (str): Away team name
        
    Returns:
        str: Human-readable match prediction with team names
        
    Note: Lower difficulty = easier fixture = stronger team
    Positive difference = home team stronger, Negative difference = away team stronger
    """
    thresholds = PREDICTION_THRESHOLDS
    
    if difficulty_difference <= -thresholds["strong_favorite"]:
        return f"{team_a_name} Strong Favorites"
    elif difficulty_difference == -thresholds["favorite"]:
        return f"{team_a_name} Favorites"
    elif difficulty_difference == -thresholds["slight_favorite"]:
        return f"{team_a_name} Slight Favorites"
    elif difficulty_difference == thresholds["even"]:
        return "Even Match"
    elif difficulty_difference == thresholds["slight_favorite"]:
        return f"{team_h_name} Slight Favorites"
    elif difficulty_difference == thresholds["favorite"]:
        return f"{team_h_name} Favorites"
    else:  # >= strong_favorite threshold
        return f"{team_h_name} Strong Favorites"


def create_fixture_info(fixture: Dict[str, Any], teams_map: Dict[int, Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Create a single fixture info dictionary with all necessary data
    
    Args:
        fixture: Single fixture dictionary from API
        teams_map: Dictionary mapping team IDs to team data
        
    Returns:
        Optional[Dict[str, Any]]: Processed fixture information, or None if invalid
    """
    # Validate fixture data
    if not validate_fixture_data(fixture):
        print(f"⚠️  Skipping invalid fixture: {fixture.get('id', 'unknown')}")
        return None
    
    team_h_id = fixture.get('team_h')
    team_a_id = fixture.get('team_a')
    
    # Get team names
    team_h_name = _get_team_name(team_h_id, teams_map)
    team_a_name = _get_team_name(team_a_id, teams_map)
    
    # Get difficulty ratings
    team_h_difficulty = fixture.get('team_h_difficulty', 0)
    team_a_difficulty = fixture.get('team_a_difficulty', 0)
    difficulty_difference = _calculate_difficulty_difference(team_h_difficulty, team_a_difficulty)
    
    # Get human-readable match prediction with team names
    match_prediction = _get_match_prediction(difficulty_difference, team_h_name, team_a_name)

    return {
        'id': fixture.get('id'),
        'name': f"{team_h_name} v {team_a_name}",
        'kickoff_time': fixture.get('kickoff_time'),
        'event': fixture.get('event'),
        'team_h': team_h_name,
        'team_a': team_a_name,
        'team_h_difficulty': team_h_difficulty,
        'team_a_difficulty': team_a_difficulty,
        'difficulty_difference': difficulty_difference,
        'match_prediction': match_prediction,
    }


def create_fixtures_with_names(fixtures: List[Dict[str, Any]], teams_map: Dict[int, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Create fixture list with team names and additional data
    
    Args:
        fixtures: List of fixture dictionaries from API
        teams_map: Dictionary mapping team IDs to team data
        
    Returns:
        List[Dict[str, Any]]: List of processed fixture dictionaries with team names
    """
    processed_fixtures = []
    for fixture in fixtures:
        processed = create_fixture_info(fixture, teams_map)
        if processed is not None:  # Only add valid fixtures
            processed_fixtures.append(processed)
    return processed_fixtures


def fetch_all_fixtures() -> List[Dict[str, Any]]:
    """
    Fetch fixtures for all gameweeks with progress indication
    
    Returns:
        List[Dict[str, Any]]: List of all fixtures across all gameweeks
    """
    print(f"Fetching all fixtures for gameweeks {FIRST_GAMEWEEK}-{TOTAL_GAMEWEEKS}...")
    
    # Fetch teams data once
    teams_map = fetch_teams()
    all_fixtures: List[Dict[str, Any]] = []
    
    successful_gameweeks = 0
    failed_gameweeks = 0
    
    # Fetch fixtures for each gameweek
    for event_number in range(FIRST_GAMEWEEK, TOTAL_GAMEWEEKS + 1):
        print(f"Fetching gameweek {event_number}/{TOTAL_GAMEWEEKS}... ", end="", flush=True)
        try:
            fixtures = fetch_fixture_ids(event_number)
            if fixtures:
                gameweek_fixtures = create_fixtures_with_names(fixtures, teams_map)
                all_fixtures.extend(gameweek_fixtures)
                print(f"✅ {len(fixtures)} fixtures")
                successful_gameweeks += 1
            else:
                print("⚠️  No fixtures found")
        except Exception as e:
            print(f"❌ Error: {e}")
            failed_gameweeks += 1
            continue  # Continue with next gameweek instead of stopping
    
    print(f"\n📊 Summary: {successful_gameweeks} gameweeks successful, {failed_gameweeks} failed")
    print(f"📄 Total fixtures retrieved: {len(all_fixtures)}")
    
    return all_fixtures
