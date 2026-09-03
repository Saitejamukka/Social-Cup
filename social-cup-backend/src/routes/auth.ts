import { Router, Request, Response } from 'express';

const router = Router();

// In-memory active session store
let currentUser = {
  id: 'usr_jordan_avery',
  email: 'jordan@socialcup.app',
  name: 'Jordan Avery',
  role: 'CUSTOMER',
  accountStatus: 'MEMBER',
  credits: 22,
  homeNeighborhood: 'Bishop Arts',
};

// Register
router.post('/register', (req: Request, res: Response) => {
  const { email, name } = req.body;
  currentUser = {
    id: 'usr_' + Date.now(),
    email: email || 'user@example.com',
    name: name || 'New Coffee Lover',
    role: 'CUSTOMER',
    accountStatus: 'VISITOR',
    credits: 0,
    homeNeighborhood: 'Bishop Arts',
  };
  res.status(201).json({ success: true, user: currentUser });
});

// Login
router.post('/login', (req: Request, res: Response) => {
  const { email } = req.body;
  currentUser.email = email || currentUser.email;
  res.json({ success: true, token: 'mock_jwt_token_123', user: currentUser });
});

// Get Current Profile
router.get('/me', (_req: Request, res: Response) => {
  res.json({ success: true, user: currentUser });
});

// Update membership
router.post('/subscribe', (req: Request, res: Response) => {
  currentUser.accountStatus = 'MEMBER';
  currentUser.credits = 30;
  res.json({ success: true, message: 'Subscribed to 30 drink credits/month', user: currentUser });
});

export { router as authRoutes, currentUser };
