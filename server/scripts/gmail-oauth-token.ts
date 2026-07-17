/**
 * One-time setup: authorizes this app to send Gmail via API (OAuth2) as
 * MAIL_USER, and prints the refresh token to save into .env / Render.
 *
 * Before running:
 *   1. In Google Cloud Console → the same OAuth Client already used for
 *      Google login (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET) → Credentials →
 *      add this to "Authorized redirect URIs":
 *        http://localhost:3999/oauth2callback
 *   2. If the OAuth consent screen is in "Testing" mode, add the sending
 *      Gmail account (MAIL_USER) under "Test users" — otherwise Google
 *      blocks the consent screen for anyone but the app owner.
 *
 * Run:  npx ts-node scripts/gmail-oauth-token.ts
 */
import 'dotenv/config';
import * as http from 'http';
import { google } from 'googleapis';

const PORT = 3999;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error('Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in your environment (.env).');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // required to get a refresh_token back
    prompt: 'consent', // forces a refresh_token even if this app was authorized before
    scope: ['https://www.googleapis.com/auth/gmail.send'],
  });

  console.log('\n1. Open this URL, sign in as the account that should send email:\n');
  console.log(authUrl);
  console.log('\n2. Approve access. You will be redirected back here automatically.\n');

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', REDIRECT_URI);
      if (url.pathname !== '/oauth2callback') {
        res.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      if (error || !code) {
        res.writeHead(400, { 'Content-Type': 'text/plain' }).end(`Authorization failed: ${error ?? 'no code returned'}`);
        console.error(`Authorization failed: ${error ?? 'no code returned'}`);
        server.close();
        process.exit(1);
      }

      const { tokens } = await oauth2Client.getToken(code!);
      res.writeHead(200, { 'Content-Type': 'text/plain' }).end('Done — you can close this tab and return to the terminal.');

      if (!tokens.refresh_token) {
        console.error(
          '\nNo refresh_token returned. This usually means the account already granted access before.\n' +
            'Go to https://myaccount.google.com/permissions, remove access for this app, and run this script again.',
        );
        server.close();
        process.exit(1);
      }

      console.log('\n✅ Add this to .env locally AND to the Render environment variables:\n');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('Token exchange failed:', (err as Error).message);
      res.writeHead(500).end('Token exchange failed — see terminal.');
      server.close();
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log(`Waiting for the redirect on http://localhost:${PORT} ...`);
  });
}

main();
