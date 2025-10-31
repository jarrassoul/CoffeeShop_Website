#!/usr/bin/env node
/**
 * Quick Email Setup for DateMapleCafe
 * This script helps you configure your Hotmail/Outlook email for sending order confirmations
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🍁 DateMapleCafe Email Setup');
console.log('=============================\n');

console.log('This will help you configure email sending for customer order confirmations.');
console.log('We\'ll create a .env file with your email credentials.\n');

const questions = [
    {
        key: 'EMAIL_USER',
        question: '📧 Your Hotmail/Outlook email address: ',
        validation: (value) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Please enter a valid email address';
            }
            return null;
        }
    },
    {
        key: 'EMAIL_PASS',
        question: '🔐 Your app password (NOT your regular password): ',
        validation: (value) => {
            if (value.length < 8) {
                return 'App password should be at least 8 characters';
            }
            return null;
        }
    },
    {
        key: 'EMAIL_SERVICE',
        question: '⚙️  Email service (outlook/gmail/yahoo) [outlook]: ',
        defaultValue: 'outlook',
        validation: (value) => {
            const validServices = ['outlook', 'gmail', 'yahoo'];
            const service = value.toLowerCase() || 'outlook';
            if (!validServices.includes(service)) {
                return 'Please enter: outlook, gmail, or yahoo';
            }
            return null;
        }
    }
];

const answers = {};
let currentQuestion = 0;

function askQuestion() {
    if (currentQuestion >= questions.length) {
        createEnvFile();
        return;
    }

    const q = questions[currentQuestion];
    rl.question(q.question, (answer) => {
        const value = answer.trim() || q.defaultValue || '';

        if (q.validation) {
            const error = q.validation(value);
            if (error) {
                console.log(`❌ ${error}\n`);
                askQuestion(); // Ask the same question again
                return;
            }
        }

        answers[q.key] = value;
        currentQuestion++;
        askQuestion();
    });
}

function createEnvFile() {
    const envContent = `# DateMapleCafe Email Configuration
# Generated on ${new Date().toISOString()}

# Your email credentials
EMAIL_USER=${answers.EMAIL_USER}
EMAIL_PASS=${answers.EMAIL_PASS}
EMAIL_SERVICE=${answers.EMAIL_SERVICE}

# Other configuration
PORT=3000
`;

    const envPath = path.join(__dirname, '.env');

    try {
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ Email configuration saved successfully!');
        console.log(`📁 Created: ${envPath}`);
        console.log('\n🚀 Next steps:');
        console.log('1. Restart your server: npm start');
        console.log('2. Go to Admin Panel → Email Settings');
        console.log('3. Click "Test Email" to verify setup');
        console.log('4. Create a test order to see if customers receive emails\n');

        console.log('📘 Need help getting an app password?');
        console.log('   Hotmail/Outlook: https://account.microsoft.com/security');
        console.log('   Gmail: https://myaccount.google.com/apppasswords');
        console.log('   Yahoo: https://account.yahoo.com/account/security\n');

    } catch (error) {
        console.log('\n❌ Error creating .env file:', error.message);
    }

    rl.close();
}

// Show help message first
console.log('📘 Before we start, make sure you have:');
console.log('   ✓ A Hotmail/Outlook account with 2-factor authentication enabled');
console.log('   ✓ An app password generated (NOT your regular password)');
console.log('   ✓ If you need help: https://account.microsoft.com/security\n');

rl.question('Ready to continue? (y/n): ', (answer) => {
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('Setup cancelled. Run this script again when ready!');
        rl.close();
        return;
    }
    console.log('\n📝 Please provide your email configuration:\n');
    askQuestion();
});