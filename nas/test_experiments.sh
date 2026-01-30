#!/bin/bash
# Systematic experiments to understand parallel execution failure
# Run these in order, analyze results, then proceed to next experiment

set -e

RESULTS_ROOT="/home/azureuser/genetic-algorithm/nas/experiment_results"
mkdir -p "$RESULTS_ROOT"

# =============================================================================
# EXPERIMENT 4: Thread Limiting (Test nested parallelism hypothesis)
# =============================================================================

experiment4_baseline() {
    echo "======================================================================"
    echo "EXPERIMENT 4A: BASELINE (no thread limiting)"
    echo "======================================================================"
    echo ""
    echo "Test: 10 trials, 500 pop, 150 gen, 3 seeds, 5 workers"
    echo "Expected if working: ~3.8 hours (11.4 min/trial ÷ 5 workers)"
    echo "Expected if broken: 8+ hours (sequential execution)"
    echo ""
    read -p "Press Enter to start (or Ctrl+C to cancel)..."

    cd /home/azureuser/genetic-algorithm/nas

    EXP_DIR="$RESULTS_ROOT/exp4a_baseline_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$EXP_DIR"

    # Use backend venv Python
    PY=/home/azureuser/genetic-algorithm/backend/venv/bin/python3

    # Start monitoring in background
    $PY cli.py search exp4a-baseline -m pure -n 10 -g 150 -s 3 -p 500 --n-jobs 5 > "$EXP_DIR/output.log" 2>&1 &
    SEARCH_PID=$!
    echo $SEARCH_PID > "$EXP_DIR/search.pid"

    # Monitor
    ./monitor_parallel.sh "$EXP_DIR/search.pid" "$EXP_DIR/metrics.csv"

    # Copy results
    cp -r results/* "$EXP_DIR/" 2>/dev/null || true

    echo ""
    echo "Results saved to: $EXP_DIR"
    echo ""
}

experiment4_limited() {
    echo "======================================================================"
    echo "EXPERIMENT 4B: THREAD LIMITING"
    echo "======================================================================"
    echo ""
    echo "Test: 10 trials, 500 pop, 150 gen, 3 seeds, 5 workers"
    echo "Change: Force single-threaded PyTorch (OMP_NUM_THREADS=1)"
    echo "Hypothesis: If this fixes it, nested parallelism was the root cause"
    echo ""
    read -p "Press Enter to start (or Ctrl+C to cancel)..."

    cd /home/azureuser/genetic-algorithm/nas

    EXP_DIR="$RESULTS_ROOT/exp4b_limited_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$EXP_DIR"

    # Use backend venv Python
    PY=/home/azureuser/genetic-algorithm/backend/venv/bin/python3

    # Start with thread limiting
    $PY cli.py search exp4b-limited -m pure -n 10 -g 150 -s 3 -p 500 --n-jobs 5 --limit-threads > "$EXP_DIR/output.log" 2>&1 &
    SEARCH_PID=$!
    echo $SEARCH_PID > "$EXP_DIR/search.pid"

    # Monitor
    ./monitor_parallel.sh "$EXP_DIR/search.pid" "$EXP_DIR/metrics.csv"

    # Copy results
    cp -r results/* "$EXP_DIR/" 2>/dev/null || true

    echo ""
    echo "Results saved to: $EXP_DIR"
    echo ""
}

compare_exp4() {
    echo "======================================================================"
    echo "EXPERIMENT 4: ANALYSIS"
    echo "======================================================================"
    echo ""

    BASELINE=$(ls -td $RESULTS_ROOT/exp4a_baseline_* 2>/dev/null | head -1)
    LIMITED=$(ls -td $RESULTS_ROOT/exp4b_limited_* 2>/dev/null | head -1)

    if [ -z "$BASELINE" ] || [ -z "$LIMITED" ]; then
        echo "Error: Could not find experiment results"
        echo "Run experiment4_baseline and experiment4_limited first"
        return 1
    fi

    echo "Baseline (no thread limiting): $BASELINE"
    echo "Limited (single-threaded):     $LIMITED"
    echo ""

    # Compare key metrics
    echo "BASELINE METRICS:"
    if [ -f "$BASELINE/metrics.csv" ]; then
        # Get final values
        FINAL_LINE=$(tail -1 "$BASELINE/metrics.csv")
        echo "  $FINAL_LINE" | awk -F',' '{printf "  Time: %ss, CPU: %.1f%%, Threads: %s, Workers: %s, Trials: %s\n", $2, $3, $5, $6, $7}'

        # Check if truly parallel
        AVG_CPU=$(awk -F',' 'NR>1 {sum+=$3; count++} END {if(count>0) print sum/count; else print 0}' "$BASELINE/metrics.csv")
        echo "  Average CPU usage: ${AVG_CPU}%"

        if (( $(echo "$AVG_CPU < 300" | bc -l) )); then
            echo "  ❌ FAILED: Sequential execution (expected 500%+ for 5 workers)"
        else
            echo "  ✅ SUCCESS: Parallel execution detected"
        fi
    fi
    echo ""

    echo "LIMITED METRICS:"
    if [ -f "$LIMITED/metrics.csv" ]; then
        FINAL_LINE=$(tail -1 "$LIMITED/metrics.csv")
        echo "  $FINAL_LINE" | awk -F',' '{printf "  Time: %ss, CPU: %.1f%%, Threads: %s, Workers: %s, Trials: %s\n", $2, $3, $5, $6, $7}'

        AVG_CPU=$(awk -F',' 'NR>1 {sum+=$3; count++} END {if(count>0) print sum/count; else print 0}' "$LIMITED/metrics.csv")
        echo "  Average CPU usage: ${AVG_CPU}%"

        if (( $(echo "$AVG_CPU < 300" | bc -l) )); then
            echo "  ❌ FAILED: Sequential execution (expected 500%+ for 5 workers)"
        else
            echo "  ✅ SUCCESS: Parallel execution detected"
        fi
    fi
    echo ""

    # Conclusion
    echo "CONCLUSION:"
    BASELINE_CPU=$(awk -F',' 'NR>1 {sum+=$3; count++} END {if(count>0) print sum/count; else print 0}' "$BASELINE/metrics.csv")
    LIMITED_CPU=$(awk -F',' 'NR>1 {sum+=$3; count++} END {if(count>0) print sum/count; else print 0}' "$LIMITED/metrics.csv")

    IMPROVEMENT=$(echo "scale=1; ($LIMITED_CPU - $BASELINE_CPU) / $BASELINE_CPU * 100" | bc)

    if (( $(echo "$LIMITED_CPU > 400" | bc -l) )) && (( $(echo "$BASELINE_CPU < 300" | bc -l) )); then
        echo "  ✅ THREAD LIMITING FIXED IT!"
        echo "  Root cause: Nested parallelism (PyTorch × Optuna)"
        echo "  CPU improvement: ${IMPROVEMENT}%"
        echo ""
        echo "  Recommendation: Always use --limit-threads with --n-jobs > 1"
    elif (( $(echo "$BASELINE_CPU > 400" | bc -l) )) && (( $(echo "$LIMITED_CPU > 400" | bc -l) )); then
        echo "  ⚠️  BOTH WORK: Parallelism already working"
        echo "  Root cause was something else (or already fixed)"
    else
        echo "  ❌ NEITHER WORKS: Thread limiting did not fix the issue"
        echo "  Need to try Experiment 1 (Ray backend) or Experiment 2 (Process Pool)"
    fi
    echo ""
}

# =============================================================================
# MAIN MENU
# =============================================================================

show_menu() {
    echo ""
    echo "======================================================================"
    echo "PARALLEL EXECUTION EXPERIMENTS"
    echo "======================================================================"
    echo ""
    echo "Experiment 4: Thread Limiting (Test nested parallelism hypothesis)"
    echo "  4a) Run baseline (no thread limiting)"
    echo "  4b) Run with thread limiting (--limit-threads)"
    echo "  4c) Compare results and analyze"
    echo ""
    echo "  q) Quit"
    echo ""
}

main() {
    while true; do
        show_menu
        read -p "Select experiment: " choice

        case $choice in
            4a) experiment4_baseline ;;
            4b) experiment4_limited ;;
            4c) compare_exp4 ;;
            q|Q) echo "Exiting..."; exit 0 ;;
            *) echo "Invalid choice" ;;
        esac
    done
}

# Run menu if called directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main
fi
