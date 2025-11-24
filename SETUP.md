# PocketLLM Portal - Setup Guide

## Database

**MongoDB (Mongoose)**: The application uses MongoDB for data persistence via Mongoose.

- **Connection**: Configure the connection using `MONGODB_URI` in the backend `.env` file (example below).
- **Collections**:
  - `users` - User accounts and authentication
    - `chatsessions` - Chat conversation sessions
    - `messages` - Individual messages in chats
    - `logs` - System logs

  The backend will connect to MongoDB on startup and create collections as needed.

  ## Installation & Running

  ### Prerequisites
  - Node.js 16+
  - npm or yarn
  - MongoDB running locally or a reachable MongoDB URI

  ### Backend Setup

  ```powershell
  cd backend

  # Install dependencies
  npm install

  # Create .env file (edit MONGODB_URI as appropriate)
  copy .env.example .env

  # Start development server (with auto-reload)
  npm run dev

  # Or start production server
  npm start
  ```

  On startup the backend will:
  1. Connect to MongoDB using `MONGODB_URI`
  2. Create necessary collections automatically
  3. Run on `http://localhost:5000`
  4. Expose API endpoints under `/api`

  ### Frontend Setup

  ```powershell
  cd frontend

  # Install dependencies
  npm install

  # Start development server
  npm start
  ```

  The frontend will:
  1. Load Tailwind CSS styling
  2. Run on `http://localhost:3000`
  3. Connect to backend at `http://localhost:5000/api`

  ## How to Use

  ### 1. Signup
  - Navigate to `http://localhost:3000`
  - Click "Register"
  - Enter username, email, and password (minimum 6 characters)
  - Click "Register" button

  ### 2. Login
  - Enter your username and password
  - Click "Sign In"

  ### 3. Chat
  - Start a new conversation
  - Type your message and send
  - Receive AI responses with streaming
  - Manage chat sessions in the sidebar

  ### 4. Admin Dashboard (if admin user)
  - Login with admin account
  - Navigate to `/admin`
  - View system metrics, cache stats, and logs

  ## Environment Variables

  ### Backend (.env)
  ```
  PORT=5000
  JWT_SECRET=your_secret_key_change_in_production
  NODE_ENV=development
  MONGODB_URI=mongodb://localhost:27017/pocketllm
  ```

  ### Frontend (.env)
  ```
  REACT_APP_API_URL=http://localhost:5000/api
  ```

  ## Troubleshooting

  ### Signup Not Working
  - Ensure backend is running on port 5000
  - Check that `REACT_APP_API_URL` is correctly set in frontend
  - Check browser console for errors (F12)

  ### No Styling Visible
  - Clear browser cache (Ctrl+Shift+Delete)
  - Restart frontend: `npm start`
  - Ensure TailwindCSS is installed: `npm install tailwindcss postcss autoprefixer`

  ### Database Issues
  - Ensure MongoDB is running and `MONGODB_URI` is set correctly in `.env`
  - Restart backend server after updating environment variables

  ### Port Already in Use
  - Backend: Change `PORT` in `.env`
  - Frontend: `npm start` will prompt for alternative port

  ## API Endpoints

  ### Authentication
  - `POST /api/auth/register` - Create new user
  - `POST /api/auth/login` - Login user

  ### Chat
  - `POST /api/chat/sessions` - Create chat session
  - `GET /api/chat/sessions` - List user's sessions
  - `POST /api/chat/send` - Send message (with streaming)
  - `PUT /api/chat/sessions/:id` - Rename session
  - `DELETE /api/chat/sessions/:id` - Delete session

  ### Admin
  - `GET /api/admin/stats` - Get system statistics
  - `GET /api/admin/cache` - Get cache statistics
  - `GET /api/admin/logs` - Get system logs

  ``` 
