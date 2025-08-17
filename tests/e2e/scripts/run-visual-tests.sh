#!/bin/bash

# Visual Regression Testing Script for Osassy's Kitchen
# This script provides various options for running visual regression tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
MODE="test"
BROWSERS="chrome"
VIEWPORTS="all"
UPDATE_SNAPSHOTS=false
GENERATE_BASELINES=false
HEADLESS=true
DEBUG=false
PARALLEL=true

# Function to display usage
usage() {
    echo -e "${BLUE}Visual Regression Testing Script${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -m, --mode MODE           Test mode: test|baseline|update (default: test)"
    echo "  -b, --browsers BROWSERS   Browsers to test: chrome|firefox|safari|edge|all (default: chrome)"
    echo "  -v, --viewports VIEWPORTS Viewports: desktop|mobile|tablet|all (default: all)"
    echo "  -u, --update              Update existing snapshots"
    echo "  -g, --generate            Generate new baseline images"
    echo "  -h, --headed              Run tests in headed mode (with browser UI)"
    echo "  -d, --debug               Enable debug mode with verbose logging"
    echo "  -s, --sequential          Run tests sequentially (not in parallel)"
    echo "  -p, --pattern PATTERN     Run tests matching pattern (grep)"
    echo "  --help                    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all visual tests"
    echo "  $0 -m baseline -g                    # Generate baseline images"
    echo "  $0 -m update -u -p \"login\"          # Update login page snapshots"
    echo "  $0 -b chrome,firefox -v desktop      # Test desktop on Chrome and Firefox"
    echo "  $0 -h -d -p \"dashboard\"             # Debug dashboard tests in headed mode"
    echo ""
}

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--mode)
            MODE="$2"
            shift 2
            ;;
        -b|--browsers)
            BROWSERS="$2"
            shift 2
            ;;
        -v|--viewports)
            VIEWPORTS="$2"
            shift 2
            ;;
        -u|--update)
            UPDATE_SNAPSHOTS=true
            shift
            ;;
        -g|--generate)
            GENERATE_BASELINES=true
            shift
            ;;
        -h|--headed)
            HEADLESS=false
            shift
            ;;
        -d|--debug)
            DEBUG=true
            shift
            ;;
        -s|--sequential)
            PARALLEL=false
            shift
            ;;
        -p|--pattern)
            PATTERN="$2"
            shift 2
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validate mode
if [[ ! "$MODE" =~ ^(test|baseline|update)$ ]]; then
    error "Invalid mode: $MODE. Must be one of: test, baseline, update"
fi

# Build Playwright command
PLAYWRIGHT_CMD="npx playwright test"

# Add configuration file
PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --config=tests/e2e/visual.config.ts"

# Add test file
PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD tests/e2e/specs/visual/visual-regression.spec.ts"

# Handle different modes
case $MODE in
    baseline)
        log "Generating baseline images..."
        export GENERATE_BASELINES=true
        PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --grep \"Generate Baselines\""
        ;;
    update)
        log "Updating snapshots..."
        UPDATE_SNAPSHOTS=true
        ;;
    test)
        log "Running visual regression tests..."
        PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --grep -v \"Generate Baselines\""
        ;;
esac

# Add update snapshots flag
if [[ "$UPDATE_SNAPSHOTS" == true ]]; then
    PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --update-snapshots"
fi

# Add pattern if specified
if [[ -n "$PATTERN" ]]; then
    PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --grep \"$PATTERN\""
fi

# Build project list based on browsers and viewports
PROJECTS=()

# Parse browsers
IFS=',' read -ra BROWSER_ARRAY <<< "$BROWSERS"
for browser in "${BROWSER_ARRAY[@]}"; do
    case $browser in
        chrome|all)
            if [[ "$VIEWPORTS" == "all" || "$VIEWPORTS" == *"desktop"* ]]; then
                PROJECTS+=("visual-chrome-desktop")
            fi
            if [[ "$VIEWPORTS" == "all" || "$VIEWPORTS" == *"mobile"* ]]; then
                PROJECTS+=("visual-mobile")
            fi
            if [[ "$VIEWPORTS" == "all" || "$VIEWPORTS" == *"tablet"* ]]; then
                PROJECTS+=("visual-tablet")
            fi
            ;;
        firefox)
            PROJECTS+=("visual-firefox")
            ;;
        safari)
            PROJECTS+=("visual-webkit")
            ;;
        edge)
            PROJECTS+=("visual-edge")
            ;;
    esac
