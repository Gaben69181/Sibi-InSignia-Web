"""
Run All Tests
=============
Script utama untuk menjalankan semua test SIBI model.
"""

import sys
from pathlib import Path
import argparse

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


def print_header():
    print("\n")
    print("╔" + "═" * 68 + "╗")
    print("║" + " " * 68 + "║")
    print("║" + " SIBI INSIGNIA MODEL - COMPLETE TEST SUITE ".center(68) + "║")
    print("║" + " " * 68 + "║")
    print("╚" + "═" * 68 + "╝")
    print()


def run_model_tests():
    """Run model loading and inference tests."""
    print("\n" + "▓" * 70)
    print(" SECTION 1: MODEL TESTS ".center(70, "▓"))
    print("▓" * 70)
    
    from test_model import run_all_tests
    return run_all_tests()


def run_api_tests():
    """Run API endpoint tests."""
    print("\n" + "▓" * 70)
    print(" SECTION 2: API TESTS ".center(70, "▓"))
    print("▓" * 70)
    
    from test_api import run_all_tests
    return run_all_tests()


def run_dataset_tests():
    """Run dataset and accuracy tests."""
    print("\n" + "▓" * 70)
    print(" SECTION 3: DATASET TESTS ".center(70, "▓"))
    print("▓" * 70)
    
    from test_dataset import run_all_tests
    return run_all_tests()


def run_visualization():
    """Run visualization."""
    print("\n" + "▓" * 70)
    print(" SECTION 4: VISUALIZATION ".center(70, "▓"))
    print("▓" * 70)
    
    from visualize_detection import main as visualize_main
    visualize_main()
    return {"Visualization": True}


def print_final_summary(all_results: dict):
    """Print final summary of all tests."""
    print("\n")
    print("╔" + "═" * 68 + "╗")
    print("║" + " FINAL TEST SUMMARY ".center(68) + "║")
    print("╠" + "═" * 68 + "╣")
    
    total_tests = 0
    passed_tests = 0
    
    for section, results in all_results.items():
        print(f"║  {section}".ljust(69) + "║")
        for test_name, passed in results.items():
            total_tests += 1
            if passed:
                passed_tests += 1
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"║      {test_name}: {status}".ljust(69) + "║")
        print("║" + " " * 68 + "║")
    
    print("╠" + "═" * 68 + "╣")
    
    pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    summary = f"Total: {passed_tests}/{total_tests} tests passed ({pass_rate:.0f}%)"
    print(f"║  {summary}".ljust(69) + "║")
    
    if passed_tests == total_tests:
        print("║" + " " * 68 + "║")
        print("║" + " 🎉 ALL TESTS PASSED! ".center(68) + "║")
    elif passed_tests >= total_tests * 0.7:
        print("║" + " " * 68 + "║")
        print("║" + " ⚠️ MOST TESTS PASSED - Review failures above ".center(68) + "║")
    else:
        print("║" + " " * 68 + "║")
        print("║" + " ❌ MANY TESTS FAILED - Review issues above ".center(68) + "║")
    
    print("╚" + "═" * 68 + "╝")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="Run SIBI Model Tests",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_all_tests.py              # Run all tests
  python run_all_tests.py --model      # Run only model tests
  python run_all_tests.py --api        # Run only API tests
  python run_all_tests.py --dataset    # Run only dataset tests
  python run_all_tests.py --visualize  # Run only visualization
        """
    )
    
    parser.add_argument("--model", action="store_true", help="Run model tests only")
    parser.add_argument("--api", action="store_true", help="Run API tests only")
    parser.add_argument("--dataset", action="store_true", help="Run dataset tests only")
    parser.add_argument("--visualize", action="store_true", help="Run visualization only")
    parser.add_argument("--no-viz", action="store_true", help="Skip visualization")
    
    args = parser.parse_args()
    
    # If no specific test selected, run all
    run_all = not (args.model or args.api or args.dataset or args.visualize)
    
    print_header()
    
    all_results = {}
    
    try:
        # Model tests
        if run_all or args.model:
            all_results["Model Tests"] = run_model_tests()
        
        # API tests
        if run_all or args.api:
            all_results["API Tests"] = run_api_tests()
        
        # Dataset tests
        if run_all or args.dataset:
            all_results["Dataset Tests"] = run_dataset_tests()
        
        # Visualization
        if (run_all and not args.no_viz) or args.visualize:
            all_results["Visualization"] = run_visualization()
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Testing interrupted by user")
        return
    except Exception as e:
        print(f"\n\n❌ Error during testing: {e}")
        return
    
    # Print final summary
    print_final_summary(all_results)


if __name__ == "__main__":
    main()

