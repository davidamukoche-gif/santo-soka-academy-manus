# Google Workspace Webhook Setup Notes

Google’s official Apps Script web-app guide states that a web app needs a `doGet` or `doPost` function returning `HtmlOutput` or `TextOutput`. HTTP POST requests are handled by `doPost(e)`, and request data is available in `e.postData.contents`. Google’s deployment model supports executing the web app as the script owner, which is required for sending from the academy mailbox.

Google’s MailApp reference documents `MailApp.sendEmail()` and the `script.send_mail` authorization scope. MailApp is preferred here over GmailApp because the webhook only needs to send messages and not read mailbox contents.

Sources:
- https://developers.google.com/apps-script/guides/web
- https://developers.google.com/apps-script/reference/mail/mail-app

## Editor progress

A corrected 54-line webhook source was inserted into the signed-in Google Apps Script editor for the personal Google account `santossokaacademykenya@gmail.com`. The source uses `doPost(e)`, validates the current trial form fields, checks the optional `WEBHOOK_SECRET` script property, and sends to `mail@santossokaacademykenya.com` with `MailApp.sendEmail`. The editor model now ends with the `jsonResponse` function and no extra closing brace.
