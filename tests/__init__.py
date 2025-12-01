"""
Test suite for FPL Prediction Game System
"""
import sys
import os
from pathlib import Path

# Add src directory to path for testing
test_dir = Path(__file__).parent
src_dir = test_dir.parent / "src"
sys.path.insert(0, str(src_dir))
