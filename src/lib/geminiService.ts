import { GoogleGenAI } from '@google/genai';
import { CALCCHAT_SYSTEM_PROMPT } from './aiKnowledge';

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  error?: boolean;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

// Function to check if prompt is asking about creator/owner
export function isCreatorQuestion(prompt: string): boolean {
  const p = prompt.toLowerCase();
  return (
    p.includes('who created you') ||
    p.includes('who created u') ||
    p.includes('who made you') ||
    p.includes('who made u') ||
    p.includes('who developed you') ||
    p.includes('who developed u') ||
    p.includes('who is your creator') ||
    p.includes('who is your owner') ||
    p.includes('who made this app') ||
    p.includes('who built this app') ||
    p.includes('who developed this app') ||
    p.includes('who is the owner') ||
    p.includes('who created calcchat') ||
    p.includes('who made calcchat') ||
    p.includes('owner kon hai') ||
    p.includes('creator kon hai') ||
    p.includes('who made this ai') ||
    p.includes('who created this ai')
  );
}

// Fixed response for creator
export const CREATOR_RESPONSE = "I was created by Vicky Ashok Bhelave.";

// Safe Client Gemini SDK initializer
let genAIInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (genAIInstance) return genAIInstance;
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (import.meta as any).env?.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
  if (apiKey) {
    try {
      genAIInstance = new GoogleGenAI({ apiKey });
      return genAIInstance;
    } catch (e) {
      console.warn('Failed to initialize GoogleGenAI with provided key:', e);
    }
  }
  return null;
}

/**
 * Streams AI chat response chunk by chunk.
 */
export async function streamAIChatResponse(
  conversationHistory: AIMessage[],
  userPrompt: string,
  onChunk: (textChunk: string, fullTextSoFar: string) => void
): Promise<string> {
  // 1. Strict Creator check
  if (isCreatorQuestion(userPrompt)) {
    const words = CREATOR_RESPONSE.split(' ');
    let textSoFar = '';
    for (let i = 0; i < words.length; i++) {
      textSoFar += (i === 0 ? '' : ' ') + words[i];
      onChunk(words[i] + ' ', textSoFar);
      await new Promise(r => setTimeout(r, 40));
    }
    return CREATOR_RESPONSE;
  }

  // 2. Try direct Client Gemini SDK call first if key available
  const clientGenAI = getGenAI();
  if (clientGenAI) {
    try {
      const responseStream = await clientGenAI.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction: CALCCHAT_SYSTEM_PROMPT,
        }
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullText += chunk.text;
          onChunk(chunk.text, fullText);
        }
      }

      if (fullText.trim()) {
        return fullText;
      }
    } catch (err) {
      console.warn('Client Gemini SDK call failed, trying backend endpoint:', err);
    }
  }

  // 3. Try calling backend Express API server endpoint
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userPrompt })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.text) {
        const fullText = data.text;
        const words = fullText.split(' ');
        let textSoFar = '';
        for (let i = 0; i < words.length; i++) {
          textSoFar += (i === 0 ? '' : ' ') + words[i];
          onChunk(words[i] + ' ', textSoFar);
          await new Promise(r => setTimeout(r, 25));
        }
        return fullText;
      }
    }
  } catch (err) {
    console.warn('Backend AI API unavailable, using local knowledge base:', err);
  }

  // 4. Fallback Smart Local Knowledge Generator
  return fallbackSmartResponseStream(userPrompt, onChunk);
}

/**
 * Fallback generator providing structured answers for app knowledge & general queries
 */
async function fallbackSmartResponseStream(
  prompt: string,
  onChunk: (chunk: string, fullText: string) => void
): Promise<string> {
  const p = prompt.toLowerCase().trim();
  let responseText = '';

  // 0. Smart Math & Arithmetic Evaluator (e.g., "6+10 kitna", "25*4", "100/5", "15-8", etc.)
  const mathMatch = prompt.match(/(\d+\s*[\+\-\*\/\%]\s*\d+(?:\s*[\+\-\*\/\%]\s*\d+)*)/);
  if (mathMatch) {
    try {
      const expr = mathMatch[1].replace(/\s+/g, '');
      const result = new Function(`return ${expr}`)();
      if (typeof result === 'number' && !isNaN(result)) {
        responseText = `🔢 **Math Calculation:**\n\n**${expr} = ${result}**\n\n${prompt.includes('kitna') || prompt.includes('kya') ? `**${expr}** ka jawaab **${result}** hota hai! 😊` : ''}`;
      }
    } catch (e) {}
  }

  // 0. Translation helper check
  if (!responseText && (p.includes('translate') || p.includes('hindi me') || p.includes('english me') || p.includes('marathi me') || p.includes('spanish me'))) {
    if (p.includes('hello, how are you') || p.includes('hello how are you')) {
      responseText = "नमस्ते, आप कैसे हैं?";
    } else if (p.includes('i am going to school') || p.includes('going to school')) {
      responseText = "मैं स्कूल जा रहा/राही हूँ।";
    } else if (p.includes('i am very happy today') || p.includes('very happy today')) {
      responseText = "मैं आज बहुत खुश हूँ।";
    } else if (p.includes('mujhe kal school jana hai')) {
      responseText = "I have to go to school tomorrow.";
    } else if (p.includes('how are you') && (p.includes('marathi') || p.includes('marathi me'))) {
      responseText = "तुम्ही कसे आहात?";
    } else {
      responseText = `Translation:

${prompt.replace(/^translate\s+/i, '').replace(/^is\s+/i, '').replace(/\s+ko\s+hindi\s+me\s+translate\s+karo/i, '').replace(/\s+in\s+hindi/i, '')}`;
    }
  } else if (p === 'hi' || p === 'hello' || p === 'hey' || p === 'hlo') {
    responseText = `Hello! 👋 How can I help you today? Ask me any study question, homework problem, translation, or CalcChat app setting! 😊`;
  } else if (p.includes('kya feature') || p.includes('kya features') || p.includes('all features') || p.includes('list features') || p.includes('what can you do') || p.includes('what features')) {
    responseText = `### 🌟 CalcChat Main Features List

Here are all the features available in **CalcChat**:

1. 🔒 **Secret Passcode Vault**: Disguised Android Calculator interface. Enter your 4-digit passcode + '=' to reveal secret chats.
2. 💬 **Secret 1-on-1 & Group Chats**: Real-time messaging with text, images, videos, audio, documents, and view-once media.
3. 👥 **Group Management**: Create groups, add/remove members, assign admin roles, and set group permissions.
4. ⭕ **Status Stories**: Post photo, video, or text statuses that auto-expire in 24 hours with status replies & reactions.
5. 📞 **HD Voice & Video Calls**: Crystal clear 1-on-1 and group calling.
6. 🎨 **Chat Customization**: High-resolution admin & custom wallpapers, dark/light themes, and custom sound effects.
7. 🤖 **AI Chatbot Assistant**: Powered by Gemini for app guides, multi-language translation, coding assistance, and general AI chat!
8. 🔐 **Privacy & Security**: Chat lock with PIN, disappearing messages, user blocking/unblocking, and encrypted backup/restore.`;
  } else if (p.includes('crypto') || p.includes('upi') || p.includes('payment') || p.includes('gps') || p.includes('live location') || p.includes('bank transfer') || p.includes('wallet')) {
    responseText = "This feature is currently not available in CalcChat.";
  } else if (p.includes('js') || p.includes('javascript') || p.includes('what is js') || p.includes('explain javascript')) {
    responseText = `### 🟨 What is JavaScript (JS)?

**JavaScript (JS)** is a lightweight, dynamic, and high-level programming language that powers interactive behavior on web pages.

**Key Concepts:**
1. **Frontend**: DOM manipulation, event handling, animations, React, Vue, Angular.
2. **Backend**: Node.js, Express.js for building scalable REST APIs & server applications.
3. **Features**: First-class functions, async/await, closures, promises, JSON object notation.

\`\`\`javascript
// Example JS Code
const greet = (name) => {
  return \`Hello \${name}, welcome to JS!\`;
};
console.log(greet('Developer'));
\`\`\``;
  } else if (p.includes('react') || p.includes('what is react')) {
    responseText = `### ⚛️ What is React?

**React** (React.js) is an open-source JavaScript library developed by Meta/Facebook for building modern interactive User Interfaces (UIs).

**Key Features:**
- **Component Architecture**: Reusable UI blocks.
- **Virtual DOM**: Ultra-fast UI rendering.
- **Hooks**: useState, useEffect, useContext for managing component state.`;
  } else if (p.includes('python') || p.includes('python kya hai')) {
    responseText = `### 🐍 What is Python?

**Python** is a powerful, high-level, interpreted programming language known for its clean syntax and readability.

**Popular Uses:**
1. **AI & Machine Learning**: PyTorch, TensorFlow, Scikit-learn
2. **Data Science**: Pandas, NumPy, Matplotlib
3. **Web Development**: Django, Flask, FastAPI
4. **Automation**: Web scraping & scripting`;
  } else if (p.includes('javascript') || p.includes('explain javascript')) {
    responseText = `### 🟨 What is JavaScript?

**JavaScript (JS)** is the core programming language of the Web. Along with HTML and CSS, JavaScript is one of the three core technologies of the World Wide Web, enabling dynamic interactive web pages, front-end frameworks (React, Vue), and server-side runtimes (Node.js).`;
  } else if (p.includes('study') || p.includes('homework') || p.includes('exam') || p.includes('math') || p.includes('science') || p.includes('physics') || p.includes('chemistry') || p.includes('essay')) {
    responseText = `### 📚 Study & Homework AI Assistance

I can solve and explain any study subject step-by-step for you:

1. 🔢 **Mathematics**: Algebra, Calculus, Trigonometry, Geometry & Word Problems.
2. 🔬 **Science**: Physics (Laws of Motion, Electricity), Chemistry (Periodic Table, Reactions), Biology (Cells, Human Anatomy).
3. 💻 **Computer Science & Coding**: React, JavaScript, Python, C++, HTML/CSS & Data Structures.
4. 📝 **Writing & Languages**: Essay writing, Grammar correction, Summaries & Multi-language Translation!

*Feel free to type your exact homework problem or subject question above!*`;
  } else if (p.includes('password') || p.includes('passcode')) {
    responseText = `### 🔒 How to Change Your Chat Password / Passcode

To change your security password in **CalcChat**:

1. **Open Settings**: Tap the gear icon **⚙️** in the bottom navigation bar or top right menu.
2. **Select Security & Privacy**: Tap **Security & Privacy**.
3. **Change Passcode**: Tap **Change Chat Password** or **Change Passcode**.
4. **Enter Current Passcode**: Type your existing 4-digit calculator passcode.
5. **Set New Passcode**: Enter your new 4-digit passcode and confirm it.

*Your new passcode will now unlock the secret vault from the calculator screen!*`;
  } else if (p.includes('username') || p.includes('display name') || p.includes('change name')) {
    responseText = `### 👤 How to Change Your Username / Display Name

1. **Open Settings**: Tap **Settings ⚙️** at the bottom right.
2. **Tap Profile**: Select **My Profile** at the top.
3. **Edit Profile**: Tap the **Edit** icon or tap directly on your current username/display name.
4. **Type New Name**: Enter your desired username or display name.
5. **Save**: Tap **Save Changes** at the top right.

*Your updated username will immediately reflect across all your group chats and contacts!*`;
  } else if (p.includes('create group') || p.includes('new group') || p.includes('make group')) {
    responseText = `### 👥 How to Create a New Group Chat

1. **Go to Chats Tab**: Tap the **Chats 💬** tab in the main bar.
2. **Tap Floating Action Button**: Tap the **Pink + Group Icon** (or Pink AI Floating Button).
3. **Select Create Group**: Tap **Create Group** from the popup.
4. **Group Details**: Type your **Group Name** and upload an optional group avatar.
5. **Add Members**: Select contacts from your list or type comma-separated usernames.
6. **Create**: Tap **Create Group** button to launch your new group!`;
  } else if (p.includes('add member') || p.includes('add people')) {
    responseText = `### ➕ How to Add Members to a Group

1. **Open Group Chat**: Navigate to the group chat you want to manage.
2. **Open Group Info**: Tap the **Group Name / Header** at the very top.
3. **Scroll to Members**: Tap **Add Members** or the **+** button.
4. **Select Contacts**: Choose the contacts or type their usernames.
5. **Confirm**: Tap **Add to Group**.`;
  } else if (p.includes('leave group') || p.includes('exit group')) {
    responseText = `### 🚪 How to Leave or Exit a Group

1. **Open Group Chat**: Tap the group you want to exit.
2. **Open Group Details**: Tap the **Group Name** at the top of the chat window.
3. **Scroll Down**: Scroll to the bottom of the group info screen.
4. **Exit Group**: Tap **Exit Group / Leave Group** in red text.
5. **Confirm**: Tap **Exit** to confirm.`;
  } else if (p.includes('block') && !p.includes('unblock')) {
    responseText = `### 🚫 How to Block a User

**Method 1 (From Chat):**
1. Open chat with the user.
2. Tap the **3-dots menu ⠇** at the top right corner.
3. Tap **Block Contact** and confirm.

**Method 2 (From Settings):**
1. Go to **Settings ⚙️** -> **Privacy**.
2. Tap **Blocked Contacts** -> **Add Contact**.
3. Select the user you wish to block.`;
  } else if (p.includes('unblock')) {
    responseText = `### ✅ How to Unblock a User

1. Go to **Settings ⚙️** -> **Privacy**.
2. Tap **Blocked Contacts**.
3. Find the user in your blocked list.
4. Tap **Unblock** next to their name.`;
  } else if (p.includes('wallpaper') || p.includes('background')) {
    responseText = `### 🎨 How to Change Chat Wallpaper

1. Open any chat conversation.
2. Tap the **3-dots menu ⠇** at the top right.
3. Tap **Set Wallpaper**.
4. Choose from:
   - **Preset Wallpapers** (HD background textures)
   - **Custom Photo** (upload from device)
   - **Solid Colors**
   - **Admin Wallpapers**
5. Tap **Apply Wallpaper** to save!`;
  } else if (p.includes('status') || p.includes('story')) {
    responseText = `### 📸 How to Create a Status / Story

1. Tap the **Status ⭕** tab in the bottom bar.
2. Tap **My Status (+)**.
3. Choose either:
   - **Photo/Video Status**: Pick media from your gallery.
   - **Text Status**: Type your message with custom background colors and font styles.
4. Tap **Publish** to share with your contacts (auto-expires in 24 hours).`;
  } else if (p.includes('mention') || p.includes('tag')) {
    responseText = `### 🏷️ How to Mention Users in Group Chat

1. In any group chat, tap the text typing input.
2. Type the **@** symbol.
3. A popup list of group members will appear.
4. Tap the member's name to mention them in your message!`;
  } else if (p.includes('call') || p.includes('voice') || p.includes('video')) {
    responseText = `### 📞 How to Make Voice & Video Calls

1. Open a 1-on-1 chat window with any contact.
2. At the top right header:
   - Tap the **Phone Icon 📞** for a **Voice Call**.
   - Tap the **Camera Icon 📹** for a **Video Call**.
3. Grant camera/microphone permissions if prompted!`;
  } else if (p.includes('lock') || p.includes('chat lock')) {
    responseText = `### 🔐 How to Use Chat Lock

1. Open your chat list.
2. Long press on the contact/group you want to lock, or open chat settings.
3. Select **Lock Chat**.
4. Set a 4-digit PIN for that specific conversation.
5. The chat will move to the **Locked Chats** section at the top of your chat list.`;
  } else if (p.includes('backup') || p.includes('restore') || p.includes('recover')) {
    responseText = `### 💾 How to Backup and Recover Chats

**To Backup:**
1. Go to **Settings ⚙️** -> **Chat Settings**.
2. Tap **Export & Backup**.
3. Tap **Backup Now** to create an encrypted local/cloud backup.

**To Recover / Restore:**
1. Go to **Settings ⚙️** -> **Chat Settings**.
2. Tap **Restore Backup**.
3. Select your latest backup file to restore messages and media!`;
  } else if (p.includes('clear') || p.includes('delete chat')) {
    responseText = `### 🗑️ How to Clear or Delete Chats

**Clear Chat History:**
1. Open the chat window.
2. Tap **3-dots menu ⠇** -> **Clear Chat**.
3. All messages will be wiped, but the chat contact remains.

**Delete Chat:**
1. In chat list, long-press the chat item.
2. Tap **Delete Chat**.`;
  } else {
    responseText = `Hello! 👋 I'm your **CalcChat AI Assistant**!

I can help you with anything in **CalcChat**, such as:
- 🔒 Changing password & chat lock
- 👤 Updating username & profile
- 👥 Creating & managing groups
- 📸 Publishing status stories
- 🎨 Changing wallpapers & themes
- 📞 Making voice and video calls
- 🌐 Multi-language Translations (Hindi, English, Marathi, Spanish)
- 💻 Programming (React, JS, Python, Firebase, MongoDB)
- 📚 General Knowledge, Math, Science & English/Hindi text!

What would you like to do or ask today? 😊`;
  }

  // Stream word by word smoothly
  const words = responseText.split(' ');
  let textSoFar = '';
  for (let i = 0; i < words.length; i++) {
    textSoFar += (i === 0 ? '' : ' ') + words[i];
    onChunk(words[i] + ' ', textSoFar);
    await new Promise(r => setTimeout(r, 20));
  }

  return responseText;
}
