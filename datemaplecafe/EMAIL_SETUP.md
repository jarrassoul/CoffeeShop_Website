# 📧 Email Setup Guide for DateMapleCafe

To send real emails to customers, you need to configure your email credentials.

## Quick Setup (Hotmail/Outlook)

1. **Create a `.env` file in the project root:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file with your Hotmail/Outlook credentials:**
   ```
   EMAIL_USER=your-hotmail@hotmail.com
   EMAIL_PASS=your-app-password
   EMAIL_SERVICE=outlook
   ```

3. **Get an App Password for your Hotmail/Outlook account:**
   - Go to: https://account.microsoft.com/security
   - Sign in with your Hotmail/Outlook account
   - Click "Advanced security options"
   - Under "App passwords", click "Create a new app password"
   - Enter a name like "DateMapleCafe"
   - Copy the generated password (looks like: abcd efgh ijkl mnop)
   - Use this password in your .env file (NOT your regular password!)

4. **Example .env file for Hotmail:**
   ```
   EMAIL_USER=mycafe@hotmail.com
   EMAIL_PASS=abcd efgh ijkl mnop
   EMAIL_SERVICE=outlook
   ```

5. **Restart the server:**
   ```bash
   npm start
   ```

## Alternative: Gmail Setup

If you prefer Gmail:

1. **Use Gmail in your .env:**
   ```
   EMAIL_USER=mycafe@gmail.com
   EMAIL_PASS=your-app-password
   EMAIL_SERVICE=gmail
   ```

2. **Get Gmail App Password:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Use the generated password in .env

## Testing

After setup, create a test order with your real email address and check if you receive the confirmation email.

## Troubleshooting

- **"Authentication failed"**: Check your app password
- **"Connection timeout"**: Check your internet connection
- **Still not working?**: Make sure 2-factor authentication is enabled on your email account