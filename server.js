import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import './src/config/db.config.js';
import User from './src/models/User.js';

dotenv.config();

// In-memory OTP Store for server-side security (email -> { otpHash, expiresAt, attemptsLeft, lastSentAt, resetTokenHash, resetTokenExpiresAt })
const otpStore = new Map();

// Helper to generate SHA-256 hash
function hashSecret(val) {
  return crypto.createHash('sha256').update(val).digest('hex');
}

// Nodemailer Gmail SMTP Transporter Creation
function createEmailTransporter() {
  dotenv.config({ override: true });
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : '';
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : '';

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // false for 587 (TLS/STARTTLS)
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    }
  });
}

// Global Transporter Instance for Nodemailer + Gmail SMTP
let mailTransporter = createEmailTransporter();

// Verify SMTP Connection on Server Startup
if (mailTransporter) {
  mailTransporter.verify((error, success) => {
    if (error) {
      console.warn('⚠️ [Nodemailer] Gmail SMTP Connection Notice:', error.message);
      console.warn('   Ensure SMTP_USER is your Gmail and SMTP_PASS is a 16-character Gmail App Password.');
    } else {
      console.log('✅ [Nodemailer] Gmail SMTP Connected Successfully & Ready to Send Real OTP Emails.');
    }
  });
} else {
  console.warn('⚠️ [Nodemailer] Gmail SMTP Credentials (SMTP_USER / SMTP_PASS) not configured in .env file.');
}

