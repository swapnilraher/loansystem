const TOKEN = 'EAAL6qnWnZABMBRfTVoipikLTEZBzVNQf9YStyNGTSxAGq8kHJ6AXivKPiHcMYxZBO2uuMyh4dCNVZB183wSpqoB0J08pAEsL5rEEqyHWdDfRgD5zxZCYhLX3ZBJW0rcxxQwvztib7jupBBStMxAaISbtrSalquCKiehliYs7ZCBf1VmGZCtqNTS1qhmPTybViZBZCOZBQZDZD';
const WABA_ID = '1493282642455205';

async function run() {
  const res = await fetch(`https://graph.facebook.com/v17.0/${WABA_ID}/message_templates?name=otp`, {
    headers: { 'Authorization': `Bearer ${TOKEN}` }
  });
  console.log(JSON.stringify(await res.json(), null, 2));
}
run();
