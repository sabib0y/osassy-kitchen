#!/bin/bash

# Claude Code Output Notifier
# Monitors Claude's output and plays a notification sound when output stops

echo "Starting Claude notifier..."
echo "Press Ctrl+C to stop"

# Monitor the most recent Claude process output
# We'll watch for periods of inactivity to detect when Claude stops outputting

LAST_ACTIVITY=""
QUIET_PERIOD=2  # seconds of quiet before playing sound
SOUND_PLAYED=false

while true; do
    # Check if Claude process is active and outputting
    CLAUDE_ACTIVE=$(ps aux | grep -i "claude" | grep -v grep | grep -v "claude-notifier" | head -1)
    
    if [ -n "$CLAUDE_ACTIVE" ]; then
        # Get current timestamp
        CURRENT_TIME=$(date +%s)
        
        # Check VSCode's output (this monitors file changes in the todos directory as a proxy)
        LATEST_TODO=$(ls -t ~/.claude/todos/ 2>/dev/null | head -1)
        
        if [ "$LATEST_TODO" != "$LAST_ACTIVITY" ]; then
            # Activity detected, update last activity
            LAST_ACTIVITY="$LATEST_TODO"
            SOUND_PLAYED=false
            echo "Activity detected..."
        elif [ "$SOUND_PLAYED" = false ]; then
            # No new activity for quiet period, play sound
            sleep $QUIET_PERIOD
            # Check one more time if there's new activity
            LATEST_CHECK=$(ls -t ~/.claude/todos/ 2>/dev/null | head -1)
            if [ "$LATEST_CHECK" = "$LAST_ACTIVITY" ]; then
                afplay /System/Library/Sounds/Glass.aiff
                echo "Notification played at $(date)"
                SOUND_PLAYED=true
            fi
        fi
    fi
    
    sleep 0.5
done