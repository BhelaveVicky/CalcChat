import mongoose from 'mongoose';

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
      default: 'material-dark'
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

const User = mongoose.model('User', userSchema);

export default User;
