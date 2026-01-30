#!/bin/bash
# Monitor both production searches

echo "==================================="
echo "Production Search Monitor"
echo "==================================="
echo ""

# Check if processes are running
NEAT_PID=$(pgrep -f "neat-production-150gen")
PURE_PID=$(pgrep -f "pure-production-150gen")

if [ -n "$NEAT_PID" ]; then
    echo "✓ NEAT search running (PID: $NEAT_PID)"
else
    echo "✗ NEAT search NOT running"
fi

if [ -n "$PURE_PID" ]; then
    echo "✓ Pure search running (PID: $PURE_PID)"
else
    echo "✗ Pure search NOT running"
fi

echo ""
echo "==================================="
echo "NEAT Search Progress:"
echo "==================================="
tail -10 neat_production.log | grep -E "(Trial|Best trial|%)"

echo ""
echo "==================================="
echo "Pure Search Progress:"
echo "==================================="
tail -10 pure_production.log | grep -E "(Trial|Best trial|%)"

echo ""
echo "==================================="
echo "CPU & Memory Usage:"
echo "==================================="
echo "Active Python processes:"
ps aux | grep "python cli.py search" | grep -v grep | awk '{printf "  PID %s: CPU=%s%% MEM=%s%% (%s MB)\n", $2, $3, $4, int($6/1024)}'

echo ""
free -h | grep -E "(Mem|Swap)"

echo ""
echo "==================================="
echo "To watch continuously: watch -n 10 ./monitor_searches.sh"
echo "To follow NEAT log: tail -f neat_production.log"
echo "To follow Pure log: tail -f pure_production.log"
echo "==================================="
