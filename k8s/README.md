# Kubernetes Deployment for Meal Plan Management Service

This directory contains Kubernetes manifests for deploying the meal-plan-management-service in a production-ready configuration.

## Overview

The deployment includes:

- **Deployment**: Application pods with security hardening, resource limits, and health checks
- **Service**: ClusterIP service for internal communication
- **ConfigMap**: Non-sensitive configuration data
- **Secret**: Sensitive configuration data (passwords, API keys)
- **NetworkPolicy**: Network security policies
- **PodDisruptionBudget**: Ensures availability during updates
- **HorizontalPodAutoscaler**: Automatic scaling based on CPU/memory usage
- **ServiceMonitor**: Prometheus monitoring configuration
- **Namespace**: Isolated namespace for the service

## Features

### Security

- Non-root user execution (UID/GID 1000)
- Read-only root filesystem
- Dropped ALL capabilities
- SecComp profile enabled
- Network policies for ingress/egress control
- Secure secret management

### Reliability

- Pod anti-affinity for high availability
- Health checks (readiness, liveness, startup probes)
- Resource requests and limits
- Graceful shutdown (30s termination grace period)
- Pod disruption budget to maintain availability

### Scalability

- Horizontal pod autoscaler (2-10 replicas)
- CPU and memory-based scaling
- Smart scaling policies with stabilization windows

### Monitoring

- Prometheus metrics endpoint
- ServiceMonitor for automatic discovery
- Health check endpoints for Kubernetes probes

## Prerequisites

1. Kubernetes cluster (1.21+)
2. Kong Gateway (managed externally)
3. cert-manager (for SSL certificates)
4. Prometheus Operator (for monitoring)
5. Metrics Server (for HPA)

## Configuration

### Environment Variables

Before deployment, you need to set the following environment variables in your shell or CI/CD system:

```bash
# Database Configuration
export DATABASE_URL="postgresql://username:password@host:5432/database" # pragma: allowlist secret
export DATABASE_HOST="postgres.database.svc.cluster.local"
export DATABASE_PORT="5432"
export DATABASE_NAME="meal_plan_management"
export DATABASE_USERNAME="meal_plan_user"
export DATABASE_PASSWORD="your-secure-password" # pragma: allowlist secret

# JWT Configuration
export JWT_SECRET="your-jwt-secret-key" # pragma: allowlist secret

# Redis Configuration
export REDIS_HOST="redis.cache.svc.cluster.local"
export REDIS_PORT="6379"
export REDIS_DB="0"
export REDIS_USER="your-redis-username"
export REDIS_PASSWORD="your-redis-password" # pragma: allowlist secret

# CORS Configuration
export CORS_ORIGINS="https://yourdomain.com,https://api.yourdomain.com"

# External Services
export RECIPE_SERVICE_URL="http://recipe-service.recipe-manager.svc.cluster.local:3000"
export USER_SERVICE_URL="http://user-service.user-management.svc.cluster.local:3000"
export RECIPE_SERVICE_API_KEY="your-recipe-service-api-key" # pragma: allowlist secret
export USER_SERVICE_API_KEY="your-user-service-api-key" # pragma: allowlist secret

# Encryption
export ENCRYPTION_KEY="your-encryption-key"
```

### Applying Templates

The ConfigMap and Secret templates use environment variable substitution. Use `envsubst` to replace variables:

```bash
# Create ConfigMap
envsubst < k8s/configmap-template.yaml | kubectl apply -f -

# Create Secret
envsubst < k8s/secret-template.yaml | kubectl apply -f -
```

## Deployment

### Quick Deployment

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Apply all configurations (after setting environment variables)
./deploy.sh
```

### Manual Deployment

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create ConfigMap and Secret (with environment variables set)
envsubst < k8s/configmap-template.yaml | kubectl apply -f -
envsubst < k8s/secret-template.yaml | kubectl apply -f -

# 3. Apply network policy (optional, if network policies are enabled)
kubectl apply -f k8s/networkpolicy.yaml

# 4. Deploy the application
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# 5. Add monitoring and scaling
kubectl apply -f k8s/servicemonitor.yaml
kubectl apply -f k8s/horizontalpodautoscaler.yaml
kubectl apply -f k8s/poddisruptionbudget.yaml
```

## Verification

### Check Deployment Status

```bash
# Check all resources
kubectl get all -n meal-plan-management

# Check pod logs
kubectl logs -n meal-plan-management -l app=meal-plan-management-service

# Check health endpoints
kubectl port-forward -n meal-plan-management svc/meal-plan-management-service 3000:3000

# Test health endpoints
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/live
```

### Monitoring Commands

```bash
# Check HPA status
kubectl get hpa -n meal-plan-management

# Check PDB status
kubectl get pdb -n meal-plan-management

# Check network policy
kubectl describe networkpolicy -n meal-plan-management
```

## Scaling

The service automatically scales based on CPU and memory usage:

- **Min replicas**: 2
- **Max replicas**: 10
- **CPU target**: 70%
- **Memory target**: 80%

Manual scaling:

```bash
kubectl scale deployment meal-plan-management-service -n meal-plan-management --replicas=5
```

## Troubleshooting

### Common Issues

1. **Pods not starting**: Check resource limits and node capacity
2. **Health checks failing**: Verify health endpoints are working
3. **Network connectivity**: Check network policies and service discovery
4. **Configuration issues**: Verify ConfigMap and Secret values

### Debug Commands

```bash
# Describe pod for events
kubectl describe pod -n meal-plan-management -l app=meal-plan-management-service

# Check resource usage
kubectl top pods -n meal-plan-management

# Check network connectivity
kubectl exec -n meal-plan-management -it deployment/meal-plan-management-service -- nslookup postgres.database.svc.cluster.local
```

## Security Considerations

1. **Secrets Management**: Use external secret management systems like HashiCorp Vault or AWS Secrets Manager in production
2. **Network Policies**: Ensure network policies are enabled in your cluster
3. **RBAC**: Implement proper role-based access control
4. **Image Scanning**: Scan container images for vulnerabilities
5. **SSL/TLS**: Use proper certificates for gateway

## Performance Tuning

1. **Resource Limits**: Adjust based on actual usage patterns
2. **Runtime Settings**: Tune Bun/Node.js memory settings if needed
3. **Database Connections**: Optimize connection pool settings
4. **Caching**: Implement Redis caching for frequently accessed data

## Updates and Rollbacks

```bash
# Rolling update
kubectl set image deployment/meal-plan-management-service \
  meal-plan-management-service=meal-plan-management-service:v2 \
  -n meal-plan-management

# Rollback
kubectl rollout undo deployment/meal-plan-management-service -n meal-plan-management

# Check rollout status
kubectl rollout status deployment/meal-plan-management-service -n meal-plan-management
```