async function sendEmailOtp(email, otp) {
  const transporter = createEmailTransporter() || mailTransporter;

  if (!transporter) {
    console.error('[CalcChat] Nodemailer Gmail SMTP is not configured. Please set SMTP_USER and SMTP_PASS in .env file.');
    return {
      success: false,
      error: 'Gmail SMTP credentials are not configured on the server. Please set SMTP_USER and SMTP_PASS (16-character Gmail App Password) in the .env file.'
    };
  }

  const fromName = process.env.SMTP_FROM || `CalcChat Security <${process.env.SMTP_USER || 'noreply@calcchat.app'}>`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #0b141a; color: #e9edef; border-radius: 20px; padding: 32px; border: 1px solid #2a3942; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="color: #00a8ff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">CalcChat</h1>
        <p style="color: #8696a0; font-size: 13px; margin-top: 4px; font-weight: 500;">Password Reset Verification Code</p>
      </div>
      <div style="background-color: #1f2c34; border-radius: 16px; padding: 24px; border: 1px solid #2a3942; text-align: center;">
        <p style="color: #e9edef; font-size: 15px; margin-bottom: 18px; line-height: 1.5;">Your verification code is:</p>
        <div style="background-color: #111b21; display: inline-block; padding: 16px 32px; border-radius: 14px; border: 2px solid #00a8ff; margin: 10px 0; box-shadow: inset 0 2px 8px rgba(0,0,0,0.4);">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #00a8ff;">${otp}</span>
        </div>
        <p style="color: #8696a0; font-size: 13px; margin-top: 20px; font-weight: 500;">⏱️ <strong>This code will expire in 5 minutes.</strong></p>
        <p style="color: #8696a0; font-size: 12px; margin-top: 10px; line-height: 1.4;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 28px; border-top: 1px solid #1f2c34; padding-top: 18px;">
        <p style="color: #8696a0; font-size: 11px; margin: 0;">🔒 Protected by CalcChat End-to-End Security System</p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromName,
      to: email,
      subject: 'CalcChat Password Reset OTP',
      html: htmlContent,
    });
    console.log(`[CalcChat] Nodemailer Gmail SMTP email sent successfully to ${email} (MessageID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[CalcChat] Nodemailer Gmail SMTP Error:', err);
    return {
      success: false,
      error: err.message || 'Gmail SMTP email delivery failed. Please check your Gmail App Password and SMTP settings in .env.'
    };
  }
}

const app = express();
app.use(cors());
app.use(express.json());

// Check if user is admin
const ADMIN_EMAIL = 'bhelavevicky66@gmail.com';

  // Save or update user profile
  app.post('/api/user/profile', async (req, res) => {
    try {
      const { firebaseUid, email, name, avatar, providerId, settings, profile } = req.body;

      if (!firebaseUid || !email) {
        return res.status(400).json({ error: 'firebaseUid and email are required' });
      }

      const isAdmin = email === ADMIN_EMAIL;
      let user = await User.findOne({ firebaseUid });

      if (user) {
        user.email = email;
        user.name = name;
        user.avatar = avatar || user.avatar;
        user.providerId = providerId || user.providerId;
        user.isAdmin = isAdmin;
        
        if (settings) {
          user.settings = { ...user.settings, ...settings };
        }
        
        if (profile) {
          user.profile = { ...user.profile, ...profile };
        }
        
        user.updatedAt = new Date();
        await user.save();
      } else {
        user = new User({
          firebaseUid,
          email,
          name,
          avatar: avatar || '',
          providerId: providerId || '',
          isAdmin,
          settings: settings || undefined,
          profile: profile || undefined
        });
        await user.save();
      }

      res.json({ success: true, user, isAdmin });
    } catch (error) {
      console.error('Error saving user profile:', error);
      res.status(500).json({ error: 'Failed to save user profile' });
    }
  });

  // Get user profile by Firebase UID
  app.get('/api/user/:firebaseUid', async (req, res) => {
    try {
      const { firebaseUid } = req.params;
      const user = await User.findOne({ firebaseUid });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true, user, isAdmin: user.isAdmin });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  // Update user settings
  app.put('/api/user/:firebaseUid/settings', async (req, res) => {
    try {
      const { firebaseUid } = req.params;
      const { settings } = req.body;

      const user = await User.findOneAndUpdate(
        { firebaseUid },
        { 
          $set: { 
            'settings.passcode': settings.passcode,
            'settings.autoLockMinutes': settings.autoLockMinutes,
            'settings.hideChatHistory': settings.hideChatHistory,
            'settings.disappearingMessages': settings.disappearingMessages,
            'settings.theme': settings.theme,
            'settings.showAndroidFrame': settings.showAndroidFrame,
            'settings.soundEffects': settings.soundEffects,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error('Error updating user settings:', error);
      res.status(500).json({ error: 'Failed to update user settings' });
    }
  });

  // Update user profile
  app.put('/api/user/:firebaseUid/profile', async (req, res) => {
    try {
      const { firebaseUid } = req.params;
      const { profile } = req.body;

      const user = await User.findOneAndUpdate(
        { firebaseUid },
        { 
          $set: { 
            'profile.status': profile.status,
            'profile.isOnline': profile.isOnline,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true, user });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  });

  // Gemini AI Chat Proxy Endpoint
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { prompt, history } = req.body;

      if (prompt && (
        prompt.toLowerCase().includes('who created you') ||
        prompt.toLowerCase().includes('who made you') ||
        prompt.toLowerCase().includes('who developed you') ||
        prompt.toLowerCase().includes('who is your owner') ||
        prompt.toLowerCase().includes('who is your creator') ||
        prompt.toLowerCase().includes('owner kon hai') ||
        prompt.toLowerCase().includes('creator kon hai') ||
        prompt.toLowerCase().includes('who made calcchat')
      )) {
        return res.json({ text: 'I was created by Vicky Ashok Bhelave.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: 'GEMINI_API_KEY environment variable is missing' });
      }

      const systemInstruction = `You are the General AI Assistant inside the CalcChat application, created by Vicky Ashok Bhelave.

YOUR ABSOLUTE HIGHEST-PRIORITY RULE:
Always answer the user's ACTUAL QUESTION directly and thoroughly.
Never replace the answer with a generic list of supported subjects, menu, or canned greeting like "I can solve and explain...", "Feel free to type your homework...", or a list of subjects.

LANGUAGE RULES:
- Automatically detect the user's language and respond in that exact language (Hindi, Hinglish, English, Marathi, Gujarati, Bengali, Spanish, French, etc.).
- If the user writes in Hinglish, reply naturally in Hinglish.
- If the user writes in Hindi, reply in Hindi.
- If the user writes in English, reply in English.
- If the user makes spelling or grammar mistakes, understand the intended meaning and answer without complaining.

ANSWER COMPLETENESS & QUALITY:
- Provide a complete, helpful, and natural answer with important steps, explanations, and reasoning.
- If asking "how to", explain step-by-step with numbered lists.
- If asking "why", explain the underlying reasons.
- If asking for a definition, explain the concept clearly with relevant examples.
- If mathematical or scientific, calculate carefully and show the steps clearly.
- If coding-related (JavaScript, Python, React, Java, C++, HTML/CSS, SQL, etc.), provide clean, correct, runnable code in markdown code blocks and explain how it works.
- If educational, explain in an intuitive, student-friendly way.
- If comparing two or more concepts, explain differences and trade-offs clearly.

CONVERSATION CONTEXT:
- Retain context from previous messages to answer follow-up questions seamlessly.

CALCCHAT APPLICATION CONTEXT:
- CalcChat is a chat app with a secret calculator vault passcode interface.
- Accurately explain real app features (Secret calculator vault, chat messaging, groups, voice/video calls, status stories, search, wallpapers, PIN chat locks, disappearing messages, profile customizer, backup/restore).
- Do not claim CalcChat has features it does not have (e.g. UPI/crypto payments).

ACCURACY & SAFETY:
- Never intentionally make up facts. If uncertain, state uncertainty clearly.
- Do not pretend to access user files, device camera, or private accounts without explicit permission.

CREATOR ATTRIBUTION:
- If asked who created/developed you or who is your owner/creator, state EXACTLY: "I was created by Vicky Ashok Bhelave."`;


      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      let contents = prompt;
      if (Array.isArray(history) && history.length > 0) {
        contents = history
          .map((m) => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
          .concat(`User: ${prompt}`)
          .join('\n\n');
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: { systemInstruction }
      });

      res.json({ text: response.text });
    } catch (err) {
      console.error('Error calling Gemini API on server:', err);
      res.status(500).json({ error: 'AI server generation failed' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
  });

  // Mask email for user privacy display (e.g. b***6@gmail.com)
  function maskEmail(emailStr) {
    if (!emailStr || !emailStr.includes('@')) return emailStr;
    const parts = emailStr.split('@');
    const name = parts[0];
    const domain = parts.slice(1).join('@');
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name[0]}***${name[name.length - 1]}@${domain}`;
  }

  // ── Forgot Password & Email OTP Security Endpoints ──
  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const rawInput = (req.body.identifier || req.body.email || '').toString().trim();
      if (!rawInput) {
        return res.status(400).json({ error: 'Please enter a registered email address or username.' });
      }

      let targetEmail = '';
      let userDoc = null;

      try {
        const searchRegex = new RegExp(`^${rawInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        userDoc = await User.findOne({
          $or: [
            { email: searchRegex },
            { name: searchRegex },
            { firebaseUid: rawInput }
          ]
        });
      } catch (dbErr) {
        console.warn('[CalcChat] User search DB notice:', dbErr);
      }

      if (userDoc && userDoc.email) {
        targetEmail = userDoc.email.trim().toLowerCase();
      } else if (rawInput.includes('@')) {
        targetEmail = rawInput.toLowerCase();
      } else {
        return res.status(404).json({
          error: `No registered account found for "${rawInput}". Please check the details or enter your registered email address.`
        });
      }

      const now = Date.now();
      const existing = otpStore.get(targetEmail);

      // Cooldown check (30 seconds resend rate-limit)
      if (existing && existing.lastSentAt && (now - existing.lastSentAt < 30000)) {
        const waitSeconds = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
        return res.status(429).json({ error: `Please wait ${waitSeconds}s before requesting a new OTP.` });
      }

      // Generate 6-digit cryptographically secure OTP
      const otp = Math.floor(100000 + crypto.randomInt(0, 900000)).toString();
      const otpHash = hashSecret(otp);
      const expiresAt = now + 5 * 60 * 1000; // 5 minutes validity

      const otpRecord = {
        otpHash,
        expiresAt,
        targetEmail,
        attemptsLeft: 5, // max 5 failed attempts
        lastSentAt: now,
        resetTokenHash: null,
        resetTokenExpiresAt: null
      };

      otpStore.set(targetEmail, otpRecord);
      if (rawInput.toLowerCase() !== targetEmail) {
        otpStore.set(rawInput.toLowerCase(), otpRecord);
      }

      const sendResult = await sendEmailOtp(targetEmail, otp);

      if (!sendResult.success) {
        otpStore.delete(targetEmail);
        otpStore.delete(rawInput.toLowerCase());
        return res.status(500).json({
          error: sendResult.error || 'Failed to deliver OTP email. Please verify email configuration.'
        });
      }

      const masked = maskEmail(targetEmail);

      return res.json({
        success: true,
        targetEmail,
        maskedEmail: masked,
        message: 'If this email/account is registered, a verification code has been sent.',
        expiresInSeconds: 300
      });
    } catch (err) {
      console.error('Error in /api/auth/send-otp:', err);
      return res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    // Alias endpoint pointing to send-otp logic for backward compatibility
    req.url = '/api/auth/send-otp';
    return app._router.handle(req, res);
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { email, identifier, otp } = req.body;
      const rawInput = (identifier || email || '').toString().trim().toLowerCase();
      if (!rawInput || !otp) {
        return res.status(400).json({ error: 'Email/Username and OTP code are required.' });
      }

      const record = otpStore.get(rawInput);

      if (!record) {
        return res.status(400).json({ error: 'No OTP session found. Please click "Send OTP".' });
      }

      const now = Date.now();
      if (now > record.expiresAt) {
        otpStore.delete(rawInput);
        if (record.targetEmail) otpStore.delete(record.targetEmail);
        return res.status(400).json({ error: 'OTP has expired (5 minute limit). Please request a new OTP.' });
      }

      if (record.attemptsLeft <= 0) {
        otpStore.delete(rawInput);
        if (record.targetEmail) otpStore.delete(record.targetEmail);
        return res.status(400).json({ error: 'Maximum incorrect OTP attempts exceeded. Please request a new OTP.' });
      }

      const providedHash = hashSecret(otp.trim());
      if (record.otpHash !== providedHash) {
        record.attemptsLeft -= 1;
        if (record.attemptsLeft <= 0) {
          otpStore.delete(rawInput);
          if (record.targetEmail) otpStore.delete(record.targetEmail);
          return res.status(400).json({ error: 'Maximum incorrect attempts reached. OTP invalidated. Request a new OTP.' });
        }
        return res.status(400).json({ error: `Invalid OTP code. ${record.attemptsLeft} attempt(s) remaining.` });
      }

      // Success! Invalidate OTP immediately and generate single-use resetToken valid for 10 minutes
      const resetToken = crypto.randomBytes(32).toString('hex');
      record.otpHash = null; // Invalidate OTP
      record.resetTokenHash = hashSecret(resetToken);
      record.resetTokenExpiresAt = now + 10 * 60 * 1000;

      return res.json({
        success: true,
        message: 'OTP verified successfully.',
        resetToken,
        targetEmail: record.targetEmail || rawInput
      });
    } catch (err) {
      console.error('Error in /api/auth/verify-otp:', err);
      return res.status(500).json({ error: 'OTP verification failed. Please try again.' });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { email, resetToken, newPassword } = req.body;
      if (!email || !resetToken || !newPassword) {
        return res.status(400).json({ error: 'Email, reset token, and new password are required.' });
      }

      if (newPassword.trim().length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const record = otpStore.get(normalizedEmail);

      const tokenHash = hashSecret(resetToken);
      if (!record || record.resetTokenHash !== tokenHash || Date.now() > record.resetTokenExpiresAt) {
        return res.status(400).json({ error: 'Invalid or expired password reset session. Please request a new OTP.' });
      }

      // Save updated passcode to database (if Mongoose user exists)
      try {
        const user = await User.findOne({ email: new RegExp(`^${normalizedEmail}$`, 'i') });
        if (user) {
          if (!user.settings) user.settings = {};
          user.settings.passcode = newPassword.trim();
          user.updatedAt = new Date();
          await user.save();
        }
      } catch (dbErr) {
        console.warn('[CalcChat] Mongoose user update on reset password skipped:', dbErr);
      }

      // Invalidate the session
      otpStore.delete(normalizedEmail);

      return res.json({
        success: true,
        message: 'Password changed successfully.'
      });
    } catch (err) {
      console.error('Error in /api/auth/reset-password:', err);
      return res.status(500).json({ error: 'Failed to update password. Please try again.' });
    }
  });


  // Database offline error middleware fallback
  app.use((err, req, res, next) => {
    if (err.name === 'MongooseError' || err.name === 'MongoNetworkError' || (err.message && err.message.includes('buffering timed out'))) {
      console.warn('[AI Studio] Database offline — returning fallback response');
      if (req.method === 'GET') {
        return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
      }
      return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
    }
    next(err);
  });

  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error('Vite middleware initialization error:', e);
    }
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`CalcChat server running on http://0.0.0.0:${PORT}`);
    });
  }

export default app;



