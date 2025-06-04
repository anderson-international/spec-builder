import { gql, request } from 'graphql-request';

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

// Type definition for product batch response
interface ProductBatchResponse {
  products: any[];
  nextCursor?: string;
  hasNextPage: boolean;
}

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
 * Fetch products by specific handles
 * @param handles Array of product handles to fetch
 * @returns Array of product objects
 */
export async function fetchProductsByHandles(handles: string[]) {
  if (!handles.length) return [];
  
  // Create filter query for handles
  const queryString = handles.map(h => `handle:${h}`).join(' OR ');
  
  // GraphQL query to fetch products with metafields using admin API
  const query = gql`
    query GetProductsByHandles($queryString: String!) {
      products(first: 250, query: $queryString) {
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
            metafield(namespace: "custom", key: "brands") {
              value
              type
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
      { queryString },
      headers
    );
    
    // Process the response similar to fetchAvailableProducts
    const products = data.products?.edges
      .map((edge: any) => {
        const node = edge.node;
        
        // Get brand from custom.brands metafield - no fallback to vendor
        if (!node.metafield || !node.metafield.value) {
          console.warn(`Product '${node.title}' is missing required custom.brands metafield`);
          return null;
        }
        
        // Parse the brand value based on metafield type
        let brand;
        try {
          // Handle list.single_line_text_field type specifically
          if (node.metafield.type === 'list.single_line_text_field') {
            // This will be a JSON array of strings
            const parsed = JSON.parse(node.metafield.value);
            
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Use the first value in the list
              brand = parsed[0];
            } else {
              console.warn(`Product '${node.title}' has empty brands list`);
              return null;
            }
          }
          // If it's any other JSON type, try to parse it
          else if (node.metafield.type === 'json_string' || 
              node.metafield.value.startsWith('[') || 
              node.metafield.value.startsWith('{')) {
            
            const parsed = JSON.parse(node.metafield.value);
            
            // Handle array case (take first value)
            if (Array.isArray(parsed)) {
              brand = parsed[0] || '';
            } 
            // Handle object case
            else if (typeof parsed === 'object' && parsed !== null) {
              // If it has a name or value property, use that
              brand = parsed.name || parsed.value || parsed.brand || '';
            }
            // Handle primitive value
            else {
              brand = String(parsed);
            }
          } else {
            // Use as simple string
            brand = node.metafield.value;
          }
        } catch (err) {
          console.warn(`Product '${node.title}' has malformed custom.brands metafield (parsing error)`);
          return null;
        }
        
        if (!brand) {
          console.warn(`Product '${node.title}' has invalid custom.brands metafield format`);
          return null;
        }

        return {
          id: node.id.replace('gid://shopify/Product/', ''),  // Remove the GraphQL ID prefix
          handle: node.handle,
          title: node.title,
          vendor: node.vendor,
          brand: brand,  // Use the brand we determined above
          featuredImage: node.featuredImage ? { url: node.featuredImage.url } : null,
          onlineStoreUrl: node.onlineStoreUrl,
        };
      })
      .filter(Boolean);

    return products;
  } catch (error) {
    console.error('Error fetching products by handles from Shopify:', error);
    throw error;
  }
}

/**
 * Fetch a batch of products with cursor-based pagination
 * @param cursor Optional cursor for pagination
 * @param limit Number of products to fetch per batch
 * @returns Object with products array, next cursor, and hasNextPage flag
 */
export async function fetchProductsBatch(cursor?: string, limit: number = 25): Promise<ProductBatchResponse> {
  // GraphQL query to fetch products with cursor-based pagination
  const query = gql`
    query GetProductsBatch($limit: Int!, $cursor: String) {
      products(first: $limit, after: $cursor) {
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
            metafield(namespace: "custom", key: "brands") {
              value
              type
            }
            publishedAt
            updatedAt
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;
  
  try {
    const data: any = await request(
      endpoint,
      query,
      { limit, cursor },
      headers
    );
    
    // Extract and process products
    const products = data.products?.edges
      .map((edge: any) => {
        const node = edge.node;
        
        // Get brand from custom.brands metafield - no fallback to vendor
        if (!node.metafield || !node.metafield.value) {
          console.warn(`Product '${node.title}' is missing required custom.brands metafield`);
          return null;
        }
        
        // Parse the brand value based on metafield type
        let brand;
        try {
          // Handle list.single_line_text_field type specifically
          if (node.metafield.type === 'list.single_line_text_field') {
            // This will be a JSON array of strings
            const parsed = JSON.parse(node.metafield.value);
            
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Use the first value in the list
              brand = parsed[0];
            } else {
              console.warn(`Product '${node.title}' has empty brands list`);
              return null;
            }
          }
          // If it's any other JSON type, try to parse it
          else if (node.metafield.type === 'json_string' || 
              node.metafield.value.startsWith('[') || 
              node.metafield.value.startsWith('{')) {
            
            const parsed = JSON.parse(node.metafield.value);
            
            // Handle array case (take first value)
            if (Array.isArray(parsed)) {
              brand = parsed[0] || '';
            } 
            // Handle object case
            else if (typeof parsed === 'object' && parsed !== null) {
              // If it has a name or value property, use that
              brand = parsed.name || parsed.value || parsed.brand || '';
            }
            // Handle primitive value
            else {
              brand = String(parsed);
            }
          } else {
            // Use as simple string
            brand = node.metafield.value;
          }
        } catch (err) {
          console.warn(`Product '${node.title}' has malformed custom.brands metafield (parsing error)`);
          return null;
        }
        
        if (!brand) {
          console.warn(`Product '${node.title}' has invalid custom.brands metafield format`);
          return null;
        }

        return {
          id: node.id.replace('gid://shopify/Product/', ''),  // Remove the GraphQL ID prefix
          handle: node.handle,
          title: node.title,
          vendor: node.vendor,
          brand: brand,  // Use the brand we determined above
          featuredImage: node.featuredImage ? { url: node.featuredImage.url } : null,
          onlineStoreUrl: node.onlineStoreUrl,
        };
      })
      .filter(Boolean);
    
    // Extract pagination info
    const pageInfo = data.products?.pageInfo || {};
    const nextCursor = pageInfo.hasNextPage ? pageInfo.endCursor : undefined;
    
    return {
      products,
      nextCursor,
      hasNextPage: !!pageInfo.hasNextPage
    };
  } catch (error) {
    console.error('Error fetching product batch from Shopify:', error);
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
            metafield(namespace: "custom", key: "brands") {
              value
              type
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
    
    // Process the response

    // Extract products and filter out ones that are in the excludedHandles list
    const products = data.products?.edges
      .map((edge: any) => {
        const node = edge.node;
        if (excludeHandles.includes(node.handle)) {
          return null;
        }

        // Get brand from custom.brands metafield - no fallback to vendor
        if (!node.metafield || !node.metafield.value) {
          throw new Error(`Product '${node.title}' is missing required custom.brands metafield`);
        }
        
        // Parse the brand value based on metafield type
        let brand;
        try {
          // Handle list.single_line_text_field type specifically
          if (node.metafield.type === 'list.single_line_text_field') {
            // This will be a JSON array of strings
            const parsed = JSON.parse(node.metafield.value);
            
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Use the first value in the list
              brand = parsed[0];
            } else {
              throw new Error(`Product '${node.title}' has empty brands list`);
            }
          }
          // If it's any other JSON type, try to parse it
          else if (node.metafield.type === 'json_string' || 
              node.metafield.value.startsWith('[') || 
              node.metafield.value.startsWith('{')) {
            
            const parsed = JSON.parse(node.metafield.value);
            
            // Handle array case (take first value)
            if (Array.isArray(parsed)) {
              brand = parsed[0] || '';
            } 
            // Handle object case
            else if (typeof parsed === 'object' && parsed !== null) {
              // If it has a name or value property, use that
              brand = parsed.name || parsed.value || parsed.brand || '';
            }
            // Handle primitive value
            else {
              brand = String(parsed);
            }
          } else {
            // Use as simple string
            brand = node.metafield.value;
          }
        } catch (err) {
          // Don't use fallbacks - report the parsing error clearly
          throw new Error(`Product '${node.title}' has malformed custom.brands metafield (parsing error)`);
        }
        
        if (!brand) {
          throw new Error(`Product '${node.title}' has invalid custom.brands metafield format`);
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
