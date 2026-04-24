import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LexManage Backend is running.' });
});

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = db.find('users', u => u.email === email);
  
  if (user && bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    
    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;
    
    return res.json({
      user: userWithoutPassword,
      token
    });
  }
  
  res.status(401).json({ message: "Invalid credentials" });
});

app.post('/api/auth/signup/cabinet', (req, res) => {
    const { firmName, email, password } = req.body;
    
    if (db.find('users', u => u.email === email)) {
        return res.status(400).json({ message: "Email already exists." });
    }

    const cabinetId = `CAB-${Math.floor(Math.random() * 1000)}`;
    const cabinet = db.insert('cabinets', {
        id: cabinetId,
        name: firmName
    });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = db.insert('users', {
        id: Date.now(),
        name: `Admin ${firmName}`,
        email,
        password: hashedPassword,
        role: "ADMIN",
        cabinetId: cabinet.id,
        status: "Active"
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    const { password: _, ...userWithoutPassword } = user;

    res.json({
        user: userWithoutPassword,
        token,
        message: "Firm created successfully."
    });
});

app.post('/api/auth/signup/invite', (req, res) => {
    const { email, code, password } = req.body;
    
    // In a real app, we'd verify the code. For now, we mock the cabinet association.
    const cabinet = db.find('cabinets', c => c.id === code) || db.findAll('cabinets')[0];
    
    if (!cabinet) {
        return res.status(400).json({ message: "Invalid invitation code." });
    }

    if (db.find('users', u => u.email === email)) {
        return res.status(400).json({ message: "Email already exists." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = db.insert('users', {
        id: Date.now(),
        name: "New Attorney",
        email,
        password: hashedPassword,
        role: "USER",
        cabinetId: cabinet.id,
        status: "Active"
    });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    const { password: _, ...userWithoutPassword } = user;

    res.json({
        user: userWithoutPassword,
        token,
        message: "Invitation accepted."
    });
});

// Case Routes
app.get('/api/cases', (req, res) => {
    // Ideally we'd filter by user's cabinetId from token
    const cases = db.findAll('cases');
    const users = db.findAll('users');
    
    // Transform cases to include member initials for the frontend
    const transformedCases = cases.map(c => {
        const members = (c.memberIds || []).map(id => {
            const user = users.find(u => u.id === id);
            if (!user) return '??';
            return user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        });
        return { ...c, members };
    });
    
    res.json(transformedCases);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

