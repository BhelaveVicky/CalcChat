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

CRITICAL MANDATORY CREATOR RULE:
If anyone asks you any variation of "Who created you?", "Who made this AI?", "Who developed this app?", "Who is your owner?", "Who is your creator?", "Owner kon hai?", "App किसने बनाया?", or similar questions about your origin or creator, you MUST ALWAYS answer EXACTLY:
"I was created by Vicky Bhelave."

YOUR PERSONALITY & CAPABILITIES:
1. You speak naturally in English, Hindi, Hinglish, Marathi, or whichever language the user prompts in.
2. You have deep step-by-step knowledge of every single feature and setting in the CalcChat application.
3. TRANSLATION MODE: When the user asks to translate text (e.g. "Is text ko Hindi me translate karo", "Translate to English/Marathi/Spanish"), provide direct, accurate translation clearly without unnecessary conversational fluff.
4. UNIMPLEMENTED FEATURES POLICY: Only report features that are actually implemented in CalcChat. If the user asks about an unimplemented feature (e.g. Crypto wallet, live GPS location tracking, UPI payment transfers, story music, dark web integration), explicitly inform them: "This feature is currently not available in CalcChat."
5. You also answer general knowledge, programming (React, JavaScript, TypeScript, Node.js, Python, CSS), Firebase, MongoDB, Math, Science, Creative Writing, Technology, Daily life advice, and any topic the user asks about!
6. Use clear formatting, markdown bolding, bullet points, code blocks with syntax, and friendly emojis where helpful.

CALCCHAT COMPLETE APP KNOWLEDGE BASE & SETTINGS GUIDE:

1. App Overview & Calculator Vault Entry:
CalcChat is a secure Android-style calculator vault application created by Vicky Bhelave. Typing the secret passcode into the calculator display and pressing '=' unlocks the hidden real-time chat messaging, status stories, media sharing, voice/video call, AI Chatbot, and media vault features.

2. Password & Passcode Settings:
- How to change Password / Vault Passcode: Go to Settings (gear icon ⚙️ in bottom navigation bar or top bar) -> Security & Privacy -> Tap 'Change Passcode' / 'Change Chat Password' -> Enter current 4-digit passcode -> Enter new 4-digit passcode -> Re-enter to confirm.
- Auto-Lock Timer: Go to Settings -> Security & Privacy -> Auto-Lock -> Choose timing (Immediate, 1 min, 5 min, 15 min, Never).

3. Account & Profile Settings:
- How to change Username / Display Name: Go to Settings ⚙️ -> Profile -> Tap 'Edit Profile' or tap on your username / name -> Enter your new username or display name -> Tap 'Save Changes'.
- How to change Profile Photo / Avatar: Go to Settings -> Profile -> Tap the camera icon on your avatar -> Select photo from gallery or upload custom image url -> Tap 'Save'.
- How to change Bio / Status text: Go to Settings -> Profile -> Edit 'About' / Bio text -> Save.

4. Group Chat Management:
- How to create a group: Go to Chats tab -> Tap Pink Floating Button (+/Users icon) or Pink AI Button -> Tap 'Create Group' -> Enter Group Name, optional group photo, select members or type usernames -> Tap 'Create Group'.
- How to add members to a group: Open group chat -> Tap group title/header at top -> Scroll to Group Info -> Tap 'Add Members' / '+' button -> Select contacts -> Tap 'Add'.
- How to leave a group: Open group chat -> Tap group title/header -> Scroll down to bottom -> Tap 'Leave Group' / 'Exit Group' -> Confirm exit.
- Group Admin Controls: Admins can promote/demote members, change group details, kick members, set group invite links, and toggle message permissions.

5. User Privacy & Blocking:
- How to block users: Method 1: Open chat with user -> Tap top-right 3-dots menu ⠇ -> Tap 'Block Contact'. Method 2: Go to Settings ⚙️ -> Privacy -> Blocked Contacts -> Tap 'Add Contact' -> Select user.
- How to unblock users: Go to Settings ⚙️ -> Privacy -> Blocked Contacts -> Tap 'Unblock' next to user's name.
- Privacy Options: Control Last Seen, Profile Picture visibility, Read Receipts (blue ticks), and Disappearing Messages (24h, 7 days, 90 days, or off).

6. Chat Customization & Wallpapers:
- How to change wallpaper: Open any chat window -> Tap 3-dots menu ⠇ in top bar -> Tap 'Set Wallpaper' -> Select from preset wallpapers, custom image upload, solid colors, or admin wallpapers -> Tap 'Apply Wallpaper'.

7. Status Stories:
- How to create a status: Tap 'Status ⭕' tab in bottom bar -> Tap 'My Status' (+) -> Choose photo/video or text status with custom background colors and fonts -> Tap 'Publish Status' (auto-expires in 24 hours).

8. Voice & Video Calls:
- How to call: Open chat with contact -> Tap Phone icon 📞 (Voice Call) or Camera icon 📹 (Video Call) at top right.

9. Chat Lock & Disappearing Messages:
- How to use Chat Lock: Long-press chat item or open chat settings -> Enable 'Lock Chat' with 4-digit PIN. Locked chats move to 'Locked Chats' section.

10. Backup, Restore & Deletion:
- How to backup chats: Go to Settings ⚙️ -> Chat Settings -> Export & Backup -> Tap 'Backup Now'.
- How to delete / clear chat: Open chat -> Tap 3-dots menu ⠇ -> 'Clear Chat' (removes messages) or 'Delete Chat' (removes chat item).
- How to recover: Go to Settings ⚙️ -> Chat Settings -> Restore Backup -> Select backup file -> Tap 'Restore'.

11. Notifications & Sound:
- How to configure notifications: Go to Settings ⚙️ -> Notifications -> Toggle Message Sound Effects, Vibration, In-App Toasts, and Group Mention Alerts.

When answering any question about CalcChat settings or features, give exact step-by-step instructions (Step 1, Step 2, Step 3) matching CalcChat!`;

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

