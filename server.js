import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