done

# Add projects to command
if [[ ${#PROJECTS[@]} -gt 0 ]]; then
    for project in "${PROJECTS[@]}"; do
        PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=$project"
    done
fi

# Add parallel/sequential flag
if [[ "$PARALLEL" == false ]]; then
    PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --workers=1"
fi

# Add headed/headless flag
if [[ "$HEADLESS" == false ]]; then
    PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --headed"
fi

# Add debug flags
if [[ "$DEBUG" == true ]]; then
    PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --debug"
    export DEBUG_VISUAL=true
fi

# Set environment variables
export NODE_ENV=test
export NEXT_TELEMETRY_DISABLED=1
export TZ=UTC

if [[ "$HEADLESS" == false ]]; then
    export SLOW_MO=500
fi

# Pre-flight checks
log "Performing pre-flight checks..."

# Check if npm dependencies are installed
if [[ ! -d "node_modules" ]]; then
    error "Node modules not found. Please run 'npm install' first."
fi

# Check if Playwright browsers are installed
if ! npx playwright --version > /dev/null 2>&1; then
    error "Playwright not found. Please install it with 'npm install @playwright/test'"
fi

# Check if the application is running (for non-CI environments)
if [[ -z "$CI" ]]; then
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        warn "Application not running on localhost:3000. Starting development server..."
        npm run dev &
        DEV_SERVER_PID=$!
        
        # Wait for server to start
        for i in {1..30}; do
            if curl -s http://localhost:3000 > /dev/null 2>&1; then
                log "Development server started successfully"
                break
            fi
            echo -n "."
            sleep 1
        done
        
        if [[ $i -eq 30 ]]; then
            error "Failed to start development server"
        fi
    fi
fi

# Create necessary directories
mkdir -p tests/visual-results
mkdir -p tests/reports

# Display configuration
log "Configuration:"
echo "  Mode: $MODE"
echo "  Browsers: $BROWSERS"
echo "  Viewports: $VIEWPORTS"
echo "  Projects: ${PROJECTS[*]}"
echo "  Update Snapshots: $UPDATE_SNAPSHOTS"
echo "  Generate Baselines: $GENERATE_BASELINES"
echo "  Headless: $HEADLESS"
echo "  Debug: $DEBUG"
echo "  Parallel: $PARALLEL"
if [[ -n "$PATTERN" ]]; then
    echo "  Pattern: $PATTERN"
fi
echo ""

log "Running command: $PLAYWRIGHT_CMD"
echo ""

# Run the tests
if eval "$PLAYWRIGHT_CMD"; then
    log "Visual regression tests completed successfully!"
    
    # Generate summary report
    if [[ -f "tests/reports/visual-results.json" ]]; then
        log "Generating summary report..."
        node -e "
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('tests/reports/visual-results.json', 'utf8'));
            console.log('\\n=== TEST SUMMARY ===');
            console.log(\`Total Tests: \${results.stats.total}\`);
            console.log(\`Passed: \${results.stats.passed}\`);
            console.log(\`Failed: \${results.stats.failed}\`);
            console.log(\`Skipped: \${results.stats.skipped}\`);
            console.log(\`Duration: \${Math.round(results.stats.duration / 1000)}s\`);
            
            if (results.stats.failed > 0) {
                console.log('\\n=== FAILED TESTS ===');
                results.tests.filter(t => t.status === 'failed').forEach(test => {
                    console.log(\`- \${test.title}\`);
                });
            }
        " 2>/dev/null || true
    fi
    
    # Open HTML report if not in CI
    if [[ -z "$CI" && -f "tests/reports/visual-html/index.html" ]]; then
        log "Opening HTML report..."
        if command -v open >/dev/null 2>&1; then
            open tests/reports/visual-html/index.html
        elif command -v xdg-open >/dev/null 2>&1; then
            xdg-open tests/reports/visual-html/index.html
        fi
    fi
    
    exit 0
else
    error "Visual regression tests failed!"
    exit 1
fi

# Cleanup function
cleanup() {
    if [[ -n "$DEV_SERVER_PID" ]]; then
        log "Stopping development server..."
        kill $DEV_SERVER_PID 2>/dev/null || true
    fi
}

# Set trap for cleanup
trap cleanup EXIT