# NexMart \u2014 CI/CD Setup Guide

## Prerequisites

1. **GitHub Repository**: Make your repository public
2. **Docker Hub Account**: For container registry
3. **Snyk Account**: For security scanning (free tier)
4. **SonarCloud Account**: For code quality (free for public repos)

## Step 1: GitHub Secrets Setup

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### Required Secrets

- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password/token
- `SNYK_TOKEN`: Your Snyk API token
- `SONAR_TOKEN`: Your SonarCloud token

### For AWS Deployment (Optional)

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

### For Azure Deployment (Optional)

- `AZURE_CREDENTIALS`
- `AZURE_REGISTRY_LOGIN_SERVER`
- `AZURE_REGISTRY_USERNAME`
- `AZURE_REGISTRY_PASSWORD`

## Step 2: Setup Snyk

1. Go to https://snyk.io/
2. Sign up with GitHub
3. Go to Account Settings → API Token
4. Copy your token
5. Add to GitHub Secrets as `SNYK_TOKEN`

## Step 3: Setup SonarCloud

1. Go to https://sonarcloud.io/
2. Sign up with GitHub
3. Import your repository
4. Go to My Account → Security → Generate Token
5. Add to GitHub Secrets as `SONAR_TOKEN`

## Step 4: Create Workflow Files

The following workflows are already created in `.github/workflows/`:

- `user-service.yml` - User service CI/CD
- `frontend.yml` - Frontend CI/CD

You can copy and adapt these for other services:

```bash
# Copy for other services
cp .github/workflows/user-service.yml .github/workflows/inventory-service.yml
cp .github/workflows/user-service.yml .github/workflows/payment-service.yml
cp .github/workflows/user-service.yml .github/workflows/order-service.yml
```

Then update paths in each file:
- Change `backend/user-service` to appropriate service name
- Update Docker image names

## Step 5: Test CI/CD

### Push Changes

```bash
git add .
git commit -m "Add CI/CD workflows"
git push origin main
```

### Monitor Workflows

1. Go to GitHub repository
2. Click "Actions" tab
3. Watch workflows run
4. Check for any failures

## Step 6: Docker Hub Setup

1. Create repositories on Docker Hub:
   - `your-username/user-service`
   - `your-username/inventory-service`
   - `your-username/payment-service`
   - `your-username/order-service`
   - `your-username/frontend`

2. Or let the workflow create them automatically

## Workflow Features

### What Each Workflow Does

1. **Test Stage**
   - Runs on every push and PR
   - Installs dependencies
   - Runs tests (if available)
   - Checks code quality

2. **Security Stage**
   - Runs Snyk vulnerability scan
   - Runs SonarCloud code analysis
   - Fails if critical issues found

3. **Build Stage**
   - Only runs if tests and security pass
   - Builds Docker image
   - Pushes to Docker Hub
   - Uses layer caching for speed

4. **Deploy Stage** (Template)
   - Only runs on main branch
   - Ready for AWS ECS/Azure deployment
   - Commented out - customize for your needs

5. **Post-Deploy Smoke Tests** (Recommended)
  - Verify `http://<payment-service-host>/api-docs` is reachable
  - Verify new payment APIs respond (`/api/payments/history`, `/api/payments/methods/:userId`, `/api/payments/:id/invoice`)

## Environment-Specific Deployments

### Development Branch

```yaml
on:
  push:
    branches: [develop]
```

Will only run on develop branch pushes.

### Production Branch

```yaml
on:
  push:
    branches: [main]
```

Will only run on main branch pushes.

## Manual Deployment Trigger

Add to workflow:

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: true
        default: 'staging'
```

Then you can manually trigger from GitHub Actions tab.

## Deployment Examples

### AWS ECS Deployment

Add to deploy job:

```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v2
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1

- name: Deploy to ECS
  run: |
    aws ecs update-service \
      --cluster my-cluster \
      --service user-service \
      --force-new-deployment
```

### Azure Container Apps

```yaml
- name: Azure Login
  uses: azure/login@v1
  with:
    creds: ${{ secrets.AZURE_CREDENTIALS }}

- name: Deploy to Azure Container Apps
  uses: azure/container-apps-deploy-action@v1
  with:
    containerAppName: user-service
    resourceGroup: my-resource-group
    imageToDeploy: ${{ secrets.DOCKER_USERNAME }}/user-service:latest
```

## Monitoring Deployments

### GitHub Actions Dashboard

- View all workflow runs
- See logs for each step
- Debug failures
- Manually re-run workflows

### Notifications

Add Slack/Discord notifications:

```yaml
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Deployment failed!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Best Practices

1. **Branch Protection**
   - Require PR reviews
   - Require status checks to pass
   - Enforce linear history

2. **Security**
   - Never commit secrets
   - Use GitHub Secrets
   - Rotate tokens regularly
   - Enable Dependabot

3. **Performance**
   - Use Docker layer caching
   - Run tests in parallel
   - Cache dependencies

4. **Monitoring**
   - Set up notifications
   - Monitor deployment metrics
   - Track build times

## Troubleshooting

### Workflow Fails on First Run

- Check GitHub Secrets are set correctly
- Verify Docker Hub permissions
- Check SonarCloud/Snyk tokens

### Docker Push Fails

- Verify Docker Hub credentials
- Check repository exists
- Ensure username is correct

### Security Scan Fails

- Check Snyk token is valid
- Review vulnerability threshold
- Fix reported issues

## Next Steps

1. ✅ Set up GitHub Secrets
2. ✅ Create workflow files for all services
3. ✅ Push to GitHub
4. ✅ Verify workflows run successfully
5. ✅ Set up cloud deployment
6. ✅ Configure production environment
7. ✅ Enable monitoring and alerts

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Hub](https://hub.docker.com/)
- [Snyk Documentation](https://docs.snyk.io/)
- [SonarCloud Documentation](https://docs.sonarcloud.io/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/)
