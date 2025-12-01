"""
Test suite for results utilities
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

from utils.results_utils import (
    save_results_to_csv,
    compare_predictions_with_results,
    calculate_prediction_accuracy,
    format_result_comparison
)


class TestResultsUtils(unittest.TestCase):
    """Test cases for results utilities"""

    def setUp(self):
        """Set up test data"""
        self.sample_results = [
            {
                'gameweek': 1,
                'home_team': 'Arsenal',
                'away_team': 'Liverpool',
                'date': '2025-08-16',
                'kickoff': '15:00',
                'home_score': 2,
                'away_score': 1,
                'finished': True
            },
            {
                'gameweek': 1,
                'home_team': 'Man City',
                'away_team': 'Tottenham',
                'date': '2025-08-16',
                'kickoff': '17:30',
                'home_score': 3,
                'away_score': 0,
                'finished': True
            }
        ]

        self.sample_predictions = [
            {
                'gameweek': 1,
                'home_team': 'Arsenal',
                'away_team': 'Liverpool',
                'predicted_home': 2,
                'predicted_away': 1
            },
            {
                'gameweek': 1,
                'home_team': 'Man City',
                'away_team': 'Tottenham',
                'predicted_home': 2,
                'predicted_away': 0
            }
        ]

    def test_save_results_to_csv(self):
        """Test saving results to CSV"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            temp_file = f.name

        try:
            # Save results to CSV
            save_results_to_csv(self.sample_results, temp_file)
            
            # Verify file was created and contains correct data
            self.assertTrue(os.path.exists(temp_file))
            
            with open(temp_file, 'r') as f:
                reader = csv.DictReader(f)
                rows = list(reader)
            
            self.assertEqual(len(rows), 2)
            self.assertEqual(rows[0]['home_team'], 'Arsenal')
            self.assertEqual(rows[0]['home_score'], '2')
            self.assertEqual(rows[1]['home_team'], 'Man City')
            self.assertEqual(rows[1]['home_score'], '3')

        finally:
            # Clean up
            if os.path.exists(temp_file):
                os.unlink(temp_file)

    def test_compare_predictions_with_results(self):
        """Test comparing predictions with actual results"""
        comparison = compare_predictions_with_results(
            self.sample_predictions,
            self.sample_results
        )
        
        self.assertEqual(len(comparison), 2)
        
        # First match: exact score match
        match1 = comparison[0]
        self.assertEqual(match1['home_team'], 'Arsenal')
        self.assertEqual(match1['predicted_home'], 2)
        self.assertEqual(match1['actual_home'], 2)
        self.assertEqual(match1['predicted_away'], 1)
        self.assertEqual(match1['actual_away'], 1)
        self.assertTrue(match1['exact_score'])
        self.assertTrue(match1['correct_result'])
        
        # Second match: correct result but not exact score
        match2 = comparison[1]
        self.assertEqual(match2['home_team'], 'Man City')
        self.assertFalse(match2['exact_score'])
        self.assertTrue(match2['correct_result'])

    def test_calculate_prediction_accuracy(self):
        """Test prediction accuracy calculation"""
        comparison = compare_predictions_with_results(
            self.sample_predictions,
            self.sample_results
        )
        
        accuracy = calculate_prediction_accuracy(comparison)
        
        self.assertIn('total_predictions', accuracy)
        self.assertIn('exact_scores', accuracy)
        self.assertIn('correct_results', accuracy)
        self.assertIn('exact_score_percentage', accuracy)
        self.assertIn('correct_result_percentage', accuracy)
        
        self.assertEqual(accuracy['total_predictions'], 2)
        self.assertEqual(accuracy['exact_scores'], 1)
        self.assertEqual(accuracy['correct_results'], 2)
        self.assertEqual(accuracy['exact_score_percentage'], 50.0)
        self.assertEqual(accuracy['correct_result_percentage'], 100.0)

    def test_format_result_comparison(self):
        """Test result comparison formatting"""
        comparison_item = {
            'home_team': 'Arsenal',
            'away_team': 'Liverpool',
            'predicted_home': 2,
            'predicted_away': 1,
            'actual_home': 2,
            'actual_away': 1,
            'exact_score': True,
            'correct_result': True
        }
        
        formatted = format_result_comparison(comparison_item)
        
        self.assertIn('Arsenal', formatted)
        self.assertIn('Liverpool', formatted)
        self.assertIn('2-1', formatted)
        self.assertIn('✅', formatted)  # Should indicate success

    def test_empty_data_handling(self):
        """Test handling of empty data sets"""
        # Test empty predictions
        comparison = compare_predictions_with_results([], self.sample_results)
        self.assertEqual(len(comparison), 0)
        
        # Test empty results
        comparison = compare_predictions_with_results(self.sample_predictions, [])
        self.assertEqual(len(comparison), 0)
        
        # Test accuracy calculation with empty data
        accuracy = calculate_prediction_accuracy([])
        self.assertEqual(accuracy['total_predictions'], 0)
        self.assertEqual(accuracy['exact_score_percentage'], 0.0)

    def test_mismatched_data_handling(self):
        """Test handling when predictions and results don't match"""
        mismatched_results = [
            {
                'gameweek': 1,
                'home_team': 'Chelsea',  # Different team
                'away_team': 'Brighton',
                'home_score': 1,
                'away_score': 0,
                'finished': True
            }
        ]
        
        comparison = compare_predictions_with_results(
            self.sample_predictions,
            mismatched_results
        )
        
        # Should only include matches that exist in both datasets
        self.assertEqual(len(comparison), 0)


