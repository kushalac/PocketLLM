# Quick Start Guide

## Windows/Mac/Linux

### Terminal 1 - Backend
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

You should see: `Server running on http://localhost:5000`

### Terminal 2 - Frontend  
\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

You should see: Browser opens to `http://localhost:3000`

## First Time Setup

1. **Register**: Click "Register", fill in username, email, password
2. **Login**: Use your credentials to login
3. **Chat**: Start chatting with the AI

## Common Issues

| Issue | Solution |
|-------|----------|
| Signup fails | Check backend is running (Terminal 1) |
| No styling | Clear cache & refresh browser (Ctrl+Shift+R) |
| Port in use | Kill process on port 5000 or 3000 |
| Database error | Ensure MongoDB is running and `MONGODB_URI` is configured in the backend `.env` |



## Next Steps

- Customize LLM responses in `backend/services/LLMService.js`
- Add more features in `backend/controllers/chatController.js`
- Modify styling in `frontend/src/index.css`
