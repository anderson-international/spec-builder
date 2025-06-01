/**
 * This script helps set up environment variables for Netlify deployment
 * Run with: node scripts/setup-netlify.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

console.log(`${colors.blue}Spec-Builder - Netlify Setup Helper${colors.reset}`);
console.log('This script will help you prepare your environment variables for Netlify deployment.\n');

const requiredVars = [
  { name: 'SHOPIFY_STORE_URL', description: 'Your Shopify store URL (e.g., https://your-store.myshopify.com)' },
  { name: 'SHOPIFY_ACCESS_TOKEN', description: 'Your Shopify Admin API access token' },
  { name: 'SHOPIFY_API_VERSION', description: 'Shopify API version (e.g., 2025-01)' },
  { name: 'SHOPIFY_API_KEY', description: 'Your Shopify API key' },
  { name: 'SHOPIFY_API_SECRET_KEY', description: 'Your Shopify API secret key' },
  { name: 'DATABASE_URL', description: 'Your Neon Database connection string' },
  { name: 'NEXTAUTH_SECRET', description: 'A random string for NextAuth security (generate with: openssl rand -base64 32)' }
];

// Generate a Netlify environment variables file for manual copy-paste
const generateNetlifyEnvFile = (variables) => {
  const outputPath = path.join(__dirname, '..', 'netlify-env-variables.txt');
  
  let content = '# Netlify Environment Variables\n';
  content += '# Copy these to your Netlify site dashboard: Site settings → Build & deploy → Environment\n\n';
  
  for (const [key, value] of Object.entries(variables)) {
    content += `${key}=${value}\n`;
  }
  
  content += '\n# Don\'t forget to add NEXTAUTH_URL with your actual deployed site URL once available\n';
  content += '# NEXTAUTH_URL=https://your-netlify-site.netlify.app\n';
  
  fs.writeFileSync(outputPath, content);
  console.log(`${colors.green}Environment variables saved to:${colors.reset} netlify-env-variables.txt`);
  console.log(`${colors.yellow}IMPORTANT: This file contains sensitive information. Do not commit it to your repository.${colors.reset}`);
};

// Main function to collect variables
const collectVariables = async () => {
  const variables = {};
  
  console.log(`${colors.yellow}Please provide the following environment variables:${colors.reset}`);
  
  // Read existing variables from .env file if available
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        if (line && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length) {
            variables[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
      console.log(`${colors.green}Loaded existing variables from .env file${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.yellow}Could not read .env file: ${error.message}${colors.reset}`);
  }
  
  // Ask for each required variable
  for (const varInfo of requiredVars) {
    const defaultValue = variables[varInfo.name] || '';
    
    await new Promise(resolve => {
      rl.question(`${varInfo.name} (${varInfo.description}) ${defaultValue ? `[${defaultValue}]` : ''}: `, (answer) => {
        variables[varInfo.name] = answer || defaultValue;
        resolve();
      });
    });
  }
  
  // Generate unique NEXTAUTH_SECRET if not provided
  if (!variables.NEXTAUTH_SECRET || variables.NEXTAUTH_SECRET === '') {
    variables.NEXTAUTH_SECRET = require('crypto').randomBytes(32).toString('hex');
    console.log(`${colors.green}Generated random NEXTAUTH_SECRET${colors.reset}`);
  }
  
  return variables;
};

// Main execution
collectVariables().then(variables => {
  generateNetlifyEnvFile(variables);
  
  console.log(`\n${colors.green}Setup complete!${colors.reset}`);
  console.log('Next steps:');
  console.log('1. Copy variables from netlify-env-variables.txt to your Netlify dashboard');
  console.log('2. Set NEXTAUTH_URL to your Netlify site URL once deployed');
  console.log('3. Deploy your site using: npm run deploy');
  
  rl.close();
}).catch(error => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  rl.close();
});
