# Container Management Scripts

This directory contains shell scripts for managing the Meal Plan Management Service deployment in Kubernetes/Minikube.

## Prerequisites

Before using these scripts, ensure you have the following tools installed:

- Docker
- Minikube
- kubectl
- jq
- envsubst (usually part of gettext package)

## Scripts Overview

### `deploy-container.sh`

**Purpose**: Complete deployment of the Meal Plan Management Service to Minikube
**What it does**:

- Checks prerequisites (Docker, Minikube, kubectl, jq)
- Starts Minikube and enables ingress addon if needed
- Creates namespace if it doesn't exist
- Loads environment variables from `.env.prod` (if present)
- Builds Docker image inside Minikube
- Creates/updates ConfigMap and Secret
- Deploys all Kubernetes resources (deployment, service, network policy, pod disruption budget, HPA)
- Sets up `/etc/hosts` entry for local access
- Provides access information

**Usage**: `./scripts/containerManagement/deploy-container.sh`

### `start-container.sh`

**Purpose**: Start the service (scale up to 1 replica)
**What it does**:

- Scales the deployment to 1 replica
- Waits for pods to be ready

**Usage**: `./scripts/containerManagement/start-container.sh`

### `stop-container.sh`

**Purpose**: Stop the service (scale down to 0 replicas)
**What it does**:

- Scales the deployment to 0 replicas
- Waits for pods to terminate

**Usage**: `./scripts/containerManagement/stop-container.sh`

### `update-container.sh`

**Purpose**: Update the running service with new code changes
**What it does**:

- Rebuilds Docker image with latest code
- Updates ConfigMap and Secret
- Performs rolling restart of deployment
- Waits for new pods to be ready

**Usage**: `./scripts/containerManagement/update-container.sh`

### `get-container-status.sh`

**Purpose**: Get comprehensive status of the deployment
**What it does**:

- Checks prerequisites
- Shows namespace, deployment, pod, service, and ingress status
- Displays resource usage and recent events
- Provides access information

**Usage**: `./scripts/containerManagement/get-container-status.sh`

### `cleanup-container.sh`

**Purpose**: Complete cleanup of all resources
**What it does**:

- Removes all Kubernetes resources
- Deletes namespace
- Removes `/etc/hosts` entry
- Removes Docker image from Minikube

**Usage**: `./scripts/containerManagement/cleanup-container.sh`

## Typical Workflow

1. **Initial deployment**:

   ```bash
   ./scripts/containerManagement/deploy-container.sh
   ```

2. **Check status**:

   ```bash
   ./scripts/containerManagement/get-container-status.sh
   ```

3. **Access the application**:
   - Health check: <http://sous-chef-proxy.local/api/v1/meal-plan-management/health>
   - Readiness check: <http://sous-chef-proxy.local/api/v1/meal-plan-management/ready>

4. **Update after code changes**:

   ```bash
   ./scripts/containerManagement/update-container.sh
   ```

5. **Stop service** (when needed):

   ```bash
   ./scripts/containerManagement/stop-container.sh
   ```

6. **Start service** (after stopping):

   ```bash
   ./scripts/containerManagement/start-container.sh
   ```

7. **Complete cleanup** (when done):

   ```bash
   ./scripts/containerManagement/cleanup-container.sh
   ```

## Environment Variables

The deployment script looks for a `.env.prod` file in the project root to load environment variables.
Create this file with your production environment variables if needed.

Example `.env.prod`:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database" # pragma: allowlist secret
JWT_SECRET="your-jwt-secret" # pragma: allowlist secret
NODE_ENV="production"
```

## Configuration

The scripts are configured for:

- **Namespace**: `meal-plan-management`
- **Service name**: `meal-plan-management-service`
- **Image name**: `meal-plan-management-service:latest`
- **Local domain**: `sous-chef-proxy.local`
- **Port**: `3000`

## Troubleshooting

1. **Minikube not starting**: Ensure Docker is running and you have sufficient resources
2. **Image not found**: Make sure the Docker build completed successfully
3. **Ingress not working**: Verify the ingress addon is enabled in Minikube
4. **Service not accessible**: Check if `/etc/hosts` entry exists and pods are running
5. **Permission denied**: Ensure scripts are executable (`chmod +x scripts/containerManagement/*.sh`)

## Notes

- These scripts are designed for local development with Minikube
- The Docker image is built inside Minikube's Docker daemon for efficiency
- All scripts include colored output and status indicators for better user experience
- Scripts use `set -euo pipefail` for strict error handling
