#!/usr/bin/env python3

import time
import subprocess
import sys
import os
from datetime import datetime

def play_sound():
    """Play the notification sound"""
    subprocess.run(['afplay', '/System/Library/Sounds/Glass.aiff'])
    print(f"🔔 Notification played at {datetime.now().strftime('%H:%M:%S')}")

def monitor_claude():
    """Monitor for Claude's output patterns"""
    print("Claude Notifier Started - Monitoring for output completion...")
    print("Type 'notify' to manually trigger a notification")
    print("Press Ctrl+C to exit\n")
    
    last_line = ""
    quiet_counter = 0
    threshold = 30  # Number of quiet iterations before playing sound
    sound_played = False
    
    try:
        while True:
            # Check for manual trigger
            if sys.stdin in select.select([sys.stdin], [], [], 0)[0]:
                line = sys.stdin.readline().strip()
                if line.lower() == 'notify':
                    play_sound()
            
            # Simple heuristic: if nothing happens for a while after activity
            # This is a basic implementation - you can enhance it
            time.sleep(0.1)
            quiet_counter += 1
            
            # Reset counter on any input (you'd integrate this with actual monitoring)
            # For now, this is a simplified version
            
            if quiet_counter >= threshold and not sound_played:
                # Quiet period detected after activity
                play_sound()
                sound_played = True
                quiet_counter = 0
                
    except KeyboardInterrupt:
        print("\n👋 Claude Notifier stopped")
        sys.exit(0)

if __name__ == "__main__":
    # Check if we have select module for non-blocking input
    try:
        import select
    except ImportError:
        print("Installing simple monitor mode...")
        # Simpler version without select
        
        print("Claude Notifier (Simple Mode)")
        print("Run './claude-notify.py &' to run in background")
        print("The notifier will play a sound after periods of inactivity\n")
        
        try:
            inactive_count = 0
            while True:
                time.sleep(1)
                inactive_count += 1
                
                # After 3 seconds of inactivity, play sound
                if inactive_count == 3:
                    play_sound()
                    inactive_count = 0
                    # Wait before checking again
                    time.sleep(5)
                    
        except KeyboardInterrupt:
            print("\n👋 Claude Notifier stopped")
    else:
        monitor_claude()