import 'dotenv/config';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const DATABASE_ID = "ef22a166-d951-41c1-8317-3195dbd37048";

async function checkRemoteData() {
  console.log("Checking remote bikes count...");
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: "SELECT COUNT(*) as count FROM bikes;"
      })
    }
  );

  const data = await response.json();
  if (data.success) {
    console.log("Bikes count:", data.result[0].results[0].count);
  } else {
    console.error("Error:", data.errors);
  }
}

checkRemoteData();
