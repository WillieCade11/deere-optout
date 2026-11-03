# Grower Survey: One-Time Setup

The survey page lives on GitHub Pages at
**https://williecade11.github.io/deere-optout/survey/**

GitHub can show the page but cannot store answers. A small Google Apps Script does that: it saves each answer to a Google Sheet you own and emails you a summary every morning at 6 AM Central. Setup takes about 15 minutes and is done once.

## Step 1. Create the script

1. Sign in to the Google account that should own the responses.
2. Go to **https://script.google.com** and click **New project**.
3. Click the title "Untitled project" and rename it **Deere Grower Survey**.
4. Delete everything in the editor. Open `survey/apps-script/Code.gs` from this repository, copy all of it, and paste it in.
5. Click the disk icon (Save).

## Step 2. Set the time zone

1. Click the gear icon (**Project Settings**) on the left.
2. Set **Time zone** to **(GMT-06:00) Central Time - Chicago**.

## Step 3. Run setup once

1. Back in the editor (the `< >` icon), choose **setup** from the function drop-down at the top, then click **Run**.
2. Google asks for permission. Click **Review permissions**, pick your account, click **Advanced**, then **Go to Deere Grower Survey (unsafe)**, then **Allow**. ("Unsafe" only means Google has not reviewed your own script.)
3. The log at the bottom shows `Setup complete. Sheet: https://docs.google.com/...`. That new Sheet, "Deere Settlement Grower Survey - Responses", is in your Google Drive.

## Step 4. Publish the script as a web app

1. Click **Deploy**, then **New deployment**.
2. Click the gear next to "Select type" and choose **Web app**.
3. Description: `Survey v1`. **Execute as:** Me. **Who has access:** Anyone.
4. Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. Paste the URL in your browser. You should see "Deere survey backend is running."

## Step 5. Connect the page to the script

1. On GitHub, open `survey/config.js` and click the pencil (Edit).
2. Paste the URL between the quote marks: `SCRIPT_URL: "https://script.google.com/macros/s/.../exec",`
3. Click **Commit changes**. The live page updates in a minute or two.

Or send the URL to Claude and it will make this change for you.

## Step 6. Test it

1. Open the survey on your phone, answer, and submit.
2. Check that a new row appears in the Sheet.
3. In the script editor, choose **sendReportNow** and click **Run** to get a test email right away.

You can delete test rows from the Sheet at any time.

## Sharing the survey

- QR code to print or share: `survey/survey-qr.png` (it opens `.../survey/?src=qr`).
- To see which handout or group a response came from, share a link with your own tag, for example `.../survey/?src=nfu-email`. The tag appears in the Sheet's **Source** column.

## If you change the script later

After editing `Code.gs`, click **Deploy**, then **Manage deployments**, then the pencil, choose **New version**, and click **Deploy**. The URL stays the same, so `config.js` does not change.

## Privacy

The survey collects no names, phone numbers, emails, or IP addresses. State is optional.
