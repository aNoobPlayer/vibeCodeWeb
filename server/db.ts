import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  server: 'sqlserver://localhost:1433',
  database: 'LuanVan',
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    trustedConnection: true
  }
};

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
        request.input(`p${index}`, param);
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