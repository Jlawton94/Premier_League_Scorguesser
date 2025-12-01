"""
Fantasy Premier League API utility functions - Direct API calls only
"""
import requests
from typing import Dict, List, Any, Optional
from .constants import FPL_FIXTURES_URL, FPL_BOOTSTRAP_URL, REQUEST_TIMEOUT


def fetch_fixture_ids(event_number: int) -> List[Dict[str, Any]]:
    """
    Fetch fixtures for a specific gameweek/event number
    
    Args:
        event_number (int): The gameweek number (1-38)
        
    Returns:
        List[Dict[str, Any]]: List of fixture dictionaries
        
    Raises:
        requests.RequestException: If API request fails
        ValueError: If event_number is invalid
    """
    if not isinstance(event_number, int) or not (1 <= event_number <= 38):
        raise ValueError(f"Event number must be between 1 and 38, got {event_number}")
    
    url = f"{FPL_FIXTURES_URL}?event={event_number}"
    
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        fixtures = response.json()
        
        if not isinstance(fixtures, list):
            raise ValueError(f"Expected list of fixtures, got {type(fixtures)}")
            
        return fixtures
    except requests.RequestException as e:
        print(f"Error fetching fixtures for gameweek {event_number}: {e}")
        raise


def fetch_teams() -> Dict[int, Dict[str, Any]]:
    """
    Fetch all teams data from the Fantasy Premier League API
    
    Returns:
        Dict[int, Dict[str, Any]]: Dictionary mapping team IDs to team data
        
    Raises:
        requests.RequestException: If API request fails
        ValueError: If response format is unexpected
    """
    print(f"\nFetching teams data from Fantasy Premier League API...")
    
    try:
        response = requests.get(FPL_BOOTSTRAP_URL, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        fpl_data = response.json()
        
        if not isinstance(fpl_data, dict) or 'teams' not in fpl_data:
            raise ValueError("Invalid response format: missing 'teams' data")
        
        # Create a map with team id as key and team object as value
        teams_map: Dict[int, Dict[str, Any]] = {}
        for team in fpl_data['teams']:
            if 'id' not in team or 'name' not in team:
                print(f"Warning: Skipping invalid team data: {team}")
                continue
            team_id = team['id']
            teams_map[team_id] = team
        
        if not teams_map:
            raise ValueError("No valid teams found in API response")
            
        print(f"Successfully fetched {len(teams_map)} teams")
        return teams_map
        
    except requests.RequestException as e:
        print(f"Error fetching teams data: {e}")
        raise
    except (KeyError, TypeError, ValueError) as e:
        print(f"Error processing teams data: {e}")
        raise
