import { request, gql } from 'graphql-request';

// Environment variables
const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-01';

// GraphQL endpoint - include /admin/ in the path for authenticated API access
const endpoint = `${SHOPIFY_STORE_URL}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

// Headers
const headers = {
  'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN || '',
  'Content-Type': 'application/json',
};

/**
 * Fetch product titles for multiple handles in one request
 * @param handles Array of product handles to fetch
 * @returns Object mapping handles to titles
 */
export async function fetchProductTitles(handles: string[]): Promise<Record<string, string>> {
  if (!handles.length) return {};

  // Create filter query for handles
  // We'll use 'query' parameter with multiple OR conditions
  const queryString = handles.map(h => `handle:${h}`).join(' OR ');

  const query = gql`
    query GetProductTitles($queryString: String!) {
      products(first: 250, query: $queryString) {
        edges {
          node {
            handle
            title
          }
        }
      }
    }
  `;

  try {
    const data: any = await request(
      endpoint,
      query,
      { queryString },
      headers
    );

    // Transform the response to a handle -> title map
    const titleMap: Record<string, string> = {};
    if (data.products?.edges) {
      data.products.edges.forEach((edge: any) => {
        const node = edge.node;
        if (node && node.handle) {
          titleMap[node.handle] = node.title;
        }
      });
    }

    return titleMap;
  } catch (error) {
    console.error('Error fetching product titles from Shopify:', error);
    throw error;
  }
}

/**
 * Fetch available products from Shopify that don't have specifications yet
 * @param excludeHandles Array of product handles to exclude
 * @param limit Number of products to fetch
 * @returns Array of product objects
 */
export async function fetchAvailableProducts(excludeHandles: string[] = [], limit: number = 50) {
  // GraphQL query to fetch products with metafields using admin API
  const query = gql`
    query GetProducts($first: Int!) {
      products(first: $first, query: "status:active") {
        edges {
          node {
            id
            handle
            title
            vendor
            onlineStoreUrl
            featuredImage {
              url
            }
            metafield(namespace: "custom", key: "brand") {
              value
            }
            publishedAt
            updatedAt
          }
        }
      }
    }
  `;

  try {
    const data: any = await request(
      endpoint,
      query,
      {
        first: limit,
      },
      headers
    );

    // Extract products and filter out ones that are in the excludedHandles list
    const products = data.products?.edges
      .map((edge: any) => {
        const node = edge.node;
        if (excludeHandles.includes(node.handle)) {
          return null;
        }
        
        let brand = node.vendor; // Default to vendor
        
        // Try to use the metafield if available
        if (node.metafield && node.metafield.value) {
          brand = node.metafield.value;
        }
      
        return {
          id: node.id.replace('gid://shopify/Product/', ''),  // Remove the GraphQL ID prefix
          handle: node.handle,
          title: node.title,
          vendor: node.vendor,
          brand: brand,  // Use the brand we determined above
          image_url: node.featuredImage?.url || null,
          product_url: node.onlineStoreUrl,
          published_at: node.publishedAt,
          updated_at: node.updatedAt,
        };
      })
      .filter(Boolean);

    return products;
  } catch (error) {
    console.error('Error fetching products from Shopify:', error);
    throw error;
  }
}
