#!/bin/bash

# Setup Deployment Script
# This script helps you set up GitHub Secrets for CI/CD deployment

echo "🚀 Construction Pricing Platform - Deployment Setup"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it: https://cli.github.com/"
    echo "Or manually add secrets in GitHub: Settings → Secrets and variables → Actions"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub CLI.${NC}"
    echo "Please run: gh auth login"
    exit 1
fi

echo "This script will help you set up GitHub Secrets for deployment."
echo ""
echo "Required secrets:"
echo "  1. DATABASE_URL (Supabase connection string)"
echo "  2. Backend platform secrets (Railway OR Cyclic)"
echo "  3. Vercel secrets (for frontend)"
echo ""

read -p "Do you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Database URL
echo ""
echo -e "${GREEN}📊 Step 1: Database URL (Supabase)${NC}"
echo "Get your Supabase connection string from:"
echo "  Supabase Dashboard → Settings → Database → Connection String → Connection Pooling"
echo ""
read -p "Enter DATABASE_URL: " DATABASE_URL
if [ ! -z "$DATABASE_URL" ]; then
    gh secret set DATABASE_URL --body "$DATABASE_URL"
    echo -e "${GREEN}✅ DATABASE_URL secret added${NC}"
fi

# Backend Platform
echo ""
echo -e "${GREEN}🔧 Step 2: Backend Platform${NC}"
echo "Choose your backend platform:"
echo "  1. Railway (recommended)"
echo "  2. Cyclic (no credit card required)"
read -p "Enter choice (1 or 2): " BACKEND_CHOICE

if [ "$BACKEND_CHOICE" == "1" ]; then
    echo ""
    echo "Railway Setup:"
    echo "  Get token from: Railway Dashboard → Account Settings → Tokens"
    read -p "Enter RAILWAY_TOKEN: " RAILWAY_TOKEN
    if [ ! -z "$RAILWAY_TOKEN" ]; then
        gh secret set RAILWAY_TOKEN --body "$RAILWAY_TOKEN"
        echo -e "${GREEN}✅ RAILWAY_TOKEN secret added${NC}"
    fi
    
    echo ""
    echo "Get Service ID from: Railway Dashboard → Your Service → Settings"
    read -p "Enter RAILWAY_SERVICE_ID: " RAILWAY_SERVICE_ID
    if [ ! -z "$RAILWAY_SERVICE_ID" ]; then
        gh secret set RAILWAY_SERVICE_ID --body "$RAILWAY_SERVICE_ID"
        echo -e "${GREEN}✅ RAILWAY_SERVICE_ID secret added${NC}"
    fi
elif [ "$BACKEND_CHOICE" == "2" ]; then
    echo ""
    echo "Cyclic Setup:"
    echo "  Get token from: Cyclic Dashboard → Settings → API Tokens"
    read -p "Enter CYCLIC_TOKEN: " CYCLIC_TOKEN
    if [ ! -z "$CYCLIC_TOKEN" ]; then
        gh secret set CYCLIC_TOKEN --body "$CYCLIC_TOKEN"
        echo -e "${GREEN}✅ CYCLIC_TOKEN secret added${NC}"
    fi
    
    read -p "Enter CYCLIC_APP_NAME: " CYCLIC_APP_NAME
    if [ ! -z "$CYCLIC_APP_NAME" ]; then
        gh secret set CYCLIC_APP_NAME --body "$CYCLIC_APP_NAME"
        echo -e "${GREEN}✅ CYCLIC_APP_NAME secret added${NC}"
    fi
fi

# Vercel
echo ""
echo -e "${GREEN}🎨 Step 3: Frontend (Vercel)${NC}"
echo "Get Vercel token from: Vercel Dashboard → Settings → Tokens"
read -p "Enter VERCEL_TOKEN: " VERCEL_TOKEN
if [ ! -z "$VERCEL_TOKEN" ]; then
    gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
    echo -e "${GREEN}✅ VERCEL_TOKEN secret added${NC}"
fi

echo ""
echo "Get Org ID from: Vercel Dashboard → Settings → General"
read -p "Enter VERCEL_ORG_ID: " VERCEL_ORG_ID
if [ ! -z "$VERCEL_ORG_ID" ]; then
    gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID"
    echo -e "${GREEN}✅ VERCEL_ORG_ID secret added${NC}"
fi

echo ""
echo "Get Project ID from: Vercel Dashboard → Your Project → Settings → General"
read -p "Enter VERCEL_PROJECT_ID: " VERCEL_PROJECT_ID
if [ ! -z "$VERCEL_PROJECT_ID" ]; then
    gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID"
    echo -e "${GREEN}✅ VERCEL_PROJECT_ID secret added${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Configure environment variables in your deployment platforms"
echo "  2. See .github/SECRETS_SETUP.md for details"
echo "  3. Push to main branch to trigger deployment"
echo ""

