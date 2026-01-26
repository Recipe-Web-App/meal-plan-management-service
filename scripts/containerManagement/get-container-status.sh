#!/bin/bash
# scripts/containerManagement/get-container-status.sh

set -euo pipefail

NAMESPACE="meal-plan-management"

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status with color
print_status() {
    local status="$1"
    local message="$2"
    if [ "$status" = "ok" ]; then
        echo -e "✅ ${GREEN}$message${NC}"
    elif [ "$status" = "warning" ]; then
        echo -e "⚠️  ${YELLOW}$message${NC}"
    else
        echo -e "❌ ${RED}$message${NC}"
    fi
}

# Function to print separator
print_separator() {
    local char="${1:-─}"
    local width="${2:-$(tput cols 2>/dev/null || echo 80)}"
    printf "%*s\n" "$width" '' | tr ' ' "$char"
}

echo "📊 Meal Plan Management Service Status"
print_separator "="

# Check prerequisites
echo ""
echo -e "${CYAN}🔧 Prerequisites Check:${NC}"
if ! command_exists kubectl; then
    print_status "error" "kubectl is not installed or not in PATH"
    exit 1
else
    print_status "ok" "kubectl is available"
fi

if ! command_exists minikube; then
    print_status "warning" "minikube is not installed (may not be needed for remote clusters)"
else
    if minikube status >/dev/null 2>&1; then
        print_status "ok" "minikube is running"
    else
        print_status "warning" "minikube is not running"
    fi
fi

print_separator
echo ""
echo -e "${CYAN}🔍 Namespace Status:${NC}"
if kubectl get namespace "$NAMESPACE" >/dev/null 2>&1; then
    print_status "ok" "Namespace '$NAMESPACE' exists"
    # Get namespace details
    NAMESPACE_AGE=$(kubectl get namespace "$NAMESPACE" -o jsonpath='{.metadata.creationTimestamp}' | xargs -I {} date -d {} "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "unknown")
    RESOURCE_COUNT=$(kubectl get all -n "$NAMESPACE" --no-headers 2>/dev/null | wc -l || echo "unknown")
    echo "   📅 Created: $NAMESPACE_AGE, Resources: $RESOURCE_COUNT"
else
    print_status "error" "Namespace '$NAMESPACE' does not exist"
    echo -e "${YELLOW}💡 Run ./scripts/containerManagement/deploy-container.sh to deploy${NC}"
    exit 1
fi

print_separator
echo ""
echo -e "${CYAN}📦 Deployment Status:${NC}"
if kubectl get deployment meal-plan-management-service -n "$NAMESPACE" >/dev/null 2>&1; then
    kubectl get deployment meal-plan-management-service -n "$NAMESPACE"

    # Check deployment readiness
    READY_REPLICAS=$(kubectl get deployment meal-plan-management-service -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
    DESIRED_REPLICAS=$(kubectl get deployment meal-plan-management-service -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")

    if [ "$READY_REPLICAS" = "$DESIRED_REPLICAS" ] && [ "$READY_REPLICAS" != "0" ]; then
        print_status "ok" "Deployment is ready ($READY_REPLICAS/$DESIRED_REPLICAS replicas)"
    else
        print_status "warning" "Deployment not fully ready ($READY_REPLICAS/$DESIRED_REPLICAS replicas)"
    fi
else
    print_status "error" "Deployment not found"
fi

print_separator
echo ""
echo -e "${CYAN}🐳 Pod Status:${NC}"
if kubectl get pods -n "$NAMESPACE" -l app=meal-plan-management-service >/dev/null 2>&1; then
    kubectl get pods -n "$NAMESPACE" -l app=meal-plan-management-service

    # Get pod details
    POD_NAME=$(kubectl get pods -n "$NAMESPACE" -l app=meal-plan-management-service -o jsonpath="{.items[0].metadata.name}" 2>/dev/null || echo "")
    if [ -n "$POD_NAME" ]; then
        echo ""
        echo -e "${CYAN}📋 Pod Details:${NC}"
        kubectl describe pod "$POD_NAME" -n "$NAMESPACE" | grep -A5 -E "Conditions:|Events:" || true
    fi
else
    print_status "error" "No pods found"
fi

print_separator
echo ""
echo -e "${CYAN}🌐 Service Status:${NC}"
if kubectl get service meal-plan-management-service -n "$NAMESPACE" >/dev/null 2>&1; then
    kubectl get service meal-plan-management-service -n "$NAMESPACE"
    print_status "ok" "Service is available"
else
    print_status "error" "Service not found"
fi

print_separator
echo ""
echo -e "${CYAN}📊 HPA Status:${NC}"
if kubectl get hpa meal-plan-management-hpa -n "$NAMESPACE" >/dev/null 2>&1; then
    kubectl get hpa meal-plan-management-hpa -n "$NAMESPACE"
    print_status "ok" "HPA is configured"
else
    print_status "warning" "HPA not found"
fi

print_separator
echo ""
echo -e "${CYAN}🔐 ConfigMap and Secret Status:${NC}"
if kubectl get configmap meal-plan-management-config -n "$NAMESPACE" >/dev/null 2>&1; then
    print_status "ok" "ConfigMap exists"
else
    print_status "error" "ConfigMap not found"
fi

if kubectl get secret meal-plan-management-secrets -n "$NAMESPACE" >/dev/null 2>&1; then
    print_status "ok" "Secret exists"
else
    print_status "error" "Secret not found"
fi

print_separator
echo ""
echo -e "${CYAN}🔗 Access Information:${NC}"
if command_exists minikube && minikube status >/dev/null 2>&1; then
    MINIKUBE_IP=$(minikube ip 2>/dev/null || echo "unknown")
    echo "🔗 Minikube IP: $MINIKUBE_IP"

    if grep -q "sous-chef-proxy.local" /etc/hosts 2>/dev/null; then
        print_status "ok" "/etc/hosts entry exists for sous-chef-proxy.local"
        echo "🌍 Application URL: http://sous-chef-proxy.local/api/v1/meal-plan-management/health"
    else
        print_status "warning" "/etc/hosts entry missing. Add: $MINIKUBE_IP sous-chef-proxy.local"
    fi
fi

# Get service cluster IP
if kubectl get service meal-plan-management-service -n "$NAMESPACE" >/dev/null 2>&1; then
    SERVICE_IP=$(kubectl get service meal-plan-management-service -n "$NAMESPACE" -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "unknown")
    SERVICE_PORT=$(kubectl get service meal-plan-management-service -n "$NAMESPACE" -o jsonpath='{.spec.ports[0].port}' 2>/dev/null || echo "unknown")
    echo "🔗 Service ClusterIP: $SERVICE_IP:$SERVICE_PORT"
fi

print_separator
echo ""
echo -e "${CYAN}💾 Resource Usage:${NC}"
if kubectl top pods -n "$NAMESPACE" --no-headers 2>/dev/null | grep -q meal-plan-management-service; then
    kubectl top pods -n "$NAMESPACE" --no-headers | grep meal-plan-management-service
else
    print_status "warning" "Metrics not available (metrics-server may not be installed)"
fi

print_separator
echo ""
echo -e "${CYAN}📜 Recent Events:${NC}"
kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' --field-selector involvedObject.kind=Pod | tail -5 || print_status "warning" "No recent events found"

print_separator "="
