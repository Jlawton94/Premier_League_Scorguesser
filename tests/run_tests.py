"""
Test runner for FPL Prediction Tools
Runs all tests and generates comprehensive reports
"""
import unittest
import sys
import os
import time
from pathlib import Path
from io import StringIO

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


class TestResult:
    """Custom test result class for detailed reporting"""
    
    def __init__(self):
        self.tests_run = 0
        self.failures = []
        self.errors = []
        self.skipped = []
        self.successes = []
        self.start_time = None
        self.end_time = None
    
    def start_test(self, test):
        """Called when a test starts"""
        if self.start_time is None:
            self.start_time = time.time()
    
    def add_success(self, test):
        """Called when a test passes"""
        self.tests_run += 1
        self.successes.append(str(test))
    
    def add_error(self, test, err):
        """Called when a test has an error"""
        self.tests_run += 1
        self.errors.append((str(test), str(err[1])))
    
    def add_failure(self, test, err):
        """Called when a test fails"""
        self.tests_run += 1
        self.failures.append((str(test), str(err[1])))
    
    def add_skip(self, test, reason):
        """Called when a test is skipped"""
        self.tests_run += 1
        self.skipped.append((str(test), reason))
    
    def stop_test(self, test):
        """Called when a test ends"""
        self.end_time = time.time()


def run_test_suite():
    """Run the complete test suite"""
    print("🧪 FPL PREDICTION TOOLS - TEST SUITE")
    print("=" * 50)
    
    # Import all test modules
    test_modules = [
        'test_advanced_scoring',
        'test_data_utils', 
        'test_save_utils',
        'test_results_utils',
        'test_script_outputs'
    ]
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    print("📋 Loading test modules...")
    for module_name in test_modules:
        try:
            module = __import__(module_name, fromlist=[''])
            module_suite = loader.loadTestsFromModule(module)
            suite.addTest(module_suite)
            print(f"  ✅ {module_name}")
        except ImportError as e:
            print(f"  ❌ {module_name}: {e}")
        except Exception as e:
            print(f"  ⚠️  {module_name}: {e}")
    
    print("\n🏃 Running tests...")
    print("-" * 30)
    
    # Run tests with custom result handler
    runner = unittest.TextTestRunner(
        verbosity=2,
        stream=sys.stdout,
        buffer=True
    )
    
    start_time = time.time()
    result = runner.run(suite)
    end_time = time.time()
    
    # Generate summary report
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    total_tests = result.testsRun
    failures = len(result.failures)
    errors = len(result.errors)
    skipped = len(result.skipped)
    passed = total_tests - failures - errors - skipped
    
    print(f"🎯 Total Tests: {total_tests}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failures}")
    print(f"💥 Errors: {errors}")
    print(f"⏭️  Skipped: {skipped}")
    print(f"⏱️  Duration: {end_time - start_time:.2f}s")
    
    if passed == total_tests:
        print("\n🎉 ALL TESTS PASSED! 🎉")
        success_rate = 100.0
    else:
        success_rate = (passed / total_tests) * 100 if total_tests > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
    
    # Detailed failure/error reporting
    if result.failures:
        print("\n💥 FAILURES:")
        print("-" * 20)
        for test, traceback in result.failures:
            print(f"❌ {test}")
            print(f"   {traceback.split('AssertionError:')[-1].strip()}")
    
    if result.errors:
        print("\n🚫 ERRORS:")
        print("-" * 20)
        for test, traceback in result.errors:
            print(f"💥 {test}")
            print(f"   {traceback.split('Error:')[-1].strip()}")
    
    # Test coverage report
    print("\n📋 TEST COVERAGE BY MODULE:")
    print("-" * 30)
    module_coverage = {
        'Core System': ['test_advanced_scoring'],
        'Data Processing': ['test_data_utils', 'test_save_utils'],
        'Results Analysis': ['test_results_utils'],
        'Output Generation': ['test_script_outputs']
    }
    
    for category, modules in module_coverage.items():
        print(f"📦 {category}:")
        for module in modules:
            status = "✅" if module in [m.__name__ for m in sys.modules.values() if hasattr(m, '__name__')] else "❌"
            print(f"   {status} {module}")
    
    return result.wasSuccessful()


def run_specific_test(test_name):
    """Run a specific test module or test case"""
    print(f"🎯 Running specific test: {test_name}")
    
    try:
        # Try to import and run the specific test
        if test_name.startswith('test_'):
            module = __import__(test_name, fromlist=[''])
            loader = unittest.TestLoader()
            suite = loader.loadTestsFromModule(module)
        else:
            # Assume it's a specific test case
            suite = unittest.TestLoader().loadTestsFromName(test_name)
        
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        
        return result.wasSuccessful()
        
    except Exception as e:
        print(f"❌ Error running test {test_name}: {e}")
        return False


def validate_test_environment():
    """Validate that the test environment is properly set up"""
    print("🔍 Validating test environment...")
    
    issues = []
    
    # Check Python version
    if sys.version_info < (3, 7):
        issues.append("Python 3.7+ required")
    else:
        print(f"  ✅ Python {sys.version_info.major}.{sys.version_info.minor}")
    
    # Check that src directory exists
    src_dir = Path(__file__).parent.parent / "src"
    if not src_dir.exists():
        issues.append("src/ directory not found")
    else:
        print("  ✅ src/ directory found")
    
    # Check for test data
    test_data_dir = Path(__file__).parent / "test_data"
    if not test_data_dir.exists():
        issues.append("test_data/ directory not found")
    else:
        print("  ✅ test_data/ directory found")
    
    # Check for required test files
    required_files = [
        "test_data/sample_fixtures.csv",
        "test_data/sample_results.csv"
    ]
    
    for file_path in required_files:
        full_path = Path(__file__).parent / file_path
        if not full_path.exists():
            issues.append(f"Missing test file: {file_path}")
        else:
            print(f"  ✅ {file_path}")
    
    if issues:
        print("\n❌ Test environment issues:")
        for issue in issues:
            print(f"  - {issue}")
        return False
    
    print("  ✅ Test environment is ready!")
    return True


def main():
    """Main test runner entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='FPL Prediction Tools Test Runner')
    parser.add_argument('--test', '-t', help='Run specific test module or case')
    parser.add_argument('--validate', '-v', action='store_true', help='Validate test environment only')
    parser.add_argument('--coverage', '-c', action='store_true', help='Run with coverage report')
    
    args = parser.parse_args()
    
    if args.validate:
        validate_test_environment()
        return
    
    if not validate_test_environment():
        print("❌ Test environment validation failed. Please fix issues before running tests.")
        sys.exit(1)
    
    if args.test:
        success = run_specific_test(args.test)
    else:
        success = run_test_suite()
    
    if success:
        print("\n🎉 Test run completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please review the output above.")
        sys.exit(1)


if __name__ == '__main__':
    main()
