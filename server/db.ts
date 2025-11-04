import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

type MssqlConfig = sql.config;

function parseDatabaseUrl(url?: string): MssqlConfig | undefined {
  if (!url) return undefined;

  // Support two common formats:
  // 1) sqlserver://127.0.0.1:1433;database=DB;user=sa;password=pass;encrypt=true;trustServerCertificate=true
  // 2) mssql://user:pass@host:1433/database?encrypt=true&trustServerCertificate=true
  try {
    if (url.startsWith('sqlserver://')) {
      const withoutProto = url.replace('sqlserver://', '');
      const [hostPort, ...kvParts] = withoutProto.split(';');
      const [host, portStr] = hostPort.split(':');
      const kv: Record<string, string> = {};
      for (const part of kvParts) {
        if (!part) continue;
        const [k, v] = part.split('=');
        if (k && v !== undefined) kv[k.toLowerCase()] = v;
      }
      const port = kv["port"] ? parseInt(kv["port"], 10) : (portStr ? parseInt(portStr, 10) : 1433);
      return {
        server: host,
        port,
        database: kv['database'],
        user: kv['user'],
        password: kv['password'],
        options: {
          encrypt: kv['encrypt'] === 'true',
          trustServerCertificate: kv['trustservercertificate'] === 'true',
        }
      } as MssqlConfig;
    }

    if (url.startsWith('mssql://') || url.startsWith('sqlserver+msnodesqlv8://')) {
      // The mssql package can accept this connection string directly
      return { connectionString: url } as unknown as MssqlConfig;
    }
  } catch (err) {
    console.warn('Failed to parse DATABASE_URL, falling back to env variables.', err);
  }
  return undefined;
}

const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL);

const fallbackConfig: MssqlConfig = {
  server: process.env.DB_SERVER || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
  database: process.env.DB_NAME || 'LuanVan',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '111111',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

const config: MssqlConfig = fromUrl ?? fallbackConfig;

const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

pool.on('error', err => {
  console.error('SQL Server error:', err);
});

export async function query(queryText: string, params?: any[]) {
  await poolConnect;
  try {
    const request = pool.request();
    if (params) {
      params.forEach((param, index) => {
        // Infer SQL type loosely; users may pass typed parameters if needed.
        request.input(`p${index}`, param as any);
      });
    }
    return await request.query(queryText);
  } catch (err) {
    console.error('Database query error:', err);
    throw err;
  }
}

export default {
  query,
  sql,
  pool
};
