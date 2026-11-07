"""
run_all_tests.py - Master Automated Test Runner for Deliverable #7 (User's Manual of the System)
Executes all 4 test tiers (Feature Coverage, Boundary/Corner, Cross-Feature Lifecycle, Acceptance)
and produces structured summary metrics and exit codes.
"""
import sys
import os
import time
import argparse
import unittest
from io import StringIO

# Add parent directory to path so tests package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tests.conftest import get_inspector, DEFAULT_PDF_CANDIDATES
from tests.test_tier1_feature_coverage import TestTier1FeatureCoverage
from tests.test_tier2_boundary_corner import TestTier2BoundaryCorner
from tests.test_tier3_cross_feature import TestTier3CrossFeature
from tests.test_tier4_acceptance import TestTier4Acceptance

TIER_SUITES = [
    ("Tier 1: Feature Coverage", TestTier1FeatureCoverage),
    ("Tier 2: Boundary & Corner Cases", TestTier2BoundaryCorner),
    ("Tier 3: Cross-Feature Lifecycle Workflows", TestTier3CrossFeature),
    ("Tier 4: Real-World Acceptance Scenarios", TestTier4Acceptance),
]

def run_suite(pdf_path=None):
    if pdf_path:
        os.environ['GTRAMS_MANUAL_PDF'] = os.path.abspath(pdf_path)

    print("=" * 80)
    print("  G-TRAMS DELIVERABLE #7: AUTOMATED E2E TEST SUITE")
    print("  Target Deliverable: User's Manual of the System (PDF)")
    print("=" * 80)

    try:
        inspector = get_inspector(pdf_path)
        print(f"Target PDF Path : {inspector.pdf_path}")
        print(f"File Size       : {inspector.file_size_bytes:,} bytes ({(inspector.file_size_bytes / 1024 / 1024):.2f} MB)")
        print(f"Page Count      : {inspector.page_count} pages")
        print(f"Total Text Len  : {len(inspector.get_full_text()):,} characters")
    except Exception as e:
        print(f"FATAL: Unable to load target PDF: {e}")
        return False

    print("-" * 80)
    print(f"{'Tier / Test Suite':<45} | {'Run':<5} | {'Pass':<5} | {'Fail':<5} | {'Status'}")
    print("-" * 80)

    total_run = 0
    total_passed = 0
    total_failed = 0
    total_errors = 0
    tier_results = []
    failure_details = []

    start_time = time.time()

    loader = unittest.TestLoader()
    for tier_name, test_class in TIER_SUITES:
        suite = loader.loadTestsFromTestCase(test_class)
        stream = StringIO()
        runner = unittest.TextTestRunner(stream=stream, verbosity=0)
        res = runner.run(suite)

        run_count = res.testsRun
        err_count = len(res.errors)
        fail_count = len(res.failures)
        pass_count = run_count - (err_count + fail_count)

        total_run += run_count
        total_passed += pass_count
        total_failed += fail_count
        total_errors += err_count

        status = "PASS" if (err_count + fail_count) == 0 else "FAIL"
        tier_results.append((tier_name, run_count, pass_count, fail_count + err_count, status))

        print(f"{tier_name:<45} | {run_count:<5} | {pass_count:<5} | {fail_count + err_count:<5} | {status}")

        if res.failures:
            for test_case, trace in res.failures:
                failure_details.append((tier_name, test_case.id(), trace))
        if res.errors:
            for test_case, trace in res.errors:
                failure_details.append((tier_name, test_case.id(), trace))

    elapsed = time.time() - start_time
    print("-" * 80)
    overall_status = "ALL TESTS PASSED (100% COMPLIANT)" if (total_failed + total_errors) == 0 else "TEST SUITE FAILED (DEFECTS DETECTED)"
    print(f"{'TOTAL / OVERALL':<45} | {total_run:<5} | {total_passed:<5} | {total_failed + total_errors:<5} | {overall_status}")
    print(f"Execution Duration: {elapsed:.2f} seconds")
    print("=" * 80)

    if failure_details:
        print("\nFAILURE DIAGNOSTICS & DEFECT REPORT:")
        print("=" * 80)
        for i, (tier, test_id, trace) in enumerate(failure_details, 1):
            print(f"[{i}] [{tier}] {test_id}")
            # Show first few lines of trace
            lines = [l for l in trace.splitlines() if l.strip()]
            for l in lines[-4:]:
                print(f"    {l}")
            print("-" * 80)

    return (total_failed + total_errors) == 0

def main():
    parser = argparse.ArgumentParser(description="Run G-TRAMS Deliverable #7 E2E Test Suite")
    parser.add_argument("--pdf", help="Explicit path to target PDF deliverable", default=None)
    args = parser.parse_args()

    success = run_suite(args.pdf)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
