#!/bin/bash
# Monitor parallel execution metrics during NAS search experiments

PID_FILE="$1"
OUTPUT_FILE="${2:-parallel_monitor.log}"
INTERVAL=5  # Sample every 5 seconds

if [ -z "$PID_FILE" ]; then
    echo "Usage: $0 <pid_file> [output_file]"
    echo ""
    echo "Example:"
    echo "  # Terminal 1: Run search and save PID"
    echo "  python cli.py search test -n 10 -g 50 -p 200 --n-jobs 5 & echo \$! > search.pid"
    echo ""
    echo "  # Terminal 2: Monitor"
    echo "  ./monitor_parallel.sh search.pid"
    exit 1
fi

echo "Monitoring parallel execution"
echo "PID file: $PID_FILE"
echo "Output: $OUTPUT_FILE"
echo "Interval: ${INTERVAL}s"
echo ""
echo "Waiting for PID file..."

# Wait for PID file to appear
while [ ! -f "$PID_FILE" ]; do
    sleep 1
done

MAIN_PID=$(cat "$PID_FILE")
echo "Found main process: $MAIN_PID"
echo ""

# Write header
echo "timestamp,elapsed_s,cpu_pct,mem_gb,threads,workers,trial_count" > "$OUTPUT_FILE"

START_TIME=$(date +%s)

echo "Collecting metrics... (Ctrl+C to stop)"
echo ""
printf "%-8s %-10s %-8s %-8s %-10s %-8s %-12s\n" "Elapsed" "CPU%" "Memory" "Threads" "Workers" "Trials" "Status"
printf "%-8s %-10s %-8s %-8s %-10s %-8s %-12s\n" "--------" "------" "-------" "--------" "--------" "-------" "------------"

while kill -0 "$MAIN_PID" 2>/dev/null; do
    NOW=$(date +%s)
    ELAPSED=$((NOW - START_TIME))

    # Get all python processes related to this search
    PIDS=$(pgrep -P "$MAIN_PID" || echo "")

    if [ -z "$PIDS" ]; then
        # No child processes yet, check main process
        PIDS="$MAIN_PID"
    fi

    # Count worker processes (python processes spawned by Optuna)
    WORKER_COUNT=$(echo "$PIDS" | wc -l)

    # Get total CPU usage (sum across all processes)
    CPU_TOTAL=0
    for pid in $PIDS; do
        if [ -d "/proc/$pid" ]; then
            CPU=$(ps -p "$pid" -o %cpu= 2>/dev/null || echo "0")
            CPU_TOTAL=$(echo "$CPU_TOTAL + $CPU" | bc 2>/dev/null || echo "$CPU_TOTAL")
        fi
    done

    # Get total memory (sum across all processes)
    MEM_TOTAL=0
    for pid in $PIDS; do
        if [ -d "/proc/$pid" ]; then
            MEM_KB=$(ps -p "$pid" -o rss= 2>/dev/null || echo "0")
            MEM_TOTAL=$((MEM_TOTAL + MEM_KB))
        fi
    done
    MEM_GB=$(echo "scale=2; $MEM_TOTAL / 1048576" | bc)

    # Get total thread count
    THREAD_TOTAL=0
    for pid in $PIDS; do
        if [ -d "/proc/$pid" ]; then
            THREADS=$(ps -p "$pid" -o nlwp= 2>/dev/null || echo "0")
            THREAD_TOTAL=$((THREAD_TOTAL + THREADS))
        fi
    done

    # Count completed trials (JSON files in results directory)
    TRIAL_COUNT=$(find results -name "trial_*.json" -type f 2>/dev/null | wc -l)

    # Determine status
    if (( $(echo "$CPU_TOTAL < 200" | bc -l) )); then
        STATUS="IDLE/STUCK?"
    elif (( $WORKER_COUNT > 1 )); then
        STATUS="PARALLEL"
    else
        STATUS="SEQUENTIAL"
    fi

    # Print to console
    printf "%-8s %-10.1f %-8s %-8s %-10s %-8s %-12s\n" \
        "${ELAPSED}s" \
        "$CPU_TOTAL" \
        "${MEM_GB}GB" \
        "$THREAD_TOTAL" \
        "$WORKER_COUNT" \
        "$TRIAL_COUNT" \
        "$STATUS"

    # Write to log
    TIMESTAMP=$(date +%Y-%m-%d_%H:%M:%S)
    echo "$TIMESTAMP,$ELAPSED,$CPU_TOTAL,$MEM_GB,$THREAD_TOTAL,$WORKER_COUNT,$TRIAL_COUNT" >> "$OUTPUT_FILE"

    sleep "$INTERVAL"
done

echo ""
echo "Process completed!"
echo "Metrics saved to: $OUTPUT_FILE"

# Final summary
TOTAL_TIME=$(($(date +%s) - START_TIME))
FINAL_TRIALS=$(find results -name "trial_*.json" -type f 2>/dev/null | wc -l)

echo ""
echo "Summary:"
echo "  Total time: ${TOTAL_TIME}s ($(echo "scale=1; $TOTAL_TIME / 60" | bc)min)"
echo "  Trials completed: $FINAL_TRIALS"
if [ "$FINAL_TRIALS" -gt 0 ]; then
    AVG_TIME=$(echo "scale=1; $TOTAL_TIME / $FINAL_TRIALS" | bc)
    echo "  Avg time per trial: ${AVG_TIME}s"
fi
