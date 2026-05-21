#!/usr/bin/env bash

# -----------------------------------------------------------------------------
# GCP AUTOMATED DEPLOYMENT SCRIPT FOR EUGENE YU PORTFOLIO
# Automates: API activation, Container Build, Cloud Run, GCLB, SSL & Cloud DNS.
# -----------------------------------------------------------------------------

set -eo pipefail

# Color Codes for Styling
INFO='\033[0;36m'
SUCCESS='\033[0;32m'
WARNING='\033[0;33m'
ERROR='\033[0;31m'
NC='\033[0m' # No Color

# Helper Functions
echo_info() { echo -e "${INFO}[INFO]${NC} $1"; }
echo_success() { echo -e "${SUCCESS}[SUCCESS]${NC} $1"; }
echo_warning() { echo -e "${WARNING}[WARN]${NC} $1"; }
echo_error() { echo -e "${ERROR}[ERROR]${NC} $1"; exit 1; }

# Usage Guidance
usage() {
    echo "Usage: $0 <domain-name> [gcp-region]"
    echo "Example: $0 ey.cloud asia-east1"
    exit 1
}

# Check Input Arguments
if [ -z "$1" ]; then
    usage
fi

DOMAIN="$1"
REGION="${2:-asia-east1}"
REPO_NAME="portfolio-repo"
IMAGE_NAME="site"
SERVICE_NAME="portfolio-service"
NEG_NAME="portfolio-neg"
BACKEND_NAME="portfolio-backend"
URL_MAP_NAME="portfolio-url-map"
CERT_NAME="portfolio-cert"
PROXY_NAME="portfolio-https-proxy"
RULE_NAME="portfolio-https-rule"
IP_NAME="portfolio-lb-ip"

# 1. VERIFY TOOLS & ENVIRONMENT
echo_info "Verifying prerequisites..."
command -v gcloud >/dev/null 2>&1 || echo_error "Google Cloud SDK (gcloud) is required. Please install it."
command -v docker >/dev/null 2>&1 || echo_error "Docker is required for container builds. Please start Docker."

PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo_error "No active Google Cloud project configured. Run 'gcloud config set project <PROJECT_ID>' first."
fi

echo_success "Active GCP Project: ${PROJECT_ID}"
echo_success "Target Region: ${REGION}"
echo_success "Custom Domain: ${DOMAIN}"

# 2. ENABLE GCP APIs
echo_info "Activating required Google Cloud service APIs..."
gcloud services enable \
    artifactregistry.googleapis.com \
    run.googleapis.com \
    compute.googleapis.com \
    dns.googleapis.com \
    --quiet

# 3. CONFIGURE DOCKER ARTIFACT REGISTRY
REGISTRY_HOST="${REGION}-docker.pkg.dev"
FULL_IMAGE_TAG="${REGISTRY_HOST}/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"

echo_info "Verifying Artifact Registry repository..."
if ! gcloud artifacts repositories describe "${REPO_NAME}" --location="${REGION}" >/dev/null 2>&1; then
    echo_info "Creating Artifact Registry: ${REPO_NAME} in region ${REGION}..."
    gcloud artifacts repositories create "${REPO_NAME}" \
        --repository-format=docker \
        --location="${REGION}" \
        --description="Docker repository for personal portfolio" \
        --quiet
else
    echo_success "Artifact Registry repository already exists."
fi

# Authenticate local Docker daemon
echo_info "Configuring Docker credential helper..."
gcloud auth configure-docker "${REGISTRY_HOST}" --quiet

# 4. CONTAINER BUILD & PUSH
echo_info "Building production container image: ${FULL_IMAGE_TAG}..."
docker build -t "${FULL_IMAGE_TAG}" .

echo_info "Pushing image to Artifact Registry..."
docker push "${FULL_IMAGE_TAG}"
echo_success "Image pushed successfully!"

# 5. SERVERLESS CLOUD RUN DEPLOYMENT
echo_info "Deploying service to Google Cloud Run (LB Ingress Restriction)..."
gcloud run deploy "${SERVICE_NAME}" \
    --image="${FULL_IMAGE_TAG}" \
    --region="${REGION}" \
    --port=8080 \
    --ingress=internal-and-cloud-load-balancing \
    --allow-unauthenticated \
    --quiet

echo_success "Cloud Run container deployed successfully."

# 6. GLOBAL HTTP(S) LOAD BALANCER CONFIGURATION
echo_info "Setting up Global External Load Balancer network infrastructure..."

# A. Reserve Static IP Address
if ! gcloud compute addresses describe "${IP_NAME}" --global >/dev/null 2>&1; then
    echo_info "Reserving global static IP: ${IP_NAME}..."
    gcloud compute addresses create "${IP_NAME}" --global --quiet
else
    echo_success "Global static IP already reserved."
fi
LB_IP=$(gcloud compute addresses describe "${IP_NAME}" --global --format="value(address)")
echo_success "Load Balancer Static IP reserved: ${LB_IP}"

