// server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/flashcards');

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Flashcard Schema
const flashcardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  box: { type: Number, default: 1 },
  nextReview: { type: Date, default: Date.now },
});

const Flashcard = mongoose.model('Flashcard', flashcardSchema);

// Authentication Middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).send({ error: 'Please authenticate.' });
  }
};

// Calculate next review date based on box number
const calculateNextReview = (box) => {
  const now = new Date();
  switch (box) {
    case 1: return new Date(now.setDate(now.getDate() + 1)); // 1 day
    case 2: return new Date(now.setDate(now.getDate() + 3)); // 3 days
    case 3: return new Date(now.setDate(now.getDate() + 7)); // 1 week
    case 4: return new Date(now.setDate(now.getDate() + 14)); // 2 weeks
    case 5: return new Date(now.setDate(now.getDate() + 30)); // 1 month
    default: return new Date(now.setDate(now.getDate() + 1));
  }
};

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 8);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post('/api/login', async (req, res) => {

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid login credentials');
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid login credentials');
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.send({ user, token });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Flashcard Routes
app.post('/api/flashcards',auth, async (req, res) => {
  try {
    const flashcard = new Flashcard({
      ...req.body,
      userId: req.userId,
      nextReview: calculateNextReview(1)
    });
    await flashcard.save();
    res.status(201).send(flashcard);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get('/api/flashcards',auth, async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ 
      userId: req.userId,
      nextReview: { $lte: new Date() }
    });
    res.send(flashcards);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.put('/api/flashcards/:id',auth, async (req, res) => {
  try {
    const { correct } = req.body;
    const flashcard = await Flashcard.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!flashcard) {
      return res.status(404).send();
    }

    if (correct) {
      flashcard.box = Math.min(flashcard.box + 1, 5);
    } else {
      flashcard.box = 1;
    }
    
    
    flashcard.nextReview = calculateNextReview(flashcard.box);
    await flashcard.save();
   res.status(201).send(flashcard)
  } catch (error) {
    res.status(400).send(error);
  }
});

app.delete('/api/flashcards/:id',auth, async (req, res) => {
  try {
    const flashcard = await Flashcard.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.userId
    });
    if (!flashcard) {
      return res.status(404).send();
    }
    res.send(flashcard);
  } catch (error) {
    res.status(500).send(error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});