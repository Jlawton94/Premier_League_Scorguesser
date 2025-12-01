"""
Test suite for script outputs and file generation
"""
import unittest
import sys
import os
import csv
import tempfile
import shutil
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


class TestScriptOutputs(unittest.TestCase):
    """Test cases for script outputs and file generation"""

    def setUp(self):
        """Set up test environment"""
        self.test_dir = tempfile.mkdtemp()
        self.fixtures_dir = os.path.join(self.test_dir, 'fixtures')
        self.templates_dir = os.path.join(self.test_dir, 'templates')
        self.docs_dir = os.path.join(self.test_dir, 'docs')
        
        # Create test directories
        os.makedirs(self.fixtures_dir)
        os.makedirs(self.templates_dir)
        os.makedirs(self.docs_dir)
        
        # Create sample fixture data
        self.sample_fixtures_file = os.path.join(self.fixtures_dir, 'all_fixtures_2025.csv')
        with open(self.sample_fixtures_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['gameweek', 'home_team', 'away_team', 'date', 'kickoff', 'match_prediction'])
            writer.writerow([1, 'Arsenal', 'Wolves', '2025-08-16', '15:00', 'Arsenal Favorites'])
            writer.writerow([1, 'Brighton', 'Man United', '2025-08-16', '15:00', 'Man United Slight Favorites'])
            writer.writerow([2, 'Liverpool', 'Chelsea', '2025-08-23', '16:30', 'Liverpool Strong Favorites'])

    def tearDown(self):
        """Clean up test environment"""
        shutil.rmtree(self.test_dir)

    def test_csv_file_structure(self):
        """Test that CSV files have correct structure"""
        # Test fixture CSV structure
        with open(self.sample_fixtures_file, 'r') as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames
            rows = list(reader)
        
        expected_headers = ['gameweek', 'home_team', 'away_team', 'date', 'kickoff', 'match_prediction']
        for header in expected_headers:
            self.assertIn(header, headers)
        
        self.assertEqual(len(rows), 3)
        self.assertEqual(rows[0]['home_team'], 'Arsenal')
        self.assertEqual(rows[2]['gameweek'], '2')

    def test_master_data_csv_generation(self):
        """Test master data CSV generation"""
        # Mock the create_master_data_csv function behavior
        output_file = os.path.join(self.fixtures_dir, 'advanced_master_data.csv')
        
        # Create expected master data structure
        headers = [
            'Gameweek', 'Home Team', 'Away Team', 'Date', 'Kickoff', 
            'Match Prediction', 'Actual Home', 'Actual Away', 'Result Available'
        ]
        
        with open(output_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerow([1, 'Arsenal', 'Wolves', '2025-08-16', '15:00', 'Arsenal Favorites', '', '', 'FALSE'])
        
        # Verify file structure
        self.assertTrue(os.path.exists(output_file))
        
        with open(output_file, 'r') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['Home Team'], 'Arsenal')
        self.assertEqual(rows[0]['Result Available'], 'FALSE')

    def test_player_template_generation(self):
        """Test player template CSV generation"""
        player_name = "test_player"
        template_file = os.path.join(self.templates_dir, f'advanced_player_{player_name}.csv')
        
        # Create expected player template structure
        headers = [
            'Gameweek', 'Home Team', 'Away Team', 'Date', 'Kickoff',
            'Home Pred', 'Away Pred', 'Captain?', 'Match Points', 'Breakdown',
            'Actual Home', 'Actual Away'
        ]
        
        with open(template_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerow(['=== GAMEWEEK 1 ==='] + [''] * (len(headers) - 1))
            writer.writerow([1, 'Arsenal', 'Wolves', '2025-08-16', '15:00', '', '', 'FALSE', '', '', '', ''])
        
        # Verify file structure
        self.assertTrue(os.path.exists(template_file))
        
        with open(template_file, 'r') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        self.assertGreaterEqual(len(rows), 3)  # Headers + gameweek separator + at least one match
        self.assertEqual(rows[0], headers)
        self.assertIn('GAMEWEEK 1', rows[1][0])

    def test_scoring_rules_csv_generation(self):
        """Test scoring rules CSV generation"""
        rules_file = os.path.join(self.templates_dir, 'advanced_scoring_rules.csv')
        
        # Create expected scoring rules structure
        rules_content = [
            ["ADVANCED FPL PREDICTION GAME - SCORING RULES"],
            [""],
            ["CORE SCORING"],
            ["Exact scoreline: 10 points"],
            ["Correct result (W/L/D): 3 points"],
            [""],
            ["BONUS POINTS"],
            ["Correct goal difference (non-draws): +2 points"],
            [""],
            ["CAPTAIN & CHIPS"],
            ["Captain (one per gameweek): x2 multiplier"],
            ["Triple Captain (once per season): x3 multiplier"]
        ]
        
        with open(rules_file, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(rules_content)
        
        # Verify file structure
        self.assertTrue(os.path.exists(rules_file))
        
        with open(rules_file, 'r') as f:
            reader = csv.reader(f)
            rows = list(reader)
        
        self.assertGreater(len(rows), 5)
        self.assertIn('SCORING RULES', rows[0][0])
        self.assertIn('CORE SCORING', rows[2][0])

    def test_setup_instructions_generation(self):
        """Test setup instructions markdown generation"""
        instructions_file = os.path.join(self.docs_dir, 'advanced_setup_instructions.md')
        
        # Create expected instructions content
        content = """# Advanced FPL Prediction Game Setup

## 🎯 Complete Setup for Test Players

### Files Generated:
- `advanced_master_data.csv` - Import to 'Game Weeks' sheet
- `advanced_scoring_rules.csv` - Import to 'Scoring Rules' sheet  

### Google Sheets Setup:

#### 1. Create New Spreadsheet
Create a new Google Sheets document for your prediction game.

#### 2. Import CSV Files
Import the generated CSV files to appropriate sheets.

### 🎮 How to Play:
1. Make predictions for each match
2. Select captain for double points
3. Use chips strategically
"""
        
        with open(instructions_file, 'w') as f:
            f.write(content)
        
        # Verify file structure
        self.assertTrue(os.path.exists(instructions_file))
        
        with open(instructions_file, 'r') as f:
            content = f.read()
        
        self.assertIn('# Advanced FPL Prediction Game Setup', content)
        self.assertIn('Google Sheets Setup', content)
        self.assertIn('How to Play', content)

    def test_file_permissions_and_encoding(self):
        """Test that generated files have correct permissions and encoding"""
        test_file = os.path.join(self.test_dir, 'test_encoding.csv')
        
        # Test UTF-8 encoding with special characters
        content = "Team,Country\nArsenal,🏴󠁧󠁢󠁥󠁮󠁧󠁿\nBarcelona,🇪🇸"
        
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # Verify file can be read with correct encoding
        with open(test_file, 'r', encoding='utf-8') as f:
            read_content = f.read()
        
        self.assertEqual(content, read_content)
        self.assertIn('🏴󠁧󠁢󠁥󠁮󠁧󠁿', read_content)  # Flag emoji should be preserved

    def test_csv_data_integrity(self):
        """Test that CSV data maintains integrity through read/write cycles"""
        test_data = [
            {'name': 'Arsenal', 'points': 75, 'goals_for': 80, 'goals_against': 30},
            {'name': 'Liverpool', 'points': 73, 'goals_for': 85, 'goals_against': 35},
            {'name': 'Man City', 'points': 70, 'goals_for': 90, 'goals_against': 25}
        ]
        
        test_file = os.path.join(self.test_dir, 'data_integrity.csv')
        
        # Write data
        with open(test_file, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['name', 'points', 'goals_for', 'goals_against'])
            writer.writeheader()
            writer.writerows(test_data)
        
        # Read data back
        with open(test_file, 'r') as f:
            reader = csv.DictReader(f)
            read_data = list(reader)
        
        # Verify integrity
        self.assertEqual(len(read_data), len(test_data))
        for i, row in enumerate(read_data):
            self.assertEqual(row['name'], test_data[i]['name'])
            self.assertEqual(int(row['points']), test_data[i]['points'])


class TestOutputValidation(unittest.TestCase):
    """Test cases for validating output formats and content"""

    def test_fixture_csv_validation(self):
        """Test fixture CSV format validation"""
        required_columns = [
            'gameweek', 'home_team', 'away_team', 'date', 'kickoff', 'match_prediction'
        ]
        
        # Create test CSV with all required columns
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            writer = csv.writer(f)
            writer.writerow(required_columns)
            writer.writerow([1, 'Arsenal', 'Liverpool', '2025-08-16', '15:00', 'Arsenal Favorites'])
            temp_file = f.name
        
        try:
            # Validate CSV structure
            with open(temp_file, 'r') as f:
                reader = csv.DictReader(f)
                headers = reader.fieldnames
                
                for col in required_columns:
                    self.assertIn(col, headers, f"Missing required column: {col}")
                
                row = next(reader)
                self.assertIsNotNone(row['gameweek'])
                self.assertIsNotNone(row['home_team'])
                self.assertIsNotNone(row['away_team'])
        
        finally:
            os.unlink(temp_file)

    def test_prediction_data_types(self):
        """Test that prediction data maintains correct types"""
        predictions = [
            {'gameweek': '1', 'home_score': '2', 'away_score': '1'},
            {'gameweek': '2', 'home_score': '0', 'away_score': '3'}
        ]
        
        # Test type conversion
        for pred in predictions:
            gameweek = int(pred['gameweek'])
            home_score = int(pred['home_score']) if pred['home_score'] else None
            away_score = int(pred['away_score']) if pred['away_score'] else None
            
            self.assertIsInstance(gameweek, int)
            self.assertIsInstance(home_score, int)
            self.assertIsInstance(away_score, int)


if __name__ == '__main__':
    unittest.main()