# B. Create Serverless Network Endpoint Group (NEG)
if ! gcloud compute network-endpoint-groups describe "${NEG_NAME}" --region="${REGION}" >/dev/null 2>&1; then
    echo_info "Creating Serverless Network Endpoint Group..."
    gcloud compute network-endpoint-groups create "${NEG_NAME}" \
        --region="${REGION}" \
        --network-endpoint-type=serverless \
        --cloud-run-service="${SERVICE_NAME}" \
        --quiet
else
    echo_success "Serverless NEG already exists."
fi

# C. Setup Backend Service
if ! gcloud compute backend-services describe "${BACKEND_NAME}" --global >/dev/null 2>&1; then
    echo_info "Creating Global Backend Service..."
    gcloud compute backend-services create "${BACKEND_NAME}" \
        --global \
        --load-balancing-scheme=EXTERNAL_MANAGED \
        --quiet

    echo_info "Attaching Serverless NEG backend..."
    gcloud compute backend-services add-backend "${BACKEND_NAME}" \
        --global \
        --network-endpoint-group="${NEG_NAME}" \
        --network-endpoint-group-region="${REGION}" \
        --quiet
else
    echo_success "Global Backend Service already configured."
fi

# D. Setup URL Map Routing
if ! gcloud compute url-maps describe "${URL_MAP_NAME}" --global >/dev/null 2>&1; then
    echo_info "Creating URL Map routing configuration..."
    gcloud compute url-maps create "${URL_MAP_NAME}" \
        --default-service="${BACKEND_NAME}" \
        --quiet
else
    echo_success "URL Map routing already configured."
fi

# E. Google-Managed SSL Certificate
if ! gcloud compute ssl-certificates describe "${CERT_NAME}" --global >/dev/null 2>&1; then
    echo_info "Creating Google-managed SSL Certificate for ${DOMAIN}..."
    gcloud compute ssl-certificates create "${CERT_NAME}" \
        --domains="${DOMAIN}" \
        --global \
        --quiet
else
    echo_warning "Managed SSL Certificate already exists. Updating domain is not supported automatically, verify details."
fi

# F. Target HTTPS Proxy
if ! gcloud compute target-https-proxies describe "${PROXY_NAME}" --global >/dev/null 2>&1; then
    echo_info "Creating target HTTPS Proxy with SSL Certificate..."
    gcloud compute target-https-proxies create "${PROXY_NAME}" \
        --url-map="${URL_MAP_NAME}" \
        --ssl-certificates="${CERT_NAME}" \
        --quiet
else
    echo_success "Target HTTPS Proxy already configured."
fi

# G. Global Forwarding Rule
if ! gcloud compute forwarding-rules describe "${RULE_NAME}" --global >/dev/null 2>&1; then
    echo_info "Creating global forwarding rule for HTTPS (Port 443)..."
    gcloud compute forwarding-rules create "${RULE_NAME}" \
        --global \
        --target-https-proxy="${PROXY_NAME}" \
        --ports=443 \
        --address="${IP_NAME}" \
        --quiet
else
    echo_success "Global Forwarding Rule already configured."
fi

# 7. AUTOMATED CLOUD DNS A-RECORD RESOLUTION
echo_info "Attempting to locate Cloud DNS Managed Zone matching ${DOMAIN}..."

# Query managed-zones for a matching DNS name (e.g., matching "ey.cloud.")
ZONE_NAME=$(gcloud dns managed-zones list --filter="dnsName:${DOMAIN}." --format="value(name)" | head -n 1)

if [ -n "${ZONE_NAME}" ]; then
    echo_success "Found matching Cloud DNS Managed Zone: ${ZONE_NAME}"
    
    # Check if record already exists, if so we update, else we create
    if gcloud dns record-sets list --zone="${ZONE_NAME}" --name="${DOMAIN}." --type="A" --format="value(name)" | grep -q "${DOMAIN}"; then
        echo_info "Updating existing DNS A record set to resolve ${DOMAIN} -> ${LB_IP}..."
        gcloud dns record-sets update "${DOMAIN}." \
            --zone="${ZONE_NAME}" \
            --type="A" \
            --ttl=300 \
            --rrdatas="${LB_IP}" \
            --quiet
    else
        echo_info "Creating new DNS A record set to resolve ${DOMAIN} -> ${LB_IP}..."
        gcloud dns record-sets create "${DOMAIN}." \
            --zone="${ZONE_NAME}" \
            --type="A" \
            --ttl=300 \
            --rrdatas="${LB_IP}" \
            --quiet
    fi
    echo_success "Cloud DNS record updated."
else
    echo_warning "No Cloud DNS Managed Zone found with DNS name: ${DOMAIN}."
    echo_warning "Please manually navigate to your external DNS manager and create an A record:"
    echo "  * Name: ${DOMAIN}"
    echo "  * Type: A"
    echo "  * Value: ${LB_IP}"
fi

echo -e "\n================================================================="
echo -e " ${SUCCESS}DEPLOYMENT ORCHESTRATION COMPLETE!${NC}"
echo -e "================================================================="
echo -e " Load Balancer IP: ${LB_IP}"
echo -e " Custom Domain:    https://${DOMAIN}"
echo -e " Status:           SSL is provisioning. This may take up to 30 mins."
echo -e "=================================================================\n"
