# Spec Builder

A Next.js application for managing tobacco snuff product specifications. The application integrates with Shopify's GraphQL API and connects to a Neon PostgreSQL database.

## Purpose

Spec Builder serves as a platform for expert reviewers to create and manage specifications for tobacco snuff products. It addresses the need for trusted information about snuff products by allowing experts to document their assessments and reviews.

## Features

- User authentication with role-based access control (admin and reviewers)
  - Development mode uses simple user selection
  - Production mode planned to use JWT or NextAuth integration
- Protected routes for viewing specifications created by each reviewer
- Integration with Shopify for product information
- Mobile-friendly design for reviewer access
- Admin capabilities for managing enumeration data

## Tech Stack

- Next.js with React
- PostgreSQL (Neon Database)
- Prisma ORM
- Shopify GraphQL API
- Tailwind CSS
- Netlify for deployment

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Shopify API credentials
- Neon PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd spec-builder
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your credentials

4. Run the development server:
   ```
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `/prisma` - Database schema and migrations
- `/src/app` - Next.js application routes
- `/src/components` - Reusable React components
- `/src/lib` - Utility libraries
- `/src/styles` - Global styles

## Database Schema

The application uses a PostgreSQL database with tables for:
- Specifications
- Enumeration tables (product types, brands, grinds, etc.)
- Users and authentication

## Deployment

This application is deployed on Netlify. Deployment instructions can be found in the deployment section of the documentation.

## License

[Add your license here]
