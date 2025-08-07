#!/bin/bash

# Claude Output Monitor - Detects when Claude finishes outputting in any terminal
# Runs in background and plays notification sound

PIDFILE="/tmp/claude-monitor.pid"
LOGFILE="/tmp/claude-monitor.log"
SOUND="/System/Library/Sounds/Glass.aiff"

# Function to cleanup on exit
cleanup() {
    echo "$(date): Stopping Claude Monitor" >> "$LOGFILE"
    rm -f "$PIDFILE"
    exit 0
}

# Check if already running
if [ -f "$PIDFILE" ]; then
    OLD_PID=$(cat "$PIDFILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "Claude Monitor is already running (PID: $OLD_PID)"
        echo "To stop it, run: kill $OLD_PID"
        exit 1
    else
        rm -f "$PIDFILE"
    fi
fi

# Start monitoring
echo $$ > "$PIDFILE"
trap cleanup EXIT INT TERM

echo "$(date): Claude Monitor started (PID: $$)" >> "$LOGFILE"
echo "Claude Monitor started in background (PID: $$)"
echo "To stop: kill $$ or rm $PIDFILE"

# Monitor Claude processes
declare -A CLAUDE_ACTIVITY
QUIET_THRESHOLD=2  # seconds of quiet before notification

monitor_claude() {
    while true; do
        # Find all Claude processes
        while IFS= read -r line; do
            if [[ -n "$line" ]]; then
                PID=$(echo "$line" | awk '{print $2}')
                
                # Track CPU usage to detect activity
                CPU_USAGE=$(ps -p "$PID" -o %cpu= 2>/dev/null | tr -d ' ')
                
                if [[ -n "$CPU_USAGE" ]]; then
                    CURRENT_TIME=$(date +%s)
                    
                    # Check if this is a new process or existing one
                    if [[ -z "${CLAUDE_ACTIVITY[$PID]}" ]]; then
                        # New Claude instance detected
                        CLAUDE_ACTIVITY[$PID]="$CURRENT_TIME:active:0"
                        echo "$(date): New Claude instance detected (PID: $PID)" >> "$LOGFILE"
                    else
                        # Parse previous state
                        IFS=':' read -r LAST_TIME LAST_STATE NOTIFIED <<< "${CLAUDE_ACTIVITY[$PID]}"
                        
                        # Determine current state based on CPU usage
                        if (( $(echo "$CPU_USAGE > 1.0" | bc -l) )); then
                            # Claude is active
                            CLAUDE_ACTIVITY[$PID]="$CURRENT_TIME:active:0"
                        else
                            # Claude is idle
                            if [[ "$LAST_STATE" == "active" ]]; then
                                # Just became idle
                                CLAUDE_ACTIVITY[$PID]="$CURRENT_TIME:idle:0"
                            elif [[ "$LAST_STATE" == "idle" && "$NOTIFIED" == "0" ]]; then
                                # Check if quiet period exceeded
                                TIME_DIFF=$((CURRENT_TIME - LAST_TIME))
                                if [[ $TIME_DIFF -ge $QUIET_THRESHOLD ]]; then
                                    # Play notification
                                    afplay "$SOUND" 2>/dev/null &
                                    echo "$(date): Notification played for PID $PID" >> "$LOGFILE"
                                    CLAUDE_ACTIVITY[$PID]="$CURRENT_TIME:idle:1"
                                fi
                            fi
                        fi
                    fi
                fi
            fi
        done < <(ps aux | grep -i "claude" | grep -v grep | grep -v "claude-monitor")
        
        # Clean up terminated processes
        for PID in "${!CLAUDE_ACTIVITY[@]}"; do
            if ! ps -p "$PID" > /dev/null 2>&1; then
                unset CLAUDE_ACTIVITY[$PID]
                echo "$(date): Claude instance terminated (PID: $PID)" >> "$LOGFILE"
            fi
        done
        
        sleep 0.5
    done
}

# Run the monitor
monitor_claude