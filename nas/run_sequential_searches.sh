#!/bin/bash
set -e

echo "=== Starting Sequential NAS Searches ==="
echo "Time: $(date)"
echo ""

# Run Pure search first
echo "=== Running Pure Mode Search (50 trials) ==="
python search_processpool.py pure-full-50 \
    --mode pure \
    --trials 50 \
    --generations 200 \
    --seeds 3 \
    --population-size 300 \
    --n-workers 3 \
    --stagnation-limit 50

echo ""
echo "=== Pure search complete! ==="
echo "Time: $(date)"
echo ""

# Then run NEAT search
echo "=== Running NEAT Mode Search (50 trials) ==="
python search_processpool.py neat-full-50 \
    --mode neat \
    --trials 50 \
    --generations 200 \
    --seeds 3 \
    --population-size 300 \
    --n-workers 3 \
    --stagnation-limit 50

echo ""
echo "=== Both searches complete! ==="
echo "Time: $(date)"
