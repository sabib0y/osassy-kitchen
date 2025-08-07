#!/bin/bash

# Stop Claude Monitor

PIDFILE="/tmp/claude-monitor.pid"

if [ ! -f "$PIDFILE" ]; then
    echo "Claude Monitor is not running"
    exit 0
fi

PID=$(cat "$PIDFILE")

if ps -p "$PID" > /dev/null 2>&1; then
    kill "$PID"
    echo "✓ Claude Monitor stopped (PID: $PID)"
    rm -f "$PIDFILE"
else
    echo "Claude Monitor was not running (stale PID file removed)"
    rm -f "$PIDFILE"
fi