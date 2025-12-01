"""
Test suite for save utilities
"""
import unittest
import sys
import os
import json
import csv
import tempfile
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from utils.save_utils import (
    save_fixtures_to_json,
    save_fixtures_to_csv,
    create_csv_headers,
    format_fixture_for_csv
)


class TestSaveUtils(unittest.TestCase):
    """Test cases for save utilities"""

    def setUp(self):
        """Set up test data"""
        self.sample_fixtures = [
            {
                'gameweek': 1,
                'home_team': 'Arsenal',
                'away_team': 'Liverpool',
                'date': '2025-08-16',
                'kickoff': '15:00',
                'match_prediction': 'Arsenal Favorites',
                'home_score': None,
                'away_score': None,
                'finished': False
            },
            {
                'gameweek': 1,
                'home_team': 'Man City',
                'away_team': 'Tottenham',
                'date': '2025-08-16',
                'kickoff': '17:30',
                'match_prediction': 'Man City Strong Favorites',
                'home_score': 2,
                'away_score': 1,
                'finished': True
            }
        ]

    def test_create_csv_headers(self):
        """Test CSV header creation"""
        headers = create_csv_headers()
        expected_headers = [
            'gameweek', 'home_team', 'away_team', 'date', 'kickoff',
            'match_prediction', 'home_score', 'away_score', 'finished'
        ]
        
        for header in expected_headers:
            self.assertIn(header, headers)

    def test_format_fixture_for_csv(self):
        """Test fixture formatting for CSV"""
        fixture = self.sample_fixtures[0]
        formatted = format_fixture_for_csv(fixture)
        
        self.assertEqual(formatted[0], 1)  # gameweek
        self.assertEqual(formatted[1], 'Arsenal')  # home_team
        self.assertEqual(formatted[2], 'Liverpool')  # away_team
        self.assertEqual(formatted[3], '2025-08-16')  # date
        self.assertEqual(formatted[4], '15:00')  # kickoff
        self.assertEqual(formatted[5], 'Arsenal Favorites')  # match_prediction
        self.assertEqual(formatted[6], '')  # home_score (None -> empty string)
        self.assertEqual(formatted[7], '')  # away_score (None -> empty string)
        self.assertEqual(formatted[8], 'FALSE')  # finished (False -> 'FALSE')

    def test_save_fixtures_to_json(self):
        """Test saving fixtures to JSON"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_file = f.name

        try:
            # Save fixtures to JSON
            save_fixtures_to_json(self.sample_fixtures, temp_file)
            
            # Verify file was created and contains correct data
            self.assertTrue(os.path.exists(temp_file))
            
            with open(temp_file, 'r') as f:
                loaded_data = json.load(f)
            
            self.assertEqual(len(loaded_data), 2)
            self.assertEqual(loaded_data[0]['home_team'], 'Arsenal')
            self.assertEqual(loaded_data[1]['home_team'], 'Man City')

        finally:
            # Clean up
            if os.path.exists(temp_file):
                os.unlink(temp_file)

    def test_save_fixtures_to_csv(self):
        """Test saving fixtures to CSV"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            temp_file = f.name

        try:
            # Save fixtures to CSV
            save_fixtures_to_csv(self.sample_fixtures, temp_file)
            
            # Verify file was created and contains correct data
            self.assertTrue(os.path.exists(temp_file))
            
            with open(temp_file, 'r') as f:
                reader = csv.DictReader(f)
                rows = list(reader)
            
            self.assertEqual(len(rows), 2)
            self.assertEqual(rows[0]['home_team'], 'Arsenal')
            self.assertEqual(rows[0]['finished'], 'FALSE')
            self.assertEqual(rows[1]['home_team'], 'Man City')
            self.assertEqual(rows[1]['finished'], 'TRUE')

        finally:
            # Clean up
            if os.path.exists(temp_file):
                os.unlink(temp_file)

    def test_save_fixtures_error_handling(self):
        """Test error handling in save operations"""
        # Test saving to invalid path
        invalid_path = '/nonexistent/directory/file.csv'
        
        # This should not raise an exception but should handle the error gracefully
        try:
            save_fixtures_to_csv(self.sample_fixtures, invalid_path)
        except Exception as e:
            # If an exception is raised, it should be a reasonable one
            self.assertIsInstance(e, (FileNotFoundError, PermissionError, OSError))

    def test_save_empty_fixtures(self):
        """Test saving empty fixture list"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            temp_file = f.name

        try:
            # Save empty list
            save_fixtures_to_csv([], temp_file)
            
            # File should still be created with headers
            self.assertTrue(os.path.exists(temp_file))
            
            with open(temp_file, 'r') as f:
                reader = csv.reader(f)
                rows = list(reader)
            
            # Should have at least header row
            self.assertGreaterEqual(len(rows), 1)

        finally:
            # Clean up
            if os.path.exists(temp_file):
                os.unlink(temp_file)


if __name__ == '__main__':
    unittest.main()
