import crypto from 'crypto';

function generateApiKey(): string {
  return crypto.randomBytes(32).toString('base64url');
}

console.log('Generated API Key:');
console.log(generateApiKey());
console.log('\nAdd this to your .env file:');
console.log(`API_KEY=${generateApiKey()}`);
