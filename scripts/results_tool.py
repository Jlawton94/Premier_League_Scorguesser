"""
Results Tool - Fetch actual match results for updating prediction spreadsheets
"""
import sys
import os
from typing import Optional

# Add the src directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.utils.results_utils import (
    fetch_gameweek_results, 
    fetch_multiple_gameweeks_results, 
    save_results_to_csv
)
from src.core.constants import FIRST_GAMEWEEK, TOTAL_GAMEWEEKS


def get_valid_gameweek_for_results() -> int:
    """Get a valid gameweek number from user input for results"""
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


def get_gameweek_range() -> tuple[int, int]:
    """Get a valid range of gameweeks from user input"""
    print("Enter gameweek range:")
    
    while True:
        try:
            start = int(input(f"Start gameweek ({FIRST_GAMEWEEK}-{TOTAL_GAMEWEEKS}): "))
            if not (FIRST_GAMEWEEK <= start <= TOTAL_GAMEWEEKS):
                print(f"Please enter a number between {FIRST_GAMEWEEK} and {TOTAL_GAMEWEEKS}")
                continue
            break
        except ValueError:
            print("Please enter a valid number")
        except KeyboardInterrupt:
            print("\nOperation cancelled by user")
            exit(0)
    
    while True:
        try:
            end = int(input(f"End gameweek ({start}-{TOTAL_GAMEWEEKS}): "))
            if not (start <= end <= TOTAL_GAMEWEEKS):
                print(f"Please enter a number between {start} and {TOTAL_GAMEWEEKS}")
                continue
            break
        except ValueError:
            print("Please enter a valid number")
        except KeyboardInterrupt:
            print("\nOperation cancelled by user")
            exit(0)
    
    return start, end


def get_results_choice() -> str:
    """Get and validate user choice for results tool"""
    options = {
        "1": "Single gameweek results",
        "2": "Multiple gameweeks results",
        "3": "All completed gameweeks (1-38)"
    }
    
    print("Choose option:")
    for key, description in options.items():
        print(f"{key}. {description}")
    
    while True:
        try:
            choice = input("Enter 1, 2, or 3: ").strip()
            if choice in options:
                return choice
            print("Please enter 1, 2, or 3")
        except KeyboardInterrupt:
            print("\nOperation cancelled by user")
            exit(0)


def fetch_single_gameweek_results() -> None:
    """Handle fetching and saving results for a single gameweek"""
    gameweek = get_valid_gameweek_for_results()
    
    try:
        results = fetch_gameweek_results(gameweek)
        
        if not results:
            print(f"No completed matches found for gameweek {gameweek}")
            return
        
        # Save to CSV in data/results directory
        output_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'results')
        os.makedirs(output_dir, exist_ok=True)
        output_file = os.path.join(output_dir, f"gameweek_{gameweek}_results.csv")
        save_results_to_csv(results, gameweek=gameweek, output_file=output_file)
        
    except Exception as e:
        print(f"Error fetching gameweek {gameweek} results: {e}")


def fetch_multiple_gameweeks_results_handler() -> None:
    """Handle fetching and saving results for multiple gameweeks"""
    start_gameweek, end_gameweek = get_gameweek_range()
    
    try:
        print(f"\nFetching results for gameweeks {start_gameweek}-{end_gameweek}...")
        results = fetch_multiple_gameweeks_results(start_gameweek, end_gameweek)
        
        if not results:
            print(f"No completed matches found for gameweeks {start_gameweek}-{end_gameweek}")
            return
        
        # Save to CSV in data/results directory
        output_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'results')
        os.makedirs(output_dir, exist_ok=True)
        filename = f"gameweeks_{start_gameweek}-{end_gameweek}_results.csv"
        output_file = os.path.join(output_dir, filename)
        save_results_to_csv(results, gameweek=None, output_file=output_file)
        
    except Exception as e:
        print(f"Error fetching gameweeks {start_gameweek}-{end_gameweek} results: {e}")


def fetch_all_completed_results() -> None:
    """Handle fetching and saving all completed results"""
    try:
        print(f"\nScanning all gameweeks {FIRST_GAMEWEEK}-{TOTAL_GAMEWEEKS} for completed matches...")
        results = fetch_multiple_gameweeks_results(FIRST_GAMEWEEK, TOTAL_GAMEWEEKS)
        
        if not results:
            print("No completed matches found across all gameweeks")
            return
        
        # Group by gameweek for summary
        gameweeks_with_results = set(result.get('event') for result in results)
        completed_gameweeks = sorted(gameweeks_with_results)
        
        print(f"📊 Found completed matches in gameweeks: {completed_gameweeks}")
        
        # Save to CSV in data/results directory
        output_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'results')
        os.makedirs(output_dir, exist_ok=True)
        output_file = os.path.join(output_dir, "all_completed_results.csv")
        save_results_to_csv(results, gameweek=None, output_file=output_file)
        
    except Exception as e:
        print(f"Error fetching all results: {e}")


def main() -> None:
    """Main function for results tool"""
    print("🏆 FPL RESULTS TOOL")
    print("=" * 30)
    print("Fetch actual match results for updating your prediction spreadsheet")
    print()
    
    try:
        choice = get_results_choice()
        
        if choice == "1":
            fetch_single_gameweek_results()
        elif choice == "2":
            fetch_multiple_gameweeks_results_handler()
        elif choice == "3":
            fetch_all_completed_results()
            
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    main()
