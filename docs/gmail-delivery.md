# Trial Registration Gmail Delivery

## Current routing

As of 25 August 2026, the Santos Soka Academy trial-registration form sends validated submissions to the deployed Google Apps Script webhook configured in Manus. The webhook currently delivers messages to **mercurytopsha@gmail.com**. The website does not expose Gmail credentials in the browser; the server reads the webhook configuration from environment variables and sends the registration payload over HTTPS.

The public Contact page also uses `mailto:mercurytopsha@gmail.com` for the temporary contact destination. The academy’s official mailbox has not yet replaced this temporary destination.

## What was verified

A clearly marked dummy registration was submitted from the live Manus contact page using the player name `TEST - Browser Verification`. The form displayed:

> Thanks! We received your registration and will be in touch soon.

The connected Gmail inbox then received a message with subject **New Santos Soka Academy trial registration**, addressed to `mercurytopsha@gmail.com`, containing the submitted test details. The test message should be deleted or archived manually by the mailbox owner if desired; the application does not delete mailbox data.

## Configuration locations

The server-side helper is `server/googleWorkspace.ts`. It reads these environment variables through `server/_core/env.ts`:

| Variable | Purpose |
|---|---|
| `GOOGLE_WORKSPACE_WEBHOOK_URL` | The deployed Apps Script `/exec` endpoint. |
| `GOOGLE_WORKSPACE_WEBHOOK_SECRET` | Optional shared secret sent in the JSON payload for webhook validation. |

The values are managed as project secrets and must not be copied into frontend code, committed to Git, or pasted into public documentation.

## Later switch to the client mailbox

When the client’s official Google Workspace mailbox is ready, open the existing Apps Script project while signed in as the client or the client’s Workspace administrator. Deploy the script as a web app with execution set to the mailbox owner and access granted to anyone who needs to submit the form. If the script is copied or redeployed under the client account, record the new `/exec` URL and make sure its shared secret matches the project secret.

Then update the project secret `GOOGLE_WORKSPACE_WEBHOOK_URL` to the client-owned deployment URL. If the client changes the shared secret, update `GOOGLE_WORKSPACE_WEBHOOK_SECRET` at the same time. Finally, replace `mercurytopsha@gmail.com` with the client’s official mailbox in the public contact-email actions and in the Apps Script recipient setting, if the script uses a fixed recipient. Run one new clearly marked test submission, confirm both the success message and receipt in the client mailbox, and only then retire the temporary Gmail route.

No application-code change is required for the server forwarding logic unless the client’s Apps Script payload contract changes. Keep the webhook URL and secret in the project’s secret manager; never put either value in `client/public`, `client/src`, or a committed `.env` file.

## Scope

The current form flow handles **trial registrations only**. General contact messages are not separately forwarded because there is no general-contact form in the current site flow.
