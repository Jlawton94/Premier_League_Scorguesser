"""
Main script for fetching and processing Fantasy Premier League fixtures
"""
import json
import sys
import os
from typing import Optional

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.core.fpl_api import fetch_fixture_ids, fetch_teams
from src.utils.data_utils import create_fixtures_with_names, fetch_all_fixtures
from src.utils.save_utils import save_fixtures_to_json, save_fixtures_to_csv
from src.core.constants import MENU_OPTIONS, TOTAL_GAMEWEEKS, FIRST_GAMEWEEK


def get_valid_gameweek() -> int:
    """Get a valid gameweek number from user input"""
    while True:
        try:
            event_number = int(input(f"Enter gameweek number ({FIRST_GAMEWEEK}-{TOTAL_GAMEWEEKS}): "))
            if FIRST_GAMEWEEK <= event_number <= TOTAL_GAMEWEEKS:
                return event_number
            print(f"Please enter a number between {FIRST_GAMEWEEK} and {TOTAL_GAMEWEEKS}")
        except ValueError:
            print("Please enter a valid number")
        except KeyboardInterrupt:
            print("\nOperation cancelled by user")
            exit(0)


def get_user_choice() -> str:
    """Get and validate user menu choice"""
    print("Choose option:")
    for key, description in MENU_OPTIONS.items():
        print(f"{key}. {description}")
    
    while True:
        try:
            choice = input("Enter 1, 2, or 3: ").strip()
            if choice in MENU_OPTIONS:
                return choice
            print("Please enter 1, 2, or 3")
        except KeyboardInterrupt:
            print("\nOperation cancelled by user")
            exit(0)


def fetch_single_gameweek() -> None:
    """Handle fetching and displaying a single gameweek"""
    event_number = get_valid_gameweek()
        
    try:
        fixtures = fetch_fixture_ids(event_number)
        
        if not fixtures:
            print(f"No fixtures found for gameweek {event_number}")
            return

        print(f"\nExtracted {len(fixtures)} fixtures.")

        # Fetch teams data
        teams_map = fetch_teams()
        
        # Create fixtures with team names
        fixture_list = create_fixtures_with_names(fixtures, teams_map)
        
        print("\nFixtures with team names:")
        print(json.dumps(fixture_list, indent=2))
        
    except Exception as e:
        print(f"Error fetching gameweek {event_number}: {e}")


def main() -> None:
    """Main function to handle user choices"""
    try:
        choice = get_user_choice()
        
        if choice == "2":
            # Fetch all gameweeks and save to JSON files
            print("\nFetching all gameweeks for JSON export...")
            all_fixtures = fetch_all_fixtures()
            if all_fixtures:
                save_fixtures_to_json(all_fixtures)
            else:
                print("No fixtures were retrieved")
                
        elif choice == "3":
            # Fetch all gameweeks and save to CSV
            print("\nFetching all gameweeks for CSV export...")
            all_fixtures = fetch_all_fixtures()
            if all_fixtures:
                save_fixtures_to_csv(all_fixtures)
            else:
                print("No fixtures were retrieved")
        else:
            # Single gameweek (original functionality)
            fetch_single_gameweek()
            
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    main()