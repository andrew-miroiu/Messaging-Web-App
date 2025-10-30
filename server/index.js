require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Create admin client with service key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ✅ Secure /users route
app.get('/users', async (req, res) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    res.json(data.users);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message });
  }
});

//=============================================================================
// ============= messaging between users ======================================
//=============================================================================

// Middleware to authenticate requests
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;
  next();
};

// Get messages for a conversation with selected user
app.get('/messages/:selectedUserId', authenticate, async (req, res) => {
  const { selectedUserId } = req.params;
  const currentUserId = req.user.id;

  try {
    // 1. Find the conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('*')
      .or(
        `and(user1_id.eq.${currentUserId},user2_id.eq.${selectedUserId}),and(user1_id.eq.${selectedUserId},user2_id.eq.${currentUserId})`
      )
      .limit(1)
      .single();

    // 2. If conversation doesn’t exist, create it
    if (!conversation) {
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert([{ user1_id: currentUserId, user2_id: selectedUserId }])
        .select()
        .single();
      conversation = newConversation;
    }

    // 3. Fetch messages for this conversation
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    res.json({ conversation, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


//====================================================
// Send a new message
//====================================================

// Add this to your server.js

// Send a new message
app.post('/messages', authenticate, async (req, res) => {
  const { conversation_id, message } = req.body;

  if (!conversation_id || !message) {
    return res.status(400).json({ error: 'conversation_id and message are required' });
  }

  try {
    const sender_id = req.user.id;

    // Insert the message into the database
    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert([{ conversation_id, sender_id, message }])
      .select()
      .single(); // return the inserted row

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to insert message' });
    }

    // Optionally: update conversation updated_at for sorting later
    await supabase
      .from('conversations')
      .update({ updated_at: new Date() })
      .eq('id', conversation_id);

    res.json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
