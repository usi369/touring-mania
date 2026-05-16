// Run D1 migration via Cloudflare API directly
const https = require('https');

const ACCOUNT_ID = '8ae4e10fa4bfdfa1a93b7a0c7c61a95d';
const DATABASE_ID = 'ef22a166-d951-41c1-8317-3195dbd37048';

// Read API token from environment or wrangler config
// You can set CLOUDFLARE_API_TOKEN env var before running
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!API_TOKEN) {
  console.error('Please set CLOUDFLARE_API_TOKEN environment variable');
  console.error('You can find your API token at https://dash.cloudflare.com/profile/api-tokens');
  console.error('');
  console.error('Alternative: Run these SQL commands manually in the Cloudflare Dashboard:');
  console.error('  D1 > touring-mania-db > Console');
  console.error('  ALTER TABLE games ADD COLUMN prevDeclaredSpec text(50);');
  console.error('  ALTER TABLE games ADD COLUMN prevDeclaredDirection text(10);');
  process.exit(1);
}

async function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ sql });
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.success) {
            resolve(parsed);
          } else {
            reject(new Error(JSON.stringify(parsed.errors)));
          }
        } catch (e) {
          reject(new Error(body));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const commands = [
    'ALTER TABLE games ADD COLUMN prevDeclaredSpec text(50)',
    'ALTER TABLE games ADD COLUMN prevDeclaredDirection text(10)',
  ];

  for (const cmd of commands) {
    try {
      console.log(`Executing: ${cmd}`);
      const result = await executeSQL(cmd);
      console.log('Success:', JSON.stringify(result.result));
    } catch (err) {
      console.error(`Error (may be OK if column already exists): ${err.message}`);
    }
  }
}

main();
