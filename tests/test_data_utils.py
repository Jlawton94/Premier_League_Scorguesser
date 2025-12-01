"""
Test suite for data utilities
"""
import unittest
import sys
import csv
import tempfile
import os
from pathlib import Path
from unittest.mock import patch, MagicMock

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from utils.data_utils import (
    validate_fixture_data,
    create_fixtures_with_names,
    _get_team_name,
    categorize_fixture_prediction,
    format_fixture_display
)


class TestDataUtils(unittest.TestCase):
    """Test cases for data utilities"""

    def setUp(self):
        """Set up test data"""
        self.valid_fixture = {
            'id': 1,
            'event': 1,
            'team_h': 1,
            'team_a': 2,
            'kickoff_time': '2025-08-16T14:00:00Z',
            'team_h_score': None,
            'team_a_score': None,
            'finished': False
        }

        self.teams_data = {
            1: {'name': 'Arsenal', 'short_name': 'ARS'},
            2: {'name': 'Liverpool', 'short_name': 'LIV'},
            3: {'name': 'Man City', 'short_name': 'MCI'}
        }

    def test_validate_fixture_data_valid(self):
        """Test validation of valid fixture data"""
        self.assertTrue(validate_fixture_data(self.valid_fixture))

    def test_validate_fixture_data_missing_fields(self):
        """Test validation fails with missing required fields"""
        invalid_fixture = self.valid_fixture.copy()
        del invalid_fixture['id']
        self.assertFalse(validate_fixture_data(invalid_fixture))

        invalid_fixture2 = self.valid_fixture.copy()
        del invalid_fixture2['event']
        self.assertFalse(validate_fixture_data(invalid_fixture2))

    def test_get_team_name(self):
        """Test team name retrieval"""
        name = _get_team_name(1, self.teams_data)
        self.assertEqual(name, 'Arsenal')

        name = _get_team_name(2, self.teams_data)
        self.assertEqual(name, 'Liverpool')

        # Test unknown team
        name = _get_team_name(999, self.teams_data)
        self.assertEqual(name, 'Unknown Team')

    def test_categorize_fixture_prediction(self):
        """Test fixture prediction categorization"""
        # Test strong favorites (rating difference > 15)
        category = categorize_fixture_prediction(85, 65)  # 20 point difference
        self.assertIn("Strong Favorites", category)

        # Test regular favorites (rating difference 8-15)
        category = categorize_fixture_prediction(80, 70)  # 10 point difference
        self.assertIn("Favorites", category)
        self.assertNotIn("Strong", category)
        self.assertNotIn("Slight", category)

        # Test slight favorites (rating difference 3-7)
        category = categorize_fixture_prediction(75, 70)  # 5 point difference
        self.assertIn("Slight Favorites", category)

        # Test even match (rating difference < 3)
        category = categorize_fixture_prediction(72, 70)  # 2 point difference
        self.assertEqual(category, "Even Match")

    def test_format_fixture_display(self):
        """Test fixture display formatting"""
        fixture = {
            'home_team': 'Arsenal',
            'away_team': 'Liverpool',
            'date': '2025-08-16',
            'kickoff': '15:00',
            'gameweek': 1
        }

        display = format_fixture_display(fixture)
        self.assertIn('Arsenal', display)
        self.assertIn('Liverpool', display)
        self.assertIn('vs', display)
        self.assertIn('2025-08-16', display)

    @patch('utils.data_utils.fetch_teams')
    @patch('utils.data_utils.fetch_fixture_ids')
    def test_create_fixtures_with_names(self, mock_fetch_fixtures, mock_fetch_teams):
        """Test creating fixtures with team names"""
        # Mock API responses
        mock_fetch_teams.return_value = self.teams_data
        mock_fetch_fixtures.return_value = [self.valid_fixture]

        fixtures = create_fixtures_with_names([1])

        self.assertEqual(len(fixtures), 1)
        fixture = fixtures[0]
        self.assertEqual(fixture['home_team'], 'Arsenal')
        self.assertEqual(fixture['away_team'], 'Liverpool')
        self.assertEqual(fixture['gameweek'], 1)


class TestDataUtilsIntegration(unittest.TestCase):
    """Integration tests for data utilities"""

    def test_csv_fixture_processing(self):
        """Test processing fixture data from CSV format"""
        # Create a temporary CSV file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            writer = csv.writer(f)
            writer.writerow(['gameweek', 'home_team', 'away_team', 'date', 'kickoff', 'match_prediction'])
            writer.writerow([1, 'Arsenal', 'Liverpool', '2025-08-16', '15:00', 'Arsenal Favorites'])
            writer.writerow([1, 'Man City', 'Tottenham', '2025-08-16', '17:30', 'Man City Strong Favorites'])
            temp_file = f.name

        try:
            # Test reading and processing the CSV
            with open(temp_file, 'r') as f:
                reader = csv.DictReader(f)
                fixtures = list(reader)

            self.assertEqual(len(fixtures), 2)
            self.assertEqual(fixtures[0]['home_team'], 'Arsenal')
            self.assertEqual(fixtures[1]['match_prediction'], 'Man City Strong Favorites')

        finally:
            # Clean up
            os.unlink(temp_file)


if __name__ == '__main__':
    unittest.main()
