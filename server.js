import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import './src/config/db.config.js';
import User from './src/models/User.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
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

    // Check if user is admin
    const isAdmin = email === ADMIN_EMAIL;

    // Find or create user
    let user = await User.findOne({ firebaseUid });

    if (user) {
      // Update existing user
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
      // Create new user
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
    const { prompt } = req.body;

    if (prompt && (
      prompt.toLowerCase().includes('who created you') ||
      prompt.toLowerCase().includes('who made you') ||
      prompt.toLowerCase().includes('who developed you') ||
      prompt.toLowerCase().includes('who is your owner') ||
      prompt.toLowerCase().includes('who is your creator') ||
      prompt.toLowerCase().includes('owner kon hai')
    )) {
      return res.json({ text: 'I was created by Vicky Bhelave.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY environment variable is missing' });
    }

    const systemInstruction = `You are the official AI Assistant for CalcChat (Secret Calculator Chat Vault), created by Vicky Bhelave.

CRITICAL CREATOR RULE:
If asked who created or developed you or this app or who is the owner, ALWAYS state EXACTLY: "I was created by Vicky Bhelave."

YOUR CAPABILITIES & RULES:
1. Speak naturally in English, Hindi, Hinglish, Marathi, or whichever language the user uses.
2. STUDY & EDUCATION: You provide comprehensive, step-by-step help for all study topics — Mathematics (calculus, algebra, geometry), Science (Physics, Chemistry, Biology), Computer Science & Coding (React, JavaScript, TypeScript, Python, C++), History, Exam prep, Essay writing, and Grammar.
3. TRANSLATION: If the user requests translation (e.g. "translate to Hindi/English/Marathi/Spanish"), provide direct, accurate translation without unnecessary conversational intro.
4. UNIMPLEMENTED FEATURES: CalcChat features ARE: Calculator vault passcode, secret chat messaging, group creation & member management, status stories, voice & video calls, wallpapers, profile/username editing, chat lock, disappearing messages, user blocking/unblocking, backup/sync, and AI Chatbot. If asked about an UNIMPLEMENTED feature (e.g. Crypto wallet, live GPS tracking, UPI payment transfers), clearly state: "This feature is currently not available in CalcChat."
5. Format answers with clear headings, bold markdown text, numbered steps, bullet points, and code blocks for maximum readability!`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

