const { Pool } = require('@neondatabase/serverless');
const config = require('../config');

// Track active connections and queries
let activeConnections = 0;
let totalConnectionsCreated = 0;
let totalConnectionsReleased = 0;
let activeQueries = 0;
let totalQueriesExecuted = 0;
let connectionMap = new Map(); // Map to track connection objects by ID

// Get the connection string based on environment
const databaseUrl = process.env.DATABASE_URL || config.database?.url;

if (!databaseUrl) {
  throw new Error('Database URL is not configured. Please set DATABASE_URL environment variable.');
}

// Create a connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: config.database?.ssl === false ? false : { rejectUnauthorized: false },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000 // How long to wait for a connection to be established
});

// Get a client from the pool
async function getClient() {
  // Generate a unique connection ID
  const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  totalConnectionsCreated++;
  activeConnections++;

  try {
    const client = await pool.connect();

    connectionMap.set(connectionId, { created: new Date() });

    return {
      ...client,
      connectionId,
      release: async (err) => {
        if (!connectionMap.has(connectionId)) {
          console.warn(`[${new Date().toISOString()}] Attempted to release already released client ${connectionId}`);
          return;
        }

        if (err) {
          console.error(`[${new Date().toISOString()}] Error releasing database client ${connectionId}:`, err);
        }

        activeConnections--;
        totalConnectionsReleased++;
        connectionMap.delete(connectionId);
        if (activeConnections < 0) {
          console.error(`[${new Date().toISOString()}] ALERT: Connection tracking error. Active connections is negative: ${activeConnections}`);
        }

        try {
          return await client.release(err);
        } catch (releaseError) {
          console.error(`[${new Date().toISOString()}] Error during client.release for ${connectionId}:`, releaseError);
        }
      },
      query: async (text, params) => {
        const queryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const shortText = text.substring(0, 100).replace(/\s+/g, ' ').trim() + (text.length > 100 ? '...' : '');

        activeQueries++;
        totalQueriesExecuted++;

        const startTime = Date.now();
        try {
          const result = await client.query(text, params);

          activeQueries--;

          return result;
        } catch (error) {
          activeQueries--;
          console.error(`[${new Date().toISOString()}] Database query ${queryId} error:`, {
            error: error.message,
            query: shortText,
            params: params ? JSON.stringify(params) : 'none',
            duration: Date.now() - startTime
          });
          throw error;
        }
      }
    };
  } catch (error) {
    activeConnections--;
    console.error(`[${new Date().toISOString()}] Failed to get client ${connectionId}:`, error);
    throw error;
  }
}

async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error connecting to Neon database:`, error);
    return false;
  } finally {
    if (client) {
      client.release();
    }
  }
}

function getConnectionStatus() {
  return {
    activeConnections,
    totalConnectionsCreated,
    totalConnectionsReleased,
    activeQueries,
    totalQueriesExecuted,
    connectionDetails: Array.from(connectionMap.entries()).map(([id, details]) => {
      return {
        id,
        createdAt: details.created,
        ageMs: new Date() - details.created
      };
    })
  };
}

module.exports = {
  query: (text, params) => {
    const queryId = `direct_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return pool.query(text, params)
      .then(result => {
        return result;
      })
      .catch(error => {
        console.error(`[${new Date().toISOString()}] Direct pool query ${queryId} error: ${error.message}`);
        throw error;
      });
  },
  getClient,
  testConnection,
  getConnectionStatus,
  pool  
};