class TestResultsUtilsIntegration(unittest.TestCase):
    """Integration tests for results utilities"""

    def test_end_to_end_results_processing(self):
        """Test complete results processing workflow"""
        # Create test prediction file
        predictions = [
            ['gameweek', 'home_team', 'away_team', 'predicted_home', 'predicted_away'],
            [1, 'Arsenal', 'Liverpool', 2, 1],
            [1, 'Man City', 'Tottenham', 3, 0]
        ]
        
        results = [
            ['gameweek', 'home_team', 'away_team', 'home_score', 'away_score'],
            [1, 'Arsenal', 'Liverpool', 2, 1],  # Exact match
            [1, 'Man City', 'Tottenham', 2, 0]   # Correct result, wrong score
        ]
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as pred_file:
            writer = csv.writer(pred_file)
            writer.writerows(predictions)
            pred_file_path = pred_file.name
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as res_file:
            writer = csv.writer(res_file)
            writer.writerows(results)
            res_file_path = res_file.name
        
        try:
            # Read prediction data
            with open(pred_file_path, 'r') as f:
                reader = csv.DictReader(f)
                pred_data = [
                    {
                        'gameweek': int(row['gameweek']),
                        'home_team': row['home_team'],
                        'away_team': row['away_team'],
                        'predicted_home': int(row['predicted_home']),
                        'predicted_away': int(row['predicted_away'])
                    }
                    for row in reader
                ]
            
            # Read results data
            with open(res_file_path, 'r') as f:
                reader = csv.DictReader(f)
                res_data = [
                    {
                        'gameweek': int(row['gameweek']),
                        'home_team': row['home_team'],
                        'away_team': row['away_team'],
                        'home_score': int(row['home_score']),
                        'away_score': int(row['away_score'])
                    }
                    for row in reader
                ]
            
            # Process comparison
            comparison = compare_predictions_with_results(pred_data, res_data)
            accuracy = calculate_prediction_accuracy(comparison)
            
            # Verify results
            self.assertEqual(len(comparison), 2)
            self.assertEqual(accuracy['exact_scores'], 1)
            self.assertEqual(accuracy['correct_results'], 2)
            
        finally:
            # Clean up
            os.unlink(pred_file_path)
            os.unlink(res_file_path)


if __name__ == '__main__':
    unittest.main()
