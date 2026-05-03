import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from '@prisma/client';
import db from './db.js';

dotenv.config();

// Task 4: Server Environment Safety
if (!process.env.GEMINI_API_KEY || !process.env.JWT_SECRET) {
  console.error("CRITICAL ERROR: Missing GEMINI_API_KEY or JWT_SECRET in environment variables.");
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

const prisma = new PrismaClient();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.use(cors());
app.use(express.json());

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "No token provided" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid or expired token" });
        req.user = user;
        next();
    });
};

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LexManage Backend is running.' });
});

// AI Route
app.post('/api/ai/chat', async (req, res) => {
    const { prompt, systemInstruction } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API Key not configured on server." });
    }

    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        });
        
        const response = await result.response;
        res.json({ text: response.text() });
    } catch (error) {
        console.error("Gemini AI Error:", error);
        res.status(500).json({ error: "Failed to generate AI response" });
    }
});

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Refactor to Prisma:
  // const user = await prisma.user.findUnique({ where: { email }, include: { cabinet: true } });
  const user = db.find('users', u => u.email === email);
  
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, role: user.role, cabinetId: user.cabinetId }, JWT_SECRET, { expiresIn: '12h' });
    
    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;
    
    return res.json({
      user: userWithoutPassword,
      token
    });
  }
  
  res.status(401).json({ message: "Invalid credentials" });
});

// ... signup routes ...

// Case Routes
app.get('/api/cases', authenticateToken, async (req, res) => {
    const { cabinetId } = req.user;

    try {
        // Prisma Implementation:
        // const cases = await prisma.case.findMany({
        //     where: { cabinetId },
        //     include: { documents: true }
        // });
        
        // Mock Implementation with firm check:
        const cases = db.findAll('cases').filter(c => c.cabinetId === cabinetId || !c.cabinetId);
        const users = db.findAll('users');
        
        const transformedCases = cases.map(c => {
            const members = (c.memberIds || []).map(id => {
                const user = users.find(u => u.id === id);
                if (!user) return '??';
                return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            });
            return { ...c, members };
        });
        
        res.json(transformedCases);
    } catch (error) {
        console.error("Get Cases Error:", error);
        res.status(500).json({ message: "Failed to retrieve cases." });
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

