#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Evolution Lab Setup ===${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# --- Node.js / Frontend Setup ---
echo -e "\n${YELLOW}[1/2] Setting up frontend...${NC}"

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found.${NC}"
    echo "Install Node.js 20+ via nvm:"
    echo "  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash"
    echo "  source ~/.bashrc"
    echo "  nvm install 20"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Node.js version must be 20+. Current: $(node -v)${NC}"
    echo "Run: nvm install 20 && nvm use 20"
    exit 1
fi

echo "Node.js $(node -v) detected"
echo "Installing frontend dependencies..."
npm install
echo -e "${GREEN}Frontend setup complete.${NC}"

# --- Python / Backend Setup ---
echo -e "\n${YELLOW}[2/2] Setting up backend...${NC}"

# Check for Python 3.11+
PYTHON_CMD=""
for cmd in python3.11 python3.12 python3.13 python3; do
    if command -v $cmd &> /dev/null; then
        PY_VERSION=$($cmd -c 'import sys; print(sys.version_info.minor)')
        PY_MAJOR=$($cmd -c 'import sys; print(sys.version_info.major)')
        if [ "$PY_MAJOR" -eq 3 ] && [ "$PY_VERSION" -ge 11 ]; then
            PYTHON_CMD=$cmd
            break
        fi
    fi
done

if [ -z "$PYTHON_CMD" ]; then
    echo -e "${RED}Python 3.11+ not found.${NC}"
    echo "Install it with:"
    echo "  sudo apt update && sudo apt install python3.11 python3.11-venv python3.11-dev -y"
    exit 1
fi

echo "Using $PYTHON_CMD ($($PYTHON_CMD --version))"

cd "$SCRIPT_DIR/backend"

# Create venv if it doesn't exist
if [ ! -d "venv" ] && [ ! -L "venv" ]; then
    USE_MNT=false
    VENV_PATH="venv"

    # Check for large disk locations: /mnt/venvs, /data/venvs
    for CANDIDATE in "/mnt/venvs" "/data/venvs"; do
        PARENT_DIR=$(dirname "$CANDIDATE")

        if [ -d "$PARENT_DIR" ]; then
            AVAIL_KB=$(df "$PARENT_DIR" 2>/dev/null | tail -1 | awk '{print $4}')
            MIN_KB=$((10 * 1024 * 1024))  # 10GB in KB

            if [ -n "$AVAIL_KB" ] && [ "$AVAIL_KB" -gt "$MIN_KB" ]; then
                # Create venvs dir if it doesn't exist
                if [ ! -d "$CANDIDATE" ]; then
                    echo "Creating $CANDIDATE for large dependencies..."
                    # Remove immutable attr if present (common on Azure /mnt)
                    sudo chattr -i "$PARENT_DIR" 2>/dev/null || true
                    sudo mkdir -p "$CANDIDATE" 2>/dev/null
                    sudo chown $USER:$USER "$CANDIDATE" 2>/dev/null || true
                fi

                if [ -w "$CANDIDATE" ]; then
                    USE_MNT=true
                    VENV_PATH="$CANDIDATE/evolution-lab-backend"
                    echo "Using $CANDIDATE for venv (large disk available)..."
                    break
                fi
            fi
        fi
    done

    if [ "$USE_MNT" = true ]; then
        $PYTHON_CMD -m venv "$VENV_PATH"
        ln -s "$VENV_PATH" venv
        echo -e "${YELLOW}Note: venv is on ephemeral storage. Re-run setup if lost after VM restart.${NC}"
    else
        echo "Creating virtual environment in backend/..."
        $PYTHON_CMD -m venv venv
    fi
fi

# Activate venv and install dependencies
echo "Installing backend dependencies..."
source venv/bin/activate
pip install --upgrade pip -q
pip install -e .

echo -e "${GREEN}Backend setup complete.${NC}"

# --- Done ---
echo -e "\n${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "To run the application:"
echo ""
echo "  Frontend (terminal 1):"
echo "    npm run dev"
echo ""
echo "  Backend (terminal 2):"
echo "    cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo ""
