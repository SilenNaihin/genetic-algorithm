#!/bin/bash
# Check progress by counting actual result files

echo "=== Pure GA Progress ==="
pure_dir=$(ls -td results/search_pool_pure-full-200_* 2>/dev/null | head -1)
if [ -n "$pure_dir" ]; then
    count=$(ls "$pure_dir"/trial_*.json 2>/dev/null | wc -l)
    echo "$count/200 trials completed"
    if [ "$count" -gt 0 ]; then
        echo "Latest: $(ls -t "$pure_dir"/trial_*.json | head -1 | xargs stat -c %y | cut -d. -f1)"
        best=$(jq -s 'max_by(.mean_best_fitness) | {trial: .trial_id, fitness: .mean_best_fitness}' "$pure_dir"/trial_*.json 2>/dev/null)
        echo "Best so far: $best"
    fi
else
    echo "No results yet"
fi

echo ""
echo "=== NEAT Progress ==="
neat_dir=$(ls -td results/search_pool_neat-full-200_* 2>/dev/null | head -1)
if [ -n "$neat_dir" ]; then
    count=$(ls "$neat_dir"/trial_*.json 2>/dev/null | wc -l)
    echo "$count/200 trials completed"
    if [ "$count" -gt 0 ]; then
        echo "Latest: $(ls -t "$neat_dir"/trial_*.json | head -1 | xargs stat -c %y | cut -d. -f1)"
        best=$(jq -s 'max_by(.mean_best_fitness) | {trial: .trial_id, fitness: .mean_best_fitness}' "$neat_dir"/trial_*.json 2>/dev/null)
        echo "Best so far: $best"
    fi
else
    echo "No results yet"
fi

echo ""
echo "=== Process Status ==="
ps aux | grep "search_processpool.*full-200" | grep python | grep -v grep | wc -l | xargs echo "Running processes:"

echo ""
echo "=== Time Estimates ==="
if [ -n "$pure_dir" ]; then
    pure_count=$(ls "$pure_dir"/trial_*.json 2>/dev/null | wc -l)
    if [ "$pure_count" -gt 0 ]; then
        remaining=$((200 - pure_count))
        echo "Pure GA: $remaining trials remaining (~$(($remaining * 4))  minutes at current rate)"
    fi
fi
if [ -n "$neat_dir" ]; then
    neat_count=$(ls "$neat_dir"/trial_*.json 2>/dev/null | wc -l)
    if [ "$neat_count" -gt 0 ]; then
        remaining=$((200 - neat_count))
        echo "NEAT: $remaining trials remaining (~$(($remaining * 4)) minutes at current rate)"
    fi
fi
