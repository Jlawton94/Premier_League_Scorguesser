"""
Test suite for advanced scoring system
"""
import unittest
import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from core.advanced_scoring_system import (
    parse_prediction_category,
    calculate_match_points,
    get_match_result,
    calculate_weekly_goals_bonus,
    generate_league_table_from_predictions,
    calculate_table_accuracy_bonus,
    SCORING_CONFIG,
    UPSET_MAPPING
)


class TestAdvancedScoringSystem(unittest.TestCase):
    """Test cases for the advanced scoring system"""

    def setUp(self):
        """Set up test data"""
        self.sample_predictions = [
            {
                'gameweek': 1,
                'home_team': 'Arsenal',
                'away_team': 'Wolves',
                'predicted_home': 2,
                'predicted_away': 1
            },
            {
                'gameweek': 1,
                'home_team': 'Liverpool',
                'away_team': 'Ipswich',
                'predicted_home': 3,
                'predicted_away': 0
            }
        ]

    def test_parse_prediction_category(self):
        """Test prediction category parsing"""
        # Test strong favorites
        team, strength = parse_prediction_category("Liverpool Strong Favorites")
        self.assertEqual(team, "Liverpool")
        self.assertEqual(strength, "Strong Favorites")
        
        # Test regular favorites
        team, strength = parse_prediction_category("Arsenal Favorites")
        self.assertEqual(team, "Arsenal")
        self.assertEqual(strength, "Favorites")
        
        # Test slight favorites
        team, strength = parse_prediction_category("Man United Slight Favorites")
        self.assertEqual(team, "Man United")
        self.assertEqual(strength, "Slight Favorites")
        
        # Test even match
        team, strength = parse_prediction_category("Even Match")
        self.assertEqual(team, "")
        self.assertEqual(strength, "Even Match")

    def test_get_match_result(self):
        """Test match result determination"""
        self.assertEqual(get_match_result(2, 1), 'H')  # Home win
        self.assertEqual(get_match_result(1, 2), 'A')  # Away win
        self.assertEqual(get_match_result(1, 1), 'D')  # Draw
        self.assertEqual(get_match_result(0, 0), 'D')  # Goalless draw

    def test_calculate_match_points_exact_score(self):
        """Test exact score calculations"""
        result = calculate_match_points(
            predicted_home=2,
            predicted_away=1,
            actual_home=2,
            actual_away=1,
            home_team="Arsenal",
            away_team="Wolves",
            match_prediction="Arsenal Favorites"
        )
        
        self.assertEqual(result['base_points'], SCORING_CONFIG['EXACT_SCORE'])
        # Exact score also gets goal difference bonus (2-1 has goal diff +1)
        expected_total = SCORING_CONFIG['EXACT_SCORE'] + SCORING_CONFIG['CORRECT_GOAL_DIFF']
        self.assertEqual(result['total_points'], expected_total)
        self.assertIn("Exact score", result['breakdown_text'][0])

    def test_calculate_match_points_correct_result(self):
        """Test correct result calculations"""
        result = calculate_match_points(
            predicted_home=2,
            predicted_away=1,
            actual_home=3,
            actual_away=0,
            home_team="Arsenal",
            away_team="Wolves",
            match_prediction="Arsenal Favorites"
        )
        
        self.assertEqual(result['base_points'], SCORING_CONFIG['CORRECT_RESULT'])
        self.assertEqual(result['total_points'], SCORING_CONFIG['CORRECT_RESULT'])
        self.assertIn("Correct result", result['breakdown_text'][0])

    def test_calculate_match_points_goal_difference_bonus(self):
        """Test goal difference bonus"""
        result = calculate_match_points(
            predicted_home=3,
            predicted_away=1,  # Goal difference +2
            actual_home=2,
            actual_away=0,     # Goal difference +2
            home_team="Arsenal",
            away_team="Wolves",
            match_prediction="Arsenal Favorites"
        )
        
        self.assertEqual(result['base_points'], SCORING_CONFIG['CORRECT_RESULT'])
        self.assertEqual(result['goal_diff_bonus'], SCORING_CONFIG['CORRECT_GOAL_DIFF'])
        expected_total = SCORING_CONFIG['CORRECT_RESULT'] + SCORING_CONFIG['CORRECT_GOAL_DIFF']
        self.assertEqual(result['total_points'], expected_total)

    def test_calculate_match_points_upset_bonus(self):
        """Test upset bonus calculations"""
        # Test predicting underdog (away team) to win against strong favorite
        result = calculate_match_points(
            predicted_home=0,
            predicted_away=2,  # Predict underdog win
            actual_home=0,
            actual_away=2,     # Underdog actually wins
            home_team="Liverpool",  # Strong favorite
            away_team="Ipswich",
            match_prediction="Liverpool Strong Favorites"
        )
        
        self.assertEqual(result['base_points'], SCORING_CONFIG['EXACT_SCORE'])
        self.assertEqual(result['upset_bonus'], SCORING_CONFIG['UPSET_STRONG'])
        # Exact score (0-2) + upset bonus + goal difference bonus (goal diff -2)
        expected_total = SCORING_CONFIG['EXACT_SCORE'] + SCORING_CONFIG['UPSET_STRONG'] + SCORING_CONFIG['CORRECT_GOAL_DIFF']
        self.assertEqual(result['total_points'], expected_total)

    def test_calculate_match_points_captain_multiplier(self):
        """Test captain multiplier"""
        result = calculate_match_points(
            predicted_home=2,
            predicted_away=1,
            actual_home=2,
            actual_away=1,
            home_team="Arsenal",
            away_team="Wolves",
            match_prediction="Arsenal Favorites",
            is_captain=True
        )
        
        self.assertEqual(result['multiplier'], SCORING_CONFIG['CAPTAIN_MULTIPLIER'])
        # For exact score (2-1), you get exact score + goal difference bonus, then captain multiplier
        expected_total = (SCORING_CONFIG['EXACT_SCORE'] + SCORING_CONFIG['CORRECT_GOAL_DIFF']) * SCORING_CONFIG['CAPTAIN_MULTIPLIER']
        self.assertEqual(result['total_points'], expected_total)

    def test_calculate_weekly_goals_bonus(self):
        """Test weekly goals bonus calculation"""
        predicted_matches = [
            {'predicted_home': 2, 'predicted_away': 1},  # 3 goals
            {'predicted_home': 1, 'predicted_away': 0},  # 1 goal
            {'predicted_home': 3, 'predicted_away': 2}   # 5 goals
        ]  # Total: 9 goals
        
        actual_matches = [
            {'actual_home': 1, 'actual_away': 2},  # 3 goals
            {'actual_home': 2, 'actual_away': 0},  # 2 goals
            {'actual_home': 2, 'actual_away': 2}   # 4 goals
        ]  # Total: 9 goals
        
        bonus = calculate_weekly_goals_bonus(predicted_matches, actual_matches)
        self.assertEqual(bonus, SCORING_CONFIG['WEEKLY_GOALS'])
        
        # Test incorrect total
        actual_matches_wrong = [
            {'actual_home': 1, 'actual_away': 2},  # 3 goals
            {'actual_home': 1, 'actual_away': 0},  # 1 goal
            {'actual_home': 2, 'actual_away': 2}   # 4 goals
        ]  # Total: 8 goals
        
        bonus = calculate_weekly_goals_bonus(predicted_matches, actual_matches_wrong)
        self.assertEqual(bonus, 0)

    def test_generate_league_table_from_predictions(self):
        """Test league table generation from predictions"""
        predictions = [
            {
                'home_team': 'Arsenal',
                'away_team': 'Wolves',
                'predicted_home': 2,
                'predicted_away': 1
            },
            {
                'home_team': 'Liverpool',
                'away_team': 'Arsenal',
                'predicted_home': 1,
                'predicted_away': 2
            }
        ]
        
        table = generate_league_table_from_predictions(predictions)
        
        # Check that all teams are included
        team_names = [team['team'] for team in table]
        self.assertIn('Arsenal', team_names)
        self.assertIn('Wolves', team_names)
        self.assertIn('Liverpool', team_names)
        
        # Check Arsenal's stats (should have 2 wins, 0 losses, 6 points)
        arsenal = next(team for team in table if team['team'] == 'Arsenal')
        self.assertEqual(arsenal['played'], 2)
        self.assertEqual(arsenal['won'], 2)
        self.assertEqual(arsenal['lost'], 0)
        self.assertEqual(arsenal['points'], 6)

    def test_calculate_table_accuracy_bonus(self):
        """Test table accuracy bonus calculation"""
        predicted_table = [
            {'team': 'Arsenal', 'position': 1},
            {'team': 'Liverpool', 'position': 2},
            {'team': 'Man City', 'position': 3}
        ]
        
        actual_table = [
            {'team': 'Arsenal', 'position': 1},  # Perfect
            {'team': 'Liverpool', 'position': 3},  # Off by 1
            {'team': 'Man City', 'position': 2}   # Off by 1
        ]
        
        result = calculate_table_accuracy_bonus(predicted_table, actual_table, max_bonus=100)
        
        self.assertGreater(result['bonus_points'], 0)
        self.assertEqual(result['exact_positions'], 1)
        self.assertEqual(result['total_variance'], 2)  # 0 + 1 + 1
        self.assertIsInstance(result['accuracy_percentage'], float)
        self.assertEqual(len(result['breakdown']), 3)

    def test_scoring_config_constants(self):
        """Test that scoring configuration constants are properly defined"""
        required_keys = [
            'EXACT_SCORE', 'CORRECT_RESULT', 'CORRECT_GOAL_DIFF',
            'UPSET_SLIGHT', 'UPSET_FAVORITE', 'UPSET_STRONG',
            'WEEKLY_GOALS', 'CAPTAIN_MULTIPLIER', 'TRIPLE_CAPTAIN_MULTIPLIER',
            'ALL_CAPTAIN_MULTIPLIER'
        ]
        
        for key in required_keys:
            self.assertIn(key, SCORING_CONFIG)
            self.assertIsInstance(SCORING_CONFIG[key], int)
            self.assertGreater(SCORING_CONFIG[key], 0)

    def test_upset_mapping(self):
        """Test upset bonus mapping"""
        expected_mappings = {
            'Strong Favorites': SCORING_CONFIG['UPSET_STRONG'],
            'Favorites': SCORING_CONFIG['UPSET_FAVORITE'],
            'Slight Favorites': SCORING_CONFIG['UPSET_SLIGHT']
        }
        
        self.assertEqual(UPSET_MAPPING, expected_mappings)


if __name__ == '__main__':
    unittest.main()
