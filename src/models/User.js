import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// --- MONGODB SCHEMA ---
const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  providerId: {
    type: String,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  settings: {
    passcode: {
      type: String,
      default: '1234'
    },
    autoLockMinutes: {
      type: Number,
      default: 5
    },
    hideChatHistory: {
      type: Boolean,
      default: false
    },
    disappearingMessages: {
      type: Boolean,
      default: false
    },
    theme: {
      type: String,
      default: 'material-light'
    },
    showAndroidFrame: {
      type: Boolean,
      default: true
    },
    soundEffects: {
      type: Boolean,
      default: true
    }
  },
  profile: {
    status: {
      type: String,
      default: 'Available'
    },
    isOnline: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const RealUser = mongoose.models.User || mongoose.model('User', userSchema);

// --- IN-MEMORY/JSON FALLBACK ---
const MOCK_DB_FILE = path.join(process.cwd(), 'users_mock_db.json');

function loadMockUsers() {
  try {
    if (fs.existsSync(MOCK_DB_FILE)) {
      return JSON.parse(fs.readFileSync(MOCK_DB_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading mock user database:', err);
  }
  return {};
}

function saveMockUsers(users) {
  try {
    fs.writeFileSync(MOCK_DB_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error saving mock user database:', err);
  }
}

const mockUsers = loadMockUsers();

class MockUser {
  constructor(data) {
    this.firebaseUid = data.firebaseUid || '';
    this.email = data.email || '';
    this.name = data.name || '';
    this.avatar = data.avatar || '';
    this.providerId = data.providerId || '';
    this.isAdmin = data.isAdmin || false;
    this.settings = {
      passcode: data.settings?.passcode || '1234',
      autoLockMinutes: data.settings?.autoLockMinutes !== undefined ? data.settings.autoLockMinutes : 5,
      hideChatHistory: data.settings?.hideChatHistory !== undefined ? data.settings.hideChatHistory : false,
      disappearingMessages: data.settings?.disappearingMessages !== undefined ? data.settings.disappearingMessages : false,
      theme: data.settings?.theme || 'material-light',
      showAndroidFrame: data.settings?.showAndroidFrame !== undefined ? data.settings.showAndroidFrame : true,
      soundEffects: data.settings?.soundEffects !== undefined ? data.settings.soundEffects : true,
    };
    this.profile = {
      status: data.profile?.status || 'Available',
      isOnline: data.profile?.isOnline !== undefined ? data.profile.isOnline : true,
    };
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    mockUsers[this.firebaseUid] = {
      firebaseUid: this.firebaseUid,
      email: this.email,
      name: this.name,
      avatar: this.avatar,
      providerId: this.providerId,
      isAdmin: this.isAdmin,
      settings: this.settings,
      profile: this.profile,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
    saveMockUsers(mockUsers);
    return this;
  }

  static async findOne(query) {
    const users = Object.values(mockUsers);
    if (query.firebaseUid) {
      const u = mockUsers[query.firebaseUid];
      return u ? new MockUser(u) : null;
    }
    if (query.email) {
      const u = users.find(x => x.email === query.email);
      return u ? new MockUser(u) : null;
    }
    return null;
  }

  static async findOneAndUpdate(query, update, options = {}) {
    const userInstance = await MockUser.findOne(query);
    if (!userInstance) return null;

    if (update.$set) {
      for (const [key, val] of Object.entries(update.$set)) {
        if (key.startsWith('settings.')) {
          const field = key.split('.')[1];
          userInstance.settings[field] = val;
        } else if (key.startsWith('profile.')) {
          const field = key.split('.')[1];
          userInstance.profile[field] = val;
        } else {
          userInstance[key] = val;
        }
      }
    } else {
      if (update.settings) userInstance.settings = { ...userInstance.settings, ...update.settings };
      if (update.profile) userInstance.profile = { ...userInstance.profile, ...update.profile };
      if (update.email) userInstance.email = update.email;
      if (update.name) userInstance.name = update.name;
    }

    await userInstance.save();
    return userInstance;
  }
}

// --- DYNAMIC DISPATCHER ---
const UserDispatcher = new Proxy(class {}, {
  get(_, prop) {
    if (mongoose.connection.readyState === 1) {
      return RealUser[prop];
    }
    return MockUser[prop];
  },
  construct(_, args) {
    if (mongoose.connection.readyState === 1) {
      return new RealUser(...args);
    }
    return new MockUser(...args);
  }
});

export default UserDispatcher;

