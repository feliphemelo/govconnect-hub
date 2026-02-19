import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { pool } from './config/database';
import { hashPassword, comparePassword, generateToken, verifyToken } from './utils/auth';
import type { JWTPayload } from './types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Auth Middleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    (req as any).user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// ===== AUTH ROUTES =====

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, company_id } = req.body;

    // Validate input
    if (!email || !password || !full_name || !company_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM auth_users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userResult = await pool.query(
      `INSERT INTO auth_users (email, password_hash, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id, email, created_at`,
      [email, hashedPassword]
    );

    const user = userResult.rows[0];

    // Create profile
    await pool.query(
      `INSERT INTO profiles (user_id, company_id, full_name, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, true, NOW(), NOW())`,
      [user.id, company_id, full_name]
    );

    // Create user role
    await pool.query(
      `INSERT INTO user_roles (user_id, company_id, role, created_at)
       VALUES ($1, $2, 'agent', NOW())`,
      [user.id, company_id]
    );

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      companyId: company_id,
      role: 'agent'
    });

    res.status(201).json({ 
      user: { id: user.id, email: user.email },
      token 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user
    const userResult = await pool.query(
      'SELECT id, email, password_hash FROM auth_users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get profile and role
    const profileResult = await pool.query(
      `SELECT p.company_id, p.full_name, p.avatar_url, p.status,
              ur.role
       FROM profiles p
       LEFT JOIN user_roles ur ON ur.user_id = p.user_id
       WHERE p.user_id = $1
       LIMIT 1`,
      [user.id]
    );

    const profile = profileResult.rows[0];

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      companyId: profile?.company_id || '',
      role: profile?.role || 'agent'
    });

    // Log access
    await pool.query(
      'INSERT INTO public.access_logs (user_id, company_id, action, created_at) VALUES ($1, $2, $3, NOW())',
      [user.id, profile?.company_id, 'login']
    );

    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name,
        avatar_url: profile?.avatar_url,
        status: profile?.status,
        company_id: profile?.company_id,
        role: profile?.role
      },
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;

    const result = await pool.query(
      `SELECT u.id, u.email, p.full_name, p.avatar_url, p.status, p.company_id,
              ur.role, c.name as company_name, c.slug as company_slug
       FROM auth.users u
       LEFT JOIN public.profiles p ON p.user_id = u.id
       LEFT JOIN public.user_roles ur ON ur.user_id = u.id
       LEFT JOIN public.companies c ON c.id = p.company_id
       WHERE u.id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ===== COMPANIES ROUTES =====

app.get('/api/companies', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    
    const result = await pool.query(
      'SELECT * FROM public.companies WHERE id = $1',
      [payload.companyId]
    );

    res.json({ companies: result.rows });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to get companies' });
  }
});

app.get('/api/companies/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    const { id } = req.params;

    // Verify user belongs to company
    if (id !== payload.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      'SELECT * FROM public.companies WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ company: result.rows[0] });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Failed to get company' });
  }
});

// ===== PROFILES ROUTES =====

app.get('/api/profiles', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;

    const result = await pool.query(
      'SELECT * FROM public.profiles WHERE company_id = $1',
      [payload.companyId]
    );

    res.json({ profiles: result.rows });
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ error: 'Failed to get profiles' });
  }
});

app.patch('/api/profiles/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    const { id } = req.params;
    const { full_name, avatar_url, phone, status } = req.body;

    // Verify user can update this profile
    const checkResult = await pool.query(
      'SELECT user_id FROM public.profiles WHERE id = $1 AND company_id = $2',
      [id, payload.companyId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Users can only update their own profile unless admin
    if (checkResult.rows[0].user_id !== payload.userId && payload.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `UPDATE public.profiles 
       SET full_name = COALESCE($1, full_name),
           avatar_url = COALESCE($2, avatar_url),
           phone = COALESCE($3, phone),
           status = COALESCE($4, status),
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [full_name, avatar_url, phone, status, id]
    );

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ===== CONTACTS ROUTES =====

app.get('/api/contacts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    const { page = 1, limit = 50, search } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    let query = 'SELECT * FROM public.contacts WHERE company_id = $1';
    const params: any[] = [payload.companyId];

    if (search) {
      query += ' AND (name ILIKE $3 OR phone ILIKE $3 OR email ILIKE $3)';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(Number(limit), offset);

    const result = await pool.query(query, params.length === 2 ? [params[0], params[1], offset] : params);
    
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM public.contacts WHERE company_id = $1',
      [payload.companyId]
    );

    res.json({ 
      contacts: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to get contacts' });
  }
});

app.post('/api/contacts', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    const { name, phone, email, metadata } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const result = await pool.query(
      `INSERT INTO public.contacts (company_id, name, phone, email, metadata, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [payload.companyId, name, phone, email, metadata || {}]
    );

    res.status(201).json({ contact: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Contact with this phone already exists' });
    }
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// ===== SECTORS ROUTES =====

app.get('/api/sectors', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;

    const result = await pool.query(
      'SELECT * FROM public.sectors WHERE company_id = $1 ORDER BY name',
      [payload.companyId]
    );

    res.json({ sectors: result.rows });
  } catch (error) {
    console.error('Get sectors error:', error);
    res.status(500).json({ error: 'Failed to get sectors' });
  }
});

app.post('/api/sectors', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;

    // Check if user is admin
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create sectors' });
    }

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      `INSERT INTO public.sectors (company_id, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [payload.companyId, name, description]
    );

    res.status(201).json({ sector: result.rows[0] });
  } catch (error) {
    console.error('Create sector error:', error);
    res.status(500).json({ error: 'Failed to create sector' });
  }
});

