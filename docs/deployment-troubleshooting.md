# Deployment Troubleshooting Guide

This document provides solutions for common issues that may occur when deploying the Spec-Builder application to Netlify.

## Common Deployment Issues

### 1. Build Failures

#### Issue: Failed during initialization
```
Failed during stage 'Reading and parsing configuration files': 
When resolving config file /opt/build/repo/netlify.toml:
Base directory does not exist
```

**Solution:**
- Ensure the base directory in your Netlify dashboard settings is blank or set to `.` (not "netlify")
- Remove any redirects section from your `netlify.toml` that might reference non-existent directories
- Verify that your package.json is in the root of the repository

#### Issue: Build command fails
```
Error: The command "npm run build" exited with code: 1
```

**Solution:**
- Check your Node.js version (should be 18+)
- Ensure all dependencies are properly installed
- Verify environment variables are correctly set in Netlify

### 2. Database Connection Issues

#### Issue: Cannot connect to database
```
Error: P1001: Can't reach database server
```

**Solution:**
- Check that your `DATABASE_URL` is correctly set in Netlify environment variables
- Ensure your Neon database allows connections from Netlify's IP ranges
- Verify that the database server is running

### 3. Shopify API Issues

#### Issue: Cannot connect to Shopify API
```
Error: Request failed with status code 401
```

**Solution:**
- Verify all Shopify environment variables are correctly set
- Check that your Shopify API key and secret are valid
- Ensure your store URL is correctly formatted

### 4. Routing Issues

#### Issue: Client-side routing doesn't work
```
404 errors when navigating to routes directly
```

**Solution:**
- Ensure the Next.js plugin is correctly configured in `netlify.toml`
- Check that your `next.config.js` is properly set up
- Verify that the publish directory is set to `.next`

## Checking Logs

1. In the Netlify dashboard, go to your site → Deploys
2. Click on the most recent deploy
3. Click "Deploy log" to see the detailed build and deployment log
4. For function logs, go to Functions → Logs

## Redeploying

If you need to redeploy after fixing issues:

1. Push your changes to your Git repository using the deploy script:
   ```
   npm run deploy
   ```

2. Or trigger a manual deploy in the Netlify dashboard:
   - Go to your site → Deploys
   - Click "Trigger deploy" → "Deploy site"

## Testing Environment Variables

To verify environment variables are correctly set:

1. Create a temporary API route that returns a sanitized version of the environment
2. Deploy and test this route
3. Remove the route after verification

## Local Debugging

Before deploying, test with Netlify CLI locally:

1. Install Netlify CLI:
   ```
   npm install -g netlify-cli
   ```

2. Run locally:
   ```
   netlify dev
   ```

This helps identify issues before deploying to production.
