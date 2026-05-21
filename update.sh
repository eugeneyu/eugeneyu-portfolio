#!/usr/bin/env bash

# -----------------------------------------------------------------------------
# GCP & LOCAL PORTFOLIO UPDATE & SYNC SCRIPT FOR EUGENE YU
# Automates: Git pull (with GITHUB_TOKEN bypass), local Docker rebuild, and GCP redeploy.
# -----------------------------------------------------------------------------

set -eo pipefail

# Color Codes for Styling
INFO='\033[0;36m'
SUCCESS='\033[0;32m'
WARNING='\033[0;33m'
ERROR='\033[0;31m'
NC='\033[0m' # No Color

echo_info() { echo -e "${INFO}[INFO]${NC} $1"; }
echo_success() { echo -e "${SUCCESS}[SUCCESS]${NC} $1"; }
echo_warning() { echo -e "${WARNING}[WARN]${NC} $1"; }
echo_error() { echo -e "${ERROR}[ERROR]${NC} $1"; exit 1; }

echo -e "\n================================================================="
echo -e " ${INFO}EUGENE YU PORTFOLIO — AUTOMATED UPDATE & SYNC ENGINE${NC}"
echo -e "=================================================================\n"

# 1. GIT SYNC (PULL REMOTE MODIFICATIONS)
echo_info "Checking local repository status..."
if [ ! -d ".git" ]; then
    echo_error "This script must be run from the root of a Git repository."
fi

# Query current branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
echo_info "Active local branch: ${CURRENT_BRANCH}"

echo_info "Pulling latest commits from GitHub..."
echo_warning "Bypassing potential stale environment tokens using Keychain auth..."

# We execute git pull bypassing the GITHUB_TOKEN environment variable to avoid 401 Unauthorized errors from IDE-injected credentials
if env -u GITHUB_TOKEN git pull origin "${CURRENT_BRANCH}"; then
    echo_success "Successfully synced local repository with GitHub."
else
    echo_error "Failed to pull changes from GitHub. Please verify network or credentials."
fi

# 2. LOCAL WORKSPACE UPDATE STATE
echo -e "\n-----------------------------------------------------------------"
echo -e " ${INFO}STEP 2: APPLY LOCAL UPDATES (DOCKER)${NC}"
echo -e "-----------------------------------------------------------------"

if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
        echo -e "Docker is active and running."
        read -p "Do you want to rebuild and run the updated site in a local Docker container? (y/N): " -r REBUILD_LOCAL
        if [[ $REBUILD_LOCAL =~ ^[Yy]$ ]]; then
            CONTAINER_NAME="eugeneyu-portfolio"
            IMAGE_NAME="eugeneyu-portfolio:latest"
            
            echo_info "Checking for existing local container '${CONTAINER_NAME}'..."
            if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
                echo_info "Stopping and removing existing local container '${CONTAINER_NAME}'..."
                docker stop "${CONTAINER_NAME}" >/dev/null 2>&1 || true
                docker rm "${CONTAINER_NAME}" >/dev/null 2>&1 || true
            fi
            
            echo_info "Rebuilding local Docker image '${IMAGE_NAME}'..."
            docker build -t "${IMAGE_NAME}" .
            
            echo_info "Launching local container on port 8080..."
            docker run -d -p 8080:8080 --name "${CONTAINER_NAME}" "${IMAGE_NAME}"
            
            echo_success "Local container is running!"
            echo_success "Open: http://localhost:8080 to test locally."
        else
            echo_info "Skipping local Docker rebuild."
        fi
    else
        echo_warning "Docker daemon is not running. Skipping local deployment options."
    fi
else
    echo_info "Docker CLI not detected. Skipping local containerization step."
fi

# 3. REMOTE DEPLOYMENT TO GCP (OPTIONAL)
echo -e "\n-----------------------------------------------------------------"
echo -e " ${INFO}STEP 3: REDEPLOY LIVE TO GOOGLE CLOUD RUN${NC}"
echo -e "-----------------------------------------------------------------"

if [ -f "deploy.sh" ]; then
    read -p "Do you want to deploy the updated codebase live to Google Cloud Run? (y/N): " -r DEPLOY_LIVE
    if [[ $DEPLOY_LIVE =~ ^[Yy]$ ]]; then
        # Ask for domain name and optional region
        read -p "Enter custom domain name (default: ey.cloud): " -r USER_DOMAIN
        DOMAIN="${USER_DOMAIN:-ey.cloud}"
        
        read -p "Enter GCP Deployment Region (default: asia-east1): " -r USER_REGION
        REGION="${USER_REGION:-asia-east1}"
        
        echo_info "Triggering automated GCP deployment script..."
        chmod +x deploy.sh
        ./deploy.sh "${DOMAIN}" "${REGION}"
    else
        echo_info "Skipping remote live deployment to GCP."
    fi
else
    echo_warning "GCP automated deployment script (deploy.sh) was not found in this folder."
fi

echo -e "\n================================================================="
echo -e " ${SUCCESS}UPDATE & SYNC PROCESS COMPLETE!${NC}"
echo -e "=================================================================\n"
