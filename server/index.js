import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'LexManage Backend is running.' });
});

// Mock Auth Route
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  // This will be replaced with real DB logic later
  if (email === "admin@lexmanage.com" && password === "admin") {
    return res.json({
      user: {
        id: 1,
        name: "Sarah Jenkins",
        email,
        role: "ADMIN",
        cabinetId: "CAB-001"
      },
      token: "mock-jwt-token"
    });
  }
  // Allow other logins for demo purposes if password matches simple rule
  if (password.length >= 4) {
      return res.json({
          user: {
              id: Date.now(),
              name: "Test User",
              email,
              role: "USER",
              cabinetId: "CAB-DEMO"
          },
          token: "mock-jwt-token-demo"
      });
  }
  res.status(401).json({ message: "Invalid credentials" });
});

app.post('/api/auth/signup/cabinet', (req, res) => {
    const { firmName, email, password } = req.body;
    // Mock successful creation
    res.json({
        user: { 
            id: Date.now(), 
            name: "Admin " + firmName, 
            email, 
            role: "ADMIN", 
            cabinetId: `CAB-${Math.floor(Math.random() * 1000)}` 
        },
        message: "Firm created successfully."
    });
});

app.post('/api/auth/signup/invite', (req, res) => {
    const { email, code, password } = req.body;
    if (code === "INVALID") {
        return res.status(400).json({ message: "Invalid invitation code." });
    }
    res.json({
        user: { 
            id: Date.now(), 
            name: "New Attorney", 
            email, 
            role: "USER", 
            cabinetId: "CAB-EXISTANT" 
        },
        message: "Invitation accepted."
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