// ===== CONVERSATIONS ROUTES =====

app.get('/api/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    const { status, assigned_user_id, sector_id, page = 1, limit = 50 } = req.query;
    
    let query = `
      SELECT c.*, 
             co.name as contact_name, 
             co.phone as contact_phone,
             co.avatar_url as contact_avatar,
             u.email as assigned_user_email,
             p.full_name as assigned_user_name,
             s.name as sector_name,
             (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as message_count,
             (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM conversations c
      LEFT JOIN contacts co ON co.id = c.contact_id
      LEFT JOIN auth_users u ON u.id = c.assigned_user_id
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN sectors s ON s.id = c.sector_id
      WHERE c.company_id = $1
    `;
    
    const params: any[] = [payload.companyId];
    let paramIndex = 2;
    
    if (status) {
      query += ` AND c.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (assigned_user_id) {
      query += ` AND c.assigned_user_id = $${paramIndex}`;
      params.push(assigned_user_id);
      paramIndex++;
    }
    
    if (sector_id) {
      query += ` AND c.sector_id = $${paramIndex}`;
      params.push(sector_id);
      paramIndex++;
    }
    
    query += ` ORDER BY c.last_message_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(Number(limit), (Number(page) - 1) * Number(limit));
    
    const result = await pool.query(query, params);
    
    // Count total
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM conversations WHERE company_id = $1',
      [payload.companyId]
    );
    
    res.json({ 
      conversations: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

app.get('/api/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT c.*, 
              co.name as contact_name, 
              co.phone as contact_phone,
              co.email as contact_email,
              co.avatar_url as contact_avatar
       FROM conversations c
       LEFT JOIN contacts co ON co.id = c.contact_id
       WHERE c.id = $1 AND c.company_id = $2`,
      [id, payload.companyId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json({ conversation: result.rows[0] });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

app.post('/api/conversations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    const { contact_id, sector_id, assigned_user_id, channel = 'whatsapp' } = req.body;
    
    if (!contact_id) {
      return res.status(400).json({ error: 'Contact ID is required' });
    }
    
    const result = await pool.query(
      `INSERT INTO conversations (company_id, contact_id, sector_id, assigned_user_id, channel, status, last_message_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'open', NOW(), NOW(), NOW())
       RETURNING *`,
      [payload.companyId, contact_id, sector_id, assigned_user_id, channel]
    );
    
    res.status(201).json({ conversation: result.rows[0] });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.patch('/api/conversations/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    const { id } = req.params;
    const { status, assigned_user_id, sector_id } = req.body;
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (status) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    
    if (assigned_user_id !== undefined) {
      updates.push(`assigned_user_id = $${paramIndex}`);
      values.push(assigned_user_id);
      paramIndex++;
    }
    
    if (sector_id !== undefined) {
      updates.push(`sector_id = $${paramIndex}`);
      values.push(sector_id);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(id, payload.companyId);
    
    const result = await pool.query(
      `UPDATE conversations SET ${updates.join(', ')} 
       WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json({ conversation: result.rows[0] });
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// ===== MESSAGES ROUTES =====

app.get('/api/conversations/:id/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Verify conversation belongs to company
    const convCheck = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND company_id = $2',
      [id, payload.companyId]
    );
    
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const result = await pool.query(
      `SELECT m.*,
              CASE 
                WHEN m.sender_type = 'agent' THEN p.full_name
                ELSE c.name
              END as sender_name
       FROM messages m
       LEFT JOIN profiles p ON p.user_id = m.sender_id AND m.sender_type = 'agent'
       LEFT JOIN conversations conv ON conv.id = m.conversation_id
       LEFT JOIN contacts c ON c.id = conv.contact_id AND m.sender_type = 'contact'
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC
       LIMIT $2 OFFSET $3`,
      [id, Number(limit), (Number(page) - 1) * Number(limit)]
    );
    
    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

app.post('/api/conversations/:id/messages', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    const { id } = req.params;
    const { content, media_url, media_type } = req.body;
    
    if (!content && !media_url) {
      return res.status(400).json({ error: 'Content or media is required' });
    }
    
    // Verify conversation belongs to company
    const convCheck = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND company_id = $2',
      [id, payload.companyId]
    );
    
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_type, sender_id, content, media_url, media_type, status, created_at)
       VALUES ($1, 'agent', $2, $3, $4, $5, 'sent', NOW())
       RETURNING *`,
      [id, payload.userId, content, media_url, media_type]
    );
    
    // Update conversation last_message_at
    await pool.query(
      'UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1',
      [id]
    );
    
    res.status(201).json({ message: result.rows[0] });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ===== NOTIFICATION PREFERENCES ROUTES =====

app.get('/api/notification_preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    
    // Return default preferences for now
    // You can create a notification_preferences table later if needed
    res.json({
      notification_preferences: [{
        id: '1',
        user_id: payload.userId,
        email_notifications: true,
        push_notifications: true,
        sound_enabled: true,
        new_message: true,
        new_conversation: true,
        assignment: true
      }]
    });
  } catch (error) {
    console.error('Get notification preferences error:', error);
    res.status(500).json({ error: 'Failed to get notification preferences' });
  }
});

app.patch('/api/notification_preferences', authMiddleware, async (req: Request, res: Response) => {
  try {
    const payload = (req as any).user as JWTPayload;
    
    // For now, just return success
    // Implement actual storage later if needed
    res.json({
      notification_preferences: {
        id: '1',
        user_id: payload.userId,
        ...req.body
      }
    });
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

// ===== HEALTH CHECK =====

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GovChat Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
});
