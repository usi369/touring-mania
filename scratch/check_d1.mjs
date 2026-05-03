import 'dotenv/config';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function checkD1Connection() {
  if (!ACCOUNT_ID || !API_TOKEN) {
    console.error("Error: CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN is missing in .env");
    return;
  }

  console.log(`Checking connection for Account ID: ${ACCOUNT_ID}...`);

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      console.log("Success! D1 Connection verified.");
      const db = data.result.find(d => d.name === 'touring-mania-db');
      if (db) {
        console.log(`Found Database: ${db.name} (ID: ${db.uuid})`);
      } else {
        console.log("Database 'touring-mania-db' not found in this account, but API connection is working.");
      }
    } else {
      console.error("Failed to connect to Cloudflare API:");
      console.error(JSON.stringify(data.errors, null, 2));
    }
  } catch (error) {
    console.error("Network error while connecting to Cloudflare API:", error);
  }
}

checkD1Connection();
