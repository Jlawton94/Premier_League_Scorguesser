#!/usr/bin/env python3
"""
Update master data with actual match results, kickoff times and dates from FPL API
"""
import sys
import csv
import pandas as pd
from pathlib import Path
from datetime import datetime

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from core.fpl_api import fetch_fixture_ids, fetch_teams

def update_master_data_with_results(debug=False):
    """Update the master data CSV with actual match results, kickoff times and dates"""
    
    master_file = Path(__file__).parent.parent / 'data' / 'fixtures' / 'advanced_master_data.csv'
    
    print(f"📋 Reading master data from {master_file}...")
    
    # Read the current master data
    df = pd.read_csv(master_file)
    
    print(f"✅ Loaded {len(df)} fixtures")
    
    # Get teams data to map IDs to names
    print("🏟️ Fetching teams data...")
    teams_data = fetch_teams()
    
    # Create team ID to name mapping from API
    # The FPL API provides exact team names that match our master data format
    team_id_to_name = {}
    for team_id, team_info in teams_data.items():
        # Use the exact team name from API - it matches our master data format
        team_name = team_info.get('name', 'Unknown')
        team_id_to_name[team_id] = team_name
    
    print(f"✅ Mapped {len(team_id_to_name)} teams from API")
    
    if debug:
        print("📝 Team ID to Name mapping:")
        for team_id, name in sorted(team_id_to_name.items()):
            print(f"  {team_id:2}: {name}")
        print()
    
    # Track updates
    updates_made = 0
    kickoff_updates = 0
    
    # Get unique gameweeks that have data
    gameweeks = sorted(df['Gameweek'].unique())
    
    for gw in gameweeks:
        print(f"\n🔍 Checking Gameweek {gw}...")
        
        try:
            # Convert to regular Python int to avoid numpy int64 issues
            gw_int = int(gw)
            
            # Fetch fixtures for this gameweek
            api_fixtures = fetch_fixture_ids(gw_int)
            
            # Create lookup for API fixtures by teams
            api_lookup = {}
            for fixture in api_fixtures:
                home_id = fixture.get('team_h')
                away_id = fixture.get('team_a')
                
                # Get team names
                home_name = team_id_to_name.get(home_id, 'Unknown')
                away_name = team_id_to_name.get(away_id, 'Unknown')
                
                key = (home_name, away_name)
                api_lookup[key] = fixture
            
            # Update master data for this gameweek (preserve original order)
            gw_mask = df['Gameweek'] == gw
            gw_rows = df[gw_mask]
            
            for idx, row in gw_rows.iterrows():
                home_team = row['Home Team']
                away_team = row['Away Team']
                
                key = (home_team, away_team)
                
                if key in api_lookup:
                    fixture = api_lookup[key]
                    
                    # Update kickoff time and date if available
                    kickoff_time = fixture.get('kickoff_time')
                    if kickoff_time:
                        try:
                            # Parse the kickoff time (format: "2024-01-01T15:00:00Z")
                            kickoff_dt = datetime.fromisoformat(kickoff_time.replace('Z', '+00:00'))
                            
                            # Update Date and Kickoff columns
                            df.at[idx, 'Date'] = kickoff_dt.strftime('%Y-%m-%d')
                            df.at[idx, 'Kickoff'] = kickoff_dt.strftime('%H:%M')
                            
                            kickoff_updates += 1
                            
                            if debug:
                                print(f"  🕐 Updated kickoff: {home_team} vs {away_team} - {kickoff_dt.strftime('%Y-%m-%d %H:%M')}")
                                
                        except Exception as e:
                            if debug:
                                print(f"  ⚠️ Error parsing kickoff time for {home_team} vs {away_team}: {e}")
                    
                    # Check if match is finished and update scores
                    if fixture.get('finished', False):
                        home_score = fixture.get('team_h_score')
                        away_score = fixture.get('team_a_score')
                        
                        if home_score is not None and away_score is not None:
                            # Convert scores to integers to avoid float storage
                            home_score_int = int(home_score)
                            away_score_int = int(away_score)
                            
                            # Update the dataframe
                            df.at[idx, 'Actual Home'] = home_score_int
                            df.at[idx, 'Actual Away'] = away_score_int
                            df.at[idx, 'Finished'] = True
                            
                            updates_made += 1
                            print(f"  ✅ {home_team} {home_score_int}-{away_score_int} {away_team}")
                else:
                    print(f"  ⚠️ No API match found for {home_team} vs {away_team}")
                    
        except Exception as e:
            print(f"  ❌ Error fetching GW {gw}: {e}")
    
    print(f"\n📊 Update Summary:")
    print(f"  Total fixtures: {len(df)}")
    print(f"  Kickoff times updated: {kickoff_updates}")
    print(f"  Results updated: {updates_made}")
    
    if updates_made > 0 or kickoff_updates > 0:
        # Convert score columns to nullable integer type before saving
        df['Actual Home'] = df['Actual Home'].astype('Int64')
        df['Actual Away'] = df['Actual Away'].astype('Int64')
        
        # Save the updated master data
        df.to_csv(master_file, index=False)
        print(f"✅ Updated master data saved to {master_file}")
    else:
        print("ℹ️ No new data to update")
    
    return updates_made + kickoff_updates

if __name__ == "__main__":
    update_master_data_with_results()
