const { StandardCheckoutClient, Env } = require('@phonepe-pg/pg-sdk-node');

let clientInstance = null;

/**
 * StandardCheckoutClient must only be instantiated ONCE per process
 * (the SDK throws if you call getInstance() with different credentials
 * more than once), so we lazily create it and reuse it everywhere.
 */
function getPhonePeClient() {
  if (clientInstance) return clientInstance;

  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = Number(process.env.PHONEPE_CLIENT_VERSION || 1);
  const env = (process.env.PHONEPE_ENV || 'SANDBOX').toUpperCase() === 'PRODUCTION'
    ? Env.PRODUCTION
    : Env.SANDBOX;

  if (!clientId || !clientSecret) {
    throw new Error(
      'PHONEPE_CLIENT_ID / PHONEPE_CLIENT_SECRET are not set. Add them to .env — see .env.example.'
    );
  }

  clientInstance = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
  return clientInstance;
}

module.exports = { getPhonePeClient };
