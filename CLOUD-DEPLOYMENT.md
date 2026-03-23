# Cloud Deployment Guide — NexMart

## Overview

This guide covers deploying the NexMart microservices platform to AWS ECS, Azure Container Apps, and Google Cloud Run.

After deployment, validate the enhanced Payment Service endpoints via Swagger:
- `GET /api/payments/history`
- `GET /api/payments/{id}/refund-status`
- `GET /api/payments/{id}/invoice`
- `POST /api/payments/methods`
- `GET /api/payments/methods/{userId}`
- `PUT /api/payments/methods/{methodId}`
- `DELETE /api/payments/methods/{methodId}`

## Prerequisites

- Docker images pushed to container registry (Docker Hub/ECR/ACR)
- Cloud account with billing enabled (use free tier)
- CLI tools installed (AWS CLI/Azure CLI/gcloud)

---

## AWS Deployment (ECS with Fargate)

### Step 1: Setup AWS CLI

```bash
# Install AWS CLI
# Windows: Download from https://aws.amazon.com/cli/
# Mac: brew install awscli
# Linux: pip install awscli

# Configure AWS CLI
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Default output format: json
```

### Step 2: Create ECR Repositories

```bash
# Create repository for each service
aws ecr create-repository --repository-name user-service --region us-east-1
aws ecr create-repository --repository-name inventory-service --region us-east-1
aws ecr create-repository --repository-name payment-service --region us-east-1
aws ecr create-repository --repository-name order-service --region us-east-1
aws ecr create-repository --repository-name frontend --region us-east-1
```

### Step 3: Push Images to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag and push images
docker tag user-service:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/user-service:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/user-service:latest

# Repeat for all services
```

### Step 4: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name nexmart-cluster --region us-east-1
```

### Step 5: Create Task Definitions

Create `user-service-task-def.json`:

```json
{
  "family": "user-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "user-service",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/user-service:latest",
      "portMappings": [
        {
          "containerPort": 8081,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "MONGODB_URI",
          "value": "YOUR_MONGODB_CONNECTION_STRING"
        },
        {
          "name": "JWT_SECRET",
          "value": "YOUR_JWT_SECRET"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/user-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition --cli-input-json file://user-service-task-def.json
```

### Step 6: Create ECS Services

```bash
# Create service
aws ecs create-service \
  --cluster nexmart-cluster \
  --service-name user-service \
  --task-definition user-service \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

### Step 7: Setup Application Load Balancer

1. Create ALB in AWS Console
2. Create target groups for each service
3. Configure listeners and rules
4. Update ECS services to use ALB

### Estimated Costs (Free Tier)

- **ECS Fargate**: First month free, then ~$15-30/month
- **ALB**: ~$16/month
- **ECR**: 500 MB free
- **CloudWatch Logs**: 5 GB free

---

## Azure Deployment (Container Apps)

### Step 1: Install Azure CLI

```bash
# Windows: Download from https://aka.ms/installazurecliwindows
# Mac: brew install azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login
```

### Step 2: Create Resource Group

```bash
az group create --name nexmart-rg --location eastus
```

### Step 3: Create Container Registry

```bash
# Create ACR
az acr create --resource-group nexmart-rg --name nexmartacr --sku Basic

# Login to ACR
az acr login --name nexmartacr
```

### Step 4: Push Images to ACR

```bash
# Tag and push
docker tag user-service:latest nexmartacr.azurecr.io/user-service:latest
docker push nexmartacr.azurecr.io/user-service:latest

# Repeat for all services
```

### Step 5: Create Container Apps Environment

```bash
az containerapp env create \
  --name nexmart-env \
  --resource-group nexmart-rg \
  --location eastus
```

### Step 6: Deploy Container Apps

```bash
# User Service
az containerapp create \
  --name user-service \
  --resource-group nexmart-rg \
  --environment nexmart-env \
  --image nexmartacr.azurecr.io/user-service:latest \
  --target-port 8081 \
  --ingress external \
  --registry-server nexmartacr.azurecr.io \
  --env-vars \
    NODE_ENV=production \
    MONGODB_URI="YOUR_MONGODB_URI" \
    JWT_SECRET="YOUR_JWT_SECRET"

# Repeat for other services
```

### Step 7: Configure Cosmos DB (MongoDB API)

```bash
# Create Cosmos DB account
az cosmosdb create \
  --name nexmart-cosmos \
  --resource-group nexmart-rg \
  --kind MongoDB \
  --server-version 4.2

# Get connection string
az cosmosdb keys list \
  --name nexmart-cosmos \
  --resource-group nexmart-rg \
  --type connection-strings
