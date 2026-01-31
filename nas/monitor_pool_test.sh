#!/bin/bash

LOG_FILE="/home/azureuser/genetic-algorithm/nas/experiment_results/pool_prod_test.log"
RESULTS_DIR="/home/azureuser/genetic-algorithm/nas/results/search_pool_pool-prod-test_20260131_000119"
MONITOR_LOG="/home/azureuser/genetic-algorithm/nas/experiment_results/pool_monitor.log"

echo "=== MONITORING POOL TEST ===" | tee -a "$MONITOR_LOG"
echo "Start time: $(date)" | tee -a "$MONITOR_LOG"
echo "" | tee -a "$MONITOR_LOG"

for i in {1..30}; do
    echo "--- Minute $i: $(date) ---" | tee -a "$MONITOR_LOG"

    # Check if processes still running
    PCOUNT=$(ps aux | grep "search_processpool" | grep -v grep | wc -l)
    echo "Processes running: $PCOUNT" | tee -a "$MONITOR_LOG"

    # Check CPU usage of workers
    if [ $PCOUNT -gt 0 ]; then
        echo "Worker CPU usage:" | tee -a "$MONITOR_LOG"
        ps aux | grep "search_processpool" | grep -v grep | awk '{printf "  PID %s: %.0f%% CPU, %s mem, %s time\n", $2, $3, $4, $10}' | tee -a "$MONITOR_LOG"
    fi

    # Check trial completion
    if [ -d "$RESULTS_DIR" ]; then
        TRIAL_COUNT=$(ls "$RESULTS_DIR"/trial_*.json 2>/dev/null | wc -l)
        echo "Trials completed: $TRIAL_COUNT / 3" | tee -a "$MONITOR_LOG"

        if [ $TRIAL_COUNT -ge 3 ]; then
            echo "✅ ALL TRIALS COMPLETED!" | tee -a "$MONITOR_LOG"
            break
        fi
    fi

    # Check log tail
    echo "Recent log output:" | tee -a "$MONITOR_LOG"
    tail -3 "$LOG_FILE" 2>/dev/null | sed 's/^/  /' | tee -a "$MONITOR_LOG"

    echo "" | tee -a "$MONITOR_LOG"

    # Wait 2 minutes
    sleep 120
done

echo "=== MONITORING COMPLETE ===" | tee -a "$MONITOR_LOG"
echo "End time: $(date)" | tee -a "$MONITOR_LOG"

# Final summary
echo "" | tee -a "$MONITOR_LOG"
echo "=== FINAL STATUS ===" | tee -a "$MONITOR_LOG"
if [ -d "$RESULTS_DIR" ]; then
    FINAL_COUNT=$(ls "$RESULTS_DIR"/trial_*.json 2>/dev/null | wc -l)
    echo "Total trials completed: $FINAL_COUNT / 3" | tee -a "$MONITOR_LOG"

    if [ $FINAL_COUNT -gt 0 ]; then
        echo "Trial results:" | tee -a "$MONITOR_LOG"
        for trial in "$RESULTS_DIR"/trial_*.json; do
            if [ -f "$trial" ]; then
                FITNESS=$(grep -o '"mean_best_fitness": [0-9.]*' "$trial" | cut -d' ' -f2)
                echo "  $(basename $trial): fitness=$FITNESS" | tee -a "$MONITOR_LOG"
            fi
        done
    fi
fi
