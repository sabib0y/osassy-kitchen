#!/bin/bash

# Start Claude Monitor in background

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MONITOR_SCRIPT="$SCRIPT_DIR/claude-monitor.sh"
PIDFILE="/tmp/claude-monitor.pid"

# Check if monitor exists
if [ ! -f "$MONITOR_SCRIPT" ]; then
    echo "Error: claude-monitor.sh not found"
    exit 1
fi

# Check if already running
if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "✓ Claude Monitor is already running (PID: $PID)"
        exit 0
    fi
fi

# Start the monitor
echo "Starting Claude Monitor..."
nohup "$MONITOR_SCRIPT" > /dev/null 2>&1 &

sleep 1

# Verify it started
if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE")
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "✓ Claude Monitor started successfully (PID: $PID)"
        echo "  • Monitor log: /tmp/claude-monitor.log"
        echo "  • To stop: kill $PID"
    else
        echo "✗ Failed to start Claude Monitor"
        exit 1
    fi
else
    echo "✗ Failed to start Claude Monitor"
    exit 1
fi