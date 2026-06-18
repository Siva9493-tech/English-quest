import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export async function sendReminderEmail(userData, streak) {
  if (!userData?.email || !SERVICE_ID) return;

  const messages = [
    'Your English journey continues today!',
    'Aria is waiting for you!',
    `${streak} day streak — don't break it now!`,
    'Just 15 minutes with Aria makes a difference!',
    'Your future self will thank you for practicing today!',
  ];

  const message = messages[Math.floor(Math.random() * messages.length)];

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_name: userData.name,
        to_email: userData.email,
        streak: streak || 0,
        message: message,
      },
      PUBLIC_KEY
    );
    console.log('Reminder email sent!');
    localStorage.setItem('lastReminderDate', new Date().toDateString());
  } catch (err) {
    console.error('Email failed:', err);
  }
}

// Whether daily email reminders are enabled (default ON).
export function remindersEnabled() {
  return localStorage.getItem('emailReminders') !== 'off';
}

export function shouldSendReminder() {
  if (!remindersEnabled()) return false;
  const lastSent = localStorage.getItem('lastReminderDate');
  const today = new Date().toDateString();
  return lastSent !== today;
}
