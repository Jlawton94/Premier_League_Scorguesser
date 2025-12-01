"""
Results utilities for Fantasy Premier League - Fetch actual match results
for updating prediction spreadsheets with real scores
"""
from typing import Dict, List, Any, Optional
import csv
from datetime import datetime
from ..core.fpl_api import fetch_fixture_ids, fetch_teams
from .data_utils import _get_team_name, validate_fixture_data
from ..core.constants import (
    DEFAULT_CSV_FILENAME, DATETIME_FORMAT, CSV_HEADERS,
    FIRST_GAMEWEEK, TOTAL_GAMEWEEKS
)


def is_fixture_finished(fixture: Dict[str, Any]) -> bool:
    """
    Check if a fixture has finished (has final scores)
    
    Args:
        fixture: Fixture dictionary from API
        
    Returns:
        bool: True if fixture is finished, False otherwise
    """
    return (
        fixture.get('finished', False) and
        fixture.get('team_h_score') is not None and
        fixture.get('team_a_score') is not None
    )


def get_match_result(home_score: int, away_score: int) -> str:
    """
    Determine match result from scores
    
    Args:
        home_score: Home team final score
        away_score: Away team final score
        
    Returns:
        str: Match result ("Home Win", "Away Win", or "Draw")
    """
    if home_score > away_score:
        return "Home Win"
    elif away_score > home_score:
        return "Away Win"
    else:
        return "Draw"


def create_result_info(fixture: Dict[str, Any], teams_map: Dict[int, Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Create a result info dictionary for a finished fixture
    
    Args:
        fixture: Single finished fixture dictionary from API
        teams_map: Dictionary mapping team IDs to team data
        
    Returns:
        Optional[Dict[str, Any]]: Processed result information, or None if not finished/invalid
    """
    # Skip if fixture hasn't finished
    if not is_fixture_finished(fixture):
        return None
    
    # Validate fixture data
    if not validate_fixture_data(fixture):
        return None
    
    team_h_id = fixture.get('team_h')
    team_a_id = fixture.get('team_a')
    
    # Get team names
    team_h_name = _get_team_name(team_h_id, teams_map)
    team_a_name = _get_team_name(team_a_id, teams_map)
    
    # Get final scores
    home_score = fixture.get('team_h_score')
    away_score = fixture.get('team_a_score')
    
    # Get match result
    match_result = get_match_result(home_score, away_score)
    
    return {
        'id': fixture.get('id'),
        'name': f"{team_h_name} v {team_a_name}",
        'kickoff_time': fixture.get('kickoff_time'),
        'event': fixture.get('event'),
        'team_h': team_h_name,
        'team_a': team_a_name,
        'team_h_score': home_score,
        'team_a_score': away_score,
        'match_result': match_result,
        'finished': True
    }


def fetch_gameweek_results(gameweek: int) -> List[Dict[str, Any]]:
    """
    Fetch completed results for a specific gameweek
    
    Args:
        gameweek: Gameweek number (1-38)
        
    Returns:
        List[Dict[str, Any]]: List of completed results for the gameweek
    """
    print(f"Fetching results for gameweek {gameweek}...")
    
    try:
        # Fetch teams data
        teams_map = fetch_teams()
        
        # Fetch fixtures for the gameweek
        fixtures = fetch_fixture_ids(gameweek)
        
        if not fixtures:
            print(f"No fixtures found for gameweek {gameweek}")
            return []
        
        # Process only finished fixtures
        results = []
        finished_count = 0
        pending_count = 0
        
        for fixture in fixtures:
            result = create_result_info(fixture, teams_map)
            if result is not None:
                results.append(result)
                finished_count += 1
            else:
                if validate_fixture_data(fixture):  # Valid fixture but not finished
                    pending_count += 1
        
        print(f"✅ Found {finished_count} completed matches")
        if pending_count > 0:
            print(f"⏳ {pending_count} matches still pending")
        
        return results
        
    except Exception as e:
        print(f"❌ Error fetching gameweek {gameweek} results: {e}")
        return []


def fetch_multiple_gameweeks_results(start_gameweek: int, end_gameweek: int) -> List[Dict[str, Any]]:
    """
    Fetch completed results for multiple gameweeks
    
    Args:
        start_gameweek: Starting gameweek number
        end_gameweek: Ending gameweek number
        
    Returns:
        List[Dict[str, Any]]: List of all completed results
    """
    all_results = []
    
    for gameweek in range(start_gameweek, end_gameweek + 1):
        results = fetch_gameweek_results(gameweek)
        all_results.extend(results)
    
    return all_results


def _format_kickoff_time_results(kickoff_time: Optional[str]) -> str:
    """Helper function to format kickoff time for results"""
    if not kickoff_time:
        return "TBD"
    
    try:
        dt = datetime.fromisoformat(kickoff_time.replace('Z', '+00:00'))
        return dt.strftime(DATETIME_FORMAT)
    except (ValueError, TypeError) as e:
        return kickoff_time or "TBD"


def _write_result_row(writer: Any, result: Dict[str, Any]) -> None:
    """Helper function to write a single result row to CSV"""
    formatted_time = _format_kickoff_time_results(result.get('kickoff_time'))
    
    writer.writerow([
        result.get('team_h', 'Unknown'),           # Home Team
        result.get('team_h_score', ''),            # Home Score (actual result)
        result.get('team_a_score', ''),            # Away Score (actual result)  
        result.get('team_a', 'Unknown'),           # Away Team
        formatted_time,                            # Kickoff Time
        result.get('match_result', 'Unknown')      # Match Result
    ])


def save_results_to_csv(results: List[Dict[str, Any]], gameweek: Optional[int] = None, output_file: Optional[str] = None) -> str:
    """
    Save match results to CSV format for updating Google Sheets
    
    Args:
        results: List of result dictionaries
        gameweek: Single gameweek number (for filename), or None for multiple gameweeks
        output_file: Custom output filename
        
    Returns:
        str: Path to created CSV file
        
    Raises:
        ValueError: If no results provided
        IOError: If file cannot be written
    """
    if not results:
        raise ValueError("No results provided to save")
    
    # Generate filename if not provided
    if output_file is None:
        if gameweek is not None:
            output_file = f"gameweek_{gameweek}_results.csv"
        else:
            output_file = "match_results.csv"
    
    try:
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            current_gameweek = None
            
            # Write header
            writer.writerow(CSV_HEADERS)
            
            for result in results:
                # Add gameweek separator if processing multiple gameweeks
                result_gameweek = result.get('event')
                if gameweek is None and result_gameweek != current_gameweek:
                    if current_gameweek is not None:
                        writer.writerow([])  # Empty row between gameweeks
                    writer.writerow([f"GAMEWEEK {result_gameweek}"])
                    current_gameweek = result_gameweek
                
                _write_result_row(writer, result)
        
        print(f"\n✅ Saved {len(results)} match results to {output_file}")
        print("📊 You can now copy these results into your Google Sheet!")
        print("💡 Tip: Use this to update the 'Home Score' and 'Away Score' columns")
        
        return output_file
        
    except IOError as e:
        raise IOError(f"Failed to save results CSV file '{output_file}': {e}")
