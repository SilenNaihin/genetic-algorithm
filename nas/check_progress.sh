#!/bin/bash
# Check progress of both searches

echo "=== Pure GA Progress ==="
grep -c "completed:" experiment_results/pure_full_200.log 2>/dev/null || echo "0 trials completed"
tail -5 experiment_results/pure_full_200.log 2>/dev/null

echo ""
echo "=== NEAT Progress ==="
grep -c "completed:" experiment_results/neat_full_200.log 2>/dev/null || echo "0 trials completed"
tail -5 experiment_results/neat_full_200.log 2>/dev/null

echo ""
echo "=== Process Status ==="
ps aux | grep "search_processpool.*full-200" | grep python | wc -l | xargs echo "Running processes:"
