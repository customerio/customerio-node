// One-screen demo. Runs end-to-end against the real Edge endpoint.
//
//   export CIO_API_KEY="sdk_live_xxxxxxxxxxxx"
//   npx tsx examples/email-quickstart.ts

import { EmailClient } from '../lib/email';

const apiKey = process.env.CIO_API_KEY;
if (!apiKey) {
  console.error('Set CIO_API_KEY first.');
  process.exit(1);
}

const cio = new EmailClient({ apiKey });

(async () => {
  const { delivery_id } = await cio.send({
    to: 'josh.simmons+win@customer.io',
    from: 'win@customer.io',
    subject: 'Hello from the SDK',
    body: `<p>It works. Sent at ${new Date().toISOString()}</p>`,
  });
  console.log(`✓ Sent. delivery_id=${delivery_id}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
