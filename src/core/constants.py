# Configuration constants for FPL data processing

# API URLs
FPL_BASE_URL = "https://fantasy.premierleague.com/api"
FPL_FIXTURES_URL = f"{FPL_BASE_URL}/fixtures/"
FPL_BOOTSTRAP_URL = f"{FPL_BASE_URL}/bootstrap-static/"

# API configuration
REQUEST_TIMEOUT = 30  # seconds
MAX_RETRY_ATTEMPTS = 3

# Season configuration
TOTAL_GAMEWEEKS = 38
FIRST_GAMEWEEK = 1

# User interface
MENU_OPTIONS = {
    "1": "Single gameweek",
    "2": "All gameweeks (1-38) to JSON files", 
    "3": "All gameweeks (1-38) to CSV for Google Sheets"
}

# File output settings
DEFAULT_JSON_FILENAME = "all_fixtures_2025.json"
DEFAULT_CSV_FILENAME = "all_fixtures_2025.csv"
GAMEWEEK_SUMMARY_FILENAME = "fixtures_by_gameweek_2025.json"

# CSV column headers
CSV_HEADERS = ["Home Team", "Home Score", "Away Score", "Away Team", "Kickoff Time", "Match Prediction"]

# Date formatting
DATETIME_FORMAT = '%Y-%m-%d %H:%M'

# Match prediction thresholds
PREDICTION_THRESHOLDS = {
    "strong_favorite": 3,
    "favorite": 2, 
    "slight_favorite": 1,
    "even": 0
}

# Data validation settings
REQUIRED_FIXTURE_FIELDS = ['team_h', 'team_a', 'event', 'kickoff_time']
REQUIRED_TEAM_FIELDS = ['id', 'name']

# Progress display settings
ENABLE_PROGRESS_EMOJIS = True
SHOW_DETAILED_PROGRESS = True