```

### Estimated Costs (Free Tier)

- **Container Apps**: Free tier: 180,000 vCPU-seconds, 360,000 GiB-seconds/month
- **Cosmos DB**: Free tier: 1000 RU/s, 25 GB storage
- **Container Registry**: Basic tier: ~$5/month

---

## Google Cloud Run

### Step 1: Install Google Cloud SDK

```bash
# Download from https://cloud.google.com/sdk/docs/install

# Initialize
gcloud init
```

### Step 2: Enable APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 3: Push Images to GCR

```bash
# Configure Docker
gcloud auth configure-docker

# Tag and push
docker tag user-service:latest gcr.io/YOUR_PROJECT_ID/user-service:latest
docker push gcr.io/YOUR_PROJECT_ID/user-service:latest
```

### Step 4: Deploy to Cloud Run

```bash
# User Service
gcloud run deploy user-service \
  --image gcr.io/YOUR_PROJECT_ID/user-service:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,MONGODB_URI=YOUR_MONGODB_URI,JWT_SECRET=YOUR_JWT_SECRET

# Repeat for other services
```

### Estimated Costs (Free Tier)

- **Cloud Run**: 2 million requests/month free
- **Container Registry**: 0.5 GB free
- **MongoDB Atlas**: Free tier M0 cluster

---

## Database Options

### MongoDB Atlas (Recommended - Free Tier)

```bash
# 1. Sign up at https://www.mongodb.com/cloud/atlas
# 2. Create free M0 cluster
# 3. Whitelist IP addresses (0.0.0.0/0 for testing)
# 4. Create database user
# 5. Get connection string
```

Connection string format:
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### AWS DocumentDB (AWS)

```bash
aws docdb create-db-cluster \
  --db-cluster-identifier nexmart-docdb \
  --engine docdb \
  --master-username admin \
  --master-user-password YourPassword123
```

### Azure Cosmos DB (Azure)

Already covered in Azure section above.

---

## Monitoring & Logging

### AWS CloudWatch

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/user-service
```

### Azure Application Insights

```bash
# Create Application Insights
az monitor app-insights component create \
  --app nexmart-insights \
  --location eastus \
  --resource-group nexmart-rg
```

### Google Cloud Logging

Automatically enabled for Cloud Run.

---

## CI/CD Integration

### GitHub Actions for AWS

```yaml
- name: Deploy to ECS
  run: |
    aws ecs update-service \
      --cluster ecommerce-cluster \
      --service user-service \
      --force-new-deployment
```

### GitHub Actions for Azure

```yaml
- name: Deploy to Azure Container Apps
  uses: azure/container-apps-deploy-action@v1
  with:
    containerAppName: user-service
    resourceGroup: ecommerce-rg
    imageToDeploy: ecommerceacr.azurecr.io/user-service:latest
```

---

## Security Best Practices

1. **Use Secrets Management**
   - AWS Secrets Manager
   - Azure Key Vault
   - Google Secret Manager

2. **Enable HTTPS**
   - AWS Certificate Manager
   - Azure Managed Certificates
   - Google-managed SSL

3. **Network Security**
   - VPC/Virtual Networks
   - Security Groups/Network Security Groups
   - Private endpoints for databases

4. **IAM Roles**
   - Principle of least privilege
   - Service-specific roles
   - No hardcoded credentials

---

## Cost Optimization

1. **Use Free Tiers**
   - Start with free tier offerings
   - Monitor usage carefully

2. **Auto-scaling**
   - Scale to zero when not in use
   - Set minimum/maximum instances

3. **Resource Sizing**
   - Start with smallest instances
   - Scale up as needed

4. **Reserved Instances** (Long-term)
   - Consider for production workloads

---

## Troubleshooting

### Service Won't Start

1. Check logs in cloud console
2. Verify environment variables
3. Check database connectivity
4. Verify container image

### Can't Connect to Database

1. Check connection string
2. Verify IP whitelist
3. Check credentials
4. Test with MongoDB Compass

### High Costs

1. Check running instances
2. Review auto-scaling settings
3. Monitor bandwidth usage
4. Check CloudWatch logs retention

---

## Next Steps

1. ✅ Choose your cloud provider
2. ✅ Set up container registry
3. ✅ Deploy services
4. ✅ Configure DNS
5. ✅ Set up monitoring
6. ✅ Enable auto-scaling
7. ✅ Configure CI/CD

## Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Azure Container Apps Docs](https://learn.microsoft.com/en-us/azure/container-apps/)
- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
