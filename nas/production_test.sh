#!/bin/bash
# Production-scale test with fewer trials (faster turnaround)
# This tests the critical failure point: 500 pop, 150 gen

set -e

cd /home/azureuser/genetic-algorithm/nas

PY=/home/azureuser/genetic-algorithm/backend/venv/bin/python3
RESULTS_ROOT="./experiment_results"
mkdir -p "$RESULTS_ROOT"

echo "======================================================================"
echo "PRODUCTION SCALE TEST"
echo "======================================================================"
echo ""
echo "Configuration: 500 pop, 150 gen, 3 seeds (same as failed runs)"
echo "Trials: 3 (reduced from 10 for faster testing)"
echo "Workers: 3 (one per trial)"
echo ""
echo "Expected time:"
echo "  Sequential: 3 trials × 11.4 min/trial = 34.2 minutes"
echo "  Parallel (if working): 11.4 minutes (3x speedup)"
echo ""
echo "--------------------------------------------------------------------"

# Baseline: Test WITHOUT thread limiting
echo ""
echo "TEST 1: WITHOUT THREAD LIMITING"
echo "--------------------------------------------------------------------"
read -p "Run baseline test? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    EXP_DIR="$RESULTS_ROOT/prod_baseline_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$EXP_DIR"

    echo "Starting at: $(date)"
    echo "Results: $EXP_DIR"
    echo ""

    START_TIME=$(date +%s)

    $PY cli.py search prod-baseline -m pure -n 3 -g 150 -s 3 -p 500 --n-jobs 3 2>&1 | tee "$EXP_DIR/output.log"

    END_TIME=$(date +%s)
    ELAPSED=$((END_TIME - START_TIME))

    echo ""
    echo "Test 1 complete!"
    echo "Total time: ${ELAPSED}s ($(echo "scale=1; $ELAPSED / 60" | bc)min)"
    echo "Results: $EXP_DIR"
    echo ""

    # Quick analysis
    TRIAL_COUNT=$(find results -name "trial_*.json" 2>/dev/null | wc -l)
    AVG_TIME=$(echo "scale=1; $ELAPSED / $TRIAL_COUNT" | bc)
    echo "Trials completed: $TRIAL_COUNT"
    echo "Avg time per trial: ${AVG_TIME}s ($(echo "scale=1; $AVG_TIME / 60" | bc)min)"

    if (( $(echo "$AVG_TIME > 600" | bc -l) )); then
        echo "❌ FAILED: Sequential execution (expected ~230s per trial with 3 workers)"
    else
        echo "✅ SUCCESS: Parallel execution working!"
    fi

    # Copy results
    cp -r results/* "$EXP_DIR/" 2>/dev/null || true

    echo "$ELAPSED" > "$EXP_DIR/elapsed_seconds.txt"
fi

# Thread-limited: Test WITH thread limiting
echo ""
echo "--------------------------------------------------------------------"
echo "TEST 2: WITH THREAD LIMITING"
echo "--------------------------------------------------------------------"
read -p "Run thread-limited test? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    EXP_DIR="$RESULTS_ROOT/prod_limited_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$EXP_DIR"

    echo "Starting at: $(date)"
    echo "Results: $EXP_DIR"
    echo ""

    START_TIME=$(date +%s)

    $PY cli.py search prod-limited -m pure -n 3 -g 150 -s 3 -p 500 --n-jobs 3 --limit-threads 2>&1 | tee "$EXP_DIR/output.log"

    END_TIME=$(date +%s)
    ELAPSED=$((END_TIME - START_TIME))

    echo ""
    echo "Test 2 complete!"
    echo "Total time: ${ELAPSED}s ($(echo "scale=1; $ELAPSED / 60" | bc)min)"
    echo "Results: $EXP_DIR"
    echo ""

    # Quick analysis
    TRIAL_COUNT=$(find results -name "trial_*.json" 2>/dev/null | wc -l)
    AVG_TIME=$(echo "scale=1; $ELAPSED / $TRIAL_COUNT" | bc)
    echo "Trials completed: $TRIAL_COUNT"
    echo "Avg time per trial: ${AVG_TIME}s ($(echo "scale=1; $AVG_TIME / 60" | bc)min)"

    if (( $(echo "$AVG_TIME > 600" | bc -l) )); then
        echo "❌ FAILED: Sequential execution (expected ~230s per trial with 3 workers)"
    else
        echo "✅ SUCCESS: Parallel execution working!"
    fi

    # Copy results
    cp -r results/* "$EXP_DIR/" 2>/dev/null || true

    echo "$ELAPSED" > "$EXP_DIR/elapsed_seconds.txt"
fi

# Final comparison
echo ""
echo "======================================================================"
echo "COMPARISON"
echo "======================================================================"
echo ""

BASELINE=$(ls -td $RESULTS_ROOT/prod_baseline_* 2>/dev/null | head -1)
LIMITED=$(ls -td $RESULTS_ROOT/prod_limited_* 2>/dev/null | head -1)

if [ -n "$BASELINE" ] && [ -f "$BASELINE/elapsed_seconds.txt" ]; then
    BASELINE_TIME=$(cat "$BASELINE/elapsed_seconds.txt")
    echo "Baseline (no thread limiting): ${BASELINE_TIME}s ($(echo "scale=1; $BASELINE_TIME / 60" | bc)min)"
fi

if [ -n "$LIMITED" ] && [ -f "$LIMITED/elapsed_seconds.txt" ]; then
    LIMITED_TIME=$(cat "$LIMITED/elapsed_seconds.txt")
    echo "Limited (with --limit-threads): ${LIMITED_TIME}s ($(echo "scale=1; $LIMITED_TIME / 60" | bc)min)"
fi

if [ -n "$BASELINE_TIME" ] && [ -n "$LIMITED_TIME" ]; then
    SPEEDUP=$(echo "scale=2; $BASELINE_TIME / $LIMITED_TIME" | bc)
    IMPROVEMENT=$(echo "scale=1; ($BASELINE_TIME - $LIMITED_TIME) / $BASELINE_TIME * 100" | bc)

    echo ""
    echo "Speedup: ${SPEEDUP}x"
    echo "Improvement: ${IMPROVEMENT}%"
    echo ""

    if (( $(echo "$SPEEDUP > 1.5" | bc -l) )); then
        echo "✅ THREAD LIMITING SIGNIFICANTLY IMPROVED PERFORMANCE"
        echo ""
        echo "Root cause: Nested parallelism (PyTorch × Optuna)"
        echo "Solution: Always use --limit-threads with --n-jobs > 1"
    elif (( $(echo "$SPEEDUP > 0.9" | bc -l) )) && (( $(echo "$SPEEDUP < 1.1" | bc -l) )); then
        echo "⚠️  NO SIGNIFICANT DIFFERENCE"
        echo ""
        echo "Either both work or both fail. Need more investigation."
    else
        echo "⚠️  BASELINE WAS FASTER"
        echo ""
        echo "Thread limiting may have made things worse."
    fi
fi

echo ""
echo "======================================================================"
