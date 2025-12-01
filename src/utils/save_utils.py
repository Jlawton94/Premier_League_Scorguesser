"""
File save utilities for fixtures data
"""
import json
import csv
import os
from datetime import datetime
from typing import List, Dict, Any, Tuple, Optional
from ..core.constants import (
    DEFAULT_JSON_FILENAME, DEFAULT_CSV_FILENAME, GAMEWEEK_SUMMARY_FILENAME,
    CSV_HEADERS, DATETIME_FORMAT
)


def _format_kickoff_time(kickoff_time: Optional[str]) -> str:
    """Helper function to format kickoff time"""
    if not kickoff_time:
        return "TBD"
    
    try:
        dt = datetime.fromisoformat(kickoff_time.replace('Z', '+00:00'))
        return dt.strftime(DATETIME_FORMAT)
    except (ValueError, TypeError) as e:
        print(f"Warning: Could not parse kickoff time '{kickoff_time}': {e}")
        return kickoff_time or "TBD"


def _group_fixtures_by_gameweek(all_fixtures: List[Dict[str, Any]]) -> Dict[int, List[Dict[str, Any]]]:
    """Helper function to group fixtures by gameweek"""
    gameweeks: Dict[int, List[Dict[str, Any]]] = {}
    for fixture in all_fixtures:
        event = fixture.get('event')
        if event is None:
            print(f"Warning: Fixture missing event number: {fixture.get('id', 'unknown')}")
            continue
        if event not in gameweeks:
            gameweeks[event] = []
        gameweeks[event].append(fixture)
    return gameweeks


def save_fixtures_to_json(all_fixtures: List[Dict[str, Any]], base_filename: Optional[str] = None) -> Tuple[str, str]:
    """
    Save fixtures to JSON files
    
    Args:
        all_fixtures: List of fixture dictionaries
        base_filename: Base name for output files (without extension, if None saves to data/fixtures)
        
    Returns:
        Tuple[str, str]: (main_file, summary_file) - paths to created files
    """
    if not all_fixtures:
        raise ValueError("No fixtures provided to save")
        
    if base_filename is None:
        # Create data/fixtures directory if it doesn't exist
        data_dir = os.path.join("data", "fixtures")
        os.makedirs(data_dir, exist_ok=True)
        base_filename = os.path.join(data_dir, DEFAULT_JSON_FILENAME.replace('.json', ''))
    
    # Save to main file
    output_file = f"{base_filename}.json"
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(all_fixtures, f, indent=2, ensure_ascii=False)
        print(f"\n✅ Saved {len(all_fixtures)} fixtures to {output_file}")
    except IOError as e:
        raise IOError(f"Failed to save main JSON file: {e}")
    
    # Create summary by gameweek
    try:
        gameweeks = _group_fixtures_by_gameweek(all_fixtures)
        # Determine summary filename based on base_filename directory
        if os.path.dirname(base_filename):
            summary_filename = os.path.join(os.path.dirname(base_filename), GAMEWEEK_SUMMARY_FILENAME)
        else:
            summary_filename = GAMEWEEK_SUMMARY_FILENAME
        
        with open(summary_filename, 'w', encoding='utf-8') as f:
            json.dump(gameweeks, f, indent=2, ensure_ascii=False)
        print(f"✅ Saved gameweek summary to {summary_filename}")
    except IOError as e:
        print(f"⚠️  Warning: Failed to save summary file: {e}")
        # Don't fail the whole operation for summary file
        summary_filename = GAMEWEEK_SUMMARY_FILENAME
    
    return output_file, summary_filename


def _write_gameweek_header(writer: Any, gameweek_number: int) -> None:
    """Helper function to write gameweek header rows"""
    writer.writerow([f"GAMEWEEK {gameweek_number}"])
    writer.writerow(CSV_HEADERS)


def _write_fixture_row(writer: Any, fixture: Dict[str, Any]) -> None:
    """Helper function to write a single fixture row"""
    formatted_time = _format_kickoff_time(fixture.get('kickoff_time'))
    
    writer.writerow([
        fixture.get('team_h', 'Unknown'),              # Home Team
        "",                                             # Home Score (empty for predictions)
        "",                                             # Away Score (empty for predictions)
        fixture.get('team_a', 'Unknown'),              # Away Team
        formatted_time,                                 # Kickoff Time
        fixture.get('match_prediction', 'Unknown')     # Match Prediction (human-readable)
    ])


def save_fixtures_to_csv(all_fixtures: List[Dict[str, Any]], output_file: Optional[str] = None) -> str:
    """
    Save fixtures to CSV format suitable for Google Sheets
    
    Args:
        all_fixtures: List of fixture dictionaries
        output_file: Output CSV filename (if None, saves to data/fixtures directory)
        
    Returns:
        str: Path to created CSV file
        
    Raises:
        ValueError: If no fixtures provided
        IOError: If file cannot be written
    """
    if not all_fixtures:
        raise ValueError("No fixtures provided to save")
        
    if output_file is None:
        # Create data/fixtures directory if it doesn't exist
        data_dir = os.path.join("data", "fixtures")
        os.makedirs(data_dir, exist_ok=True)
        output_file = os.path.join(data_dir, DEFAULT_CSV_FILENAME)
    
    try:
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            current_gameweek = None
            
            for fixture in all_fixtures:
                # Add gameweek separator rows
                if fixture.get('event') != current_gameweek:
                    if current_gameweek is not None:
                        # Add empty rows between gameweeks
                        writer.writerow([])
                        writer.writerow([])
                    
                    current_gameweek = fixture.get('event')
                    _write_gameweek_header(writer, current_gameweek)
                
                _write_fixture_row(writer, fixture)
        
        print(f"\n✅ Saved all fixtures to {output_file}")
        print("📊 You can now open this CSV file and copy/paste into Google Sheets!")
        
        return output_file
        
    except IOError as e:
        raise IOError(f"Failed to save CSV file '{output_file}': {e}")
