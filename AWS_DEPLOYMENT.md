# AWS Deployment Guide for My Diary App

This guide provides step-by-step instructions for deploying the My Diary app to various AWS services.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI installed and configured
- Docker (for containerized deployments)
- Git repository with your code

## Option 1: AWS Amplify (Recommended for Beginners)

AWS Amplify is the easiest way to deploy Next.js applications to AWS.

### Step 1: Prepare Your Repository

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Ensure your repository contains:
   - `package.json` with build scripts
   - `next.config.ts` with proper configuration
   - All source files

### Step 2: Deploy with Amplify

1. **Sign in to AWS Amplify Console**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"

2. **Connect Repository**
   - Choose your Git provider
   - Select your repository and branch
   - Click "Next"

3. **Configure Build Settings**
   - Amplify will auto-detect Next.js
   - Build settings should be:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

4. **Deploy**
   - Click "Save and deploy"
   - Wait for build to complete (5-10 minutes)

### Step 3: Configure Custom Domain (Optional)

1. In Amplify Console, go to "Domain management"
2. Add your custom domain
3. Configure DNS settings as instructed

## Option 2: AWS Elastic Beanstalk

### Step 1: Prepare Application

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Create deployment package:**
   ```bash
   zip -r diary-app.zip . -x "node_modules/*" ".git/*" ".next/*"
   ```

### Step 2: Deploy to Elastic Beanstalk

1. **Via AWS Console:**
   - Go to [Elastic Beanstalk Console](https://console.aws.amazon.com/elasticbeanstalk/)
   - Click "Create application"
   - Choose "Web server environment"
   - Platform: Node.js
   - Upload your zip file
   - Configure environment variables if needed

2. **Via AWS CLI:**
   ```bash
   aws elasticbeanstalk create-application-version \
     --application-name my-diary-app \
     --version-label v1.0.0 \
     --source-bundle S3Bucket="your-bucket",S3Key="diary-app.zip"

   aws elasticbeanstalk create-environment \
     --application-name my-diary-app \
     --environment-name my-diary-prod \
     --solution-stack-name "64bit Amazon Linux 2 v5.8.0 running Node.js 18"
   ```

## Option 3: AWS ECS with Fargate (Containerized)

### Step 1: Build and Push Docker Image

1. **Build the Docker image:**
   ```bash
   docker build -t my-diary-app .
   ```

2. **Tag for ECR:**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com
   docker tag my-diary-app:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/my-diary-app:latest
   ```

3. **Push to ECR:**
   ```bash
   docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/my-diary-app:latest
   ```

### Step 2: Create ECS Cluster and Service

1. **Create ECS Cluster:**
   ```bash
   aws ecs create-cluster --cluster-name my-diary-cluster
   ```

2. **Create Task Definition:**
   ```json
   {
     "family": "my-diary-task",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::your-account-id:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "my-diary-app",
         "image": "your-account-id.dkr.ecr.us-east-1.amazonaws.com/my-diary-app:latest",
         "portMappings": [
           {
             "containerPort": 3000,
             "protocol": "tcp"
           }
         ],
         "essential": true,
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/my-diary-task",
             "awslogs-region": "us-east-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

3. **Create ECS Service:**
   ```bash
   aws ecs create-service \
     --cluster my-diary-cluster \
     --service-name my-diary-service \
     --task-definition my-diary-task:1 \
     --desired-count 2 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-12345,subnet-67890],securityGroups=[sg-12345],assignPublicIp=ENABLED}"
   ```

## Option 4: AWS Lambda with API Gateway (Serverless)

### Step 1: Configure Next.js for Serverless

Update `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  output: 'export', // For static export
  // OR
  experimental: {
    serverComponentsExternalPackages: ['@aws-sdk/client-dynamodb']
  }
};
```

### Step 2: Deploy with Serverless Framework

1. **Install Serverless Framework:**
   ```bash
   npm install -g serverless
   ```

2. **Create serverless.yml:**
   ```yaml
   service: my-diary-app
   
   provider:
     name: aws
     runtime: nodejs18.x
     region: us-east-1
   
   functions:
     app:
       handler: server.handler
       events:
         - http:
             path: /{proxy+}
             method: ANY
   ```

3. **Deploy:**
   ```bash
   serverless deploy
   ```

## Environment Variables

Set these environment variables in your AWS deployment:

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
# Add any other environment variables your app needs
```

## SSL/TLS Configuration

### For Amplify:
- SSL certificate is automatically provisioned
- Custom domains get free SSL certificates

### For Other Services:
- Use AWS Certificate Manager (ACM) to request SSL certificates
- Configure load balancers to use HTTPS
- Set up redirects from HTTP to HTTPS

## Monitoring and Logging

### CloudWatch Logs
- All deployments automatically log to CloudWatch
- Set up log groups and retention policies

### Application Monitoring
- Consider using AWS X-Ray for tracing
- Set up CloudWatch alarms for metrics

## Cost Optimization

### Amplify:
- Free tier: 1,000 build minutes/month
- Pay per build minute after free tier

### ECS Fargate:
- Pay only for resources used
- Use Spot instances for non-critical workloads

### Lambda:
- Pay per request and execution time
- Free tier: 1M requests/month

## Security Best Practices

1. **IAM Roles:** Use least privilege principle
2. **VPC:** Deploy in private subnets when possible
3. **Secrets:** Use AWS Secrets Manager for sensitive data
4. **WAF:** Enable Web Application Firewall for public-facing apps
5. **Backup:** Set up automated backups for data

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check build logs in AWS Console
   - Verify all dependencies are in package.json
   - Ensure Node.js version compatibility

2. **Runtime Errors:**
   - Check CloudWatch logs
   - Verify environment variables
   - Test locally with production build

3. **Performance Issues:**
   - Enable caching (CloudFront for Amplify)
   - Optimize images and assets
   - Monitor resource usage

## Support

For AWS-specific issues:
- AWS Documentation: https://docs.aws.amazon.com/
- AWS Support: https://aws.amazon.com/support/

For application-specific issues:
- Check the application logs
- Review the README.md file
- Create an issue in the repository
