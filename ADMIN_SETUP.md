# Admin User Setup Guide

## Making a User an Admin

To access the admin dashboard at `/admin`, a user must have the `is_admin` flag set to `true` in the database.

### Method 1: Using the Make Admin Script (Recommended)

1. **Ensure the backend container is running:**
   ```bash
   docker-compose up -d
   ```

2. **Run the make-admin script:**
   ```bash
   # Enter the backend container
   docker exec -it pocketllm-backend sh

   # Inside the container, run:
   npm run make-admin <username>
   ```

   Example:
   ```bash
   npm run make-admin john
   ```

   You should see:
   ```
   Connected to MongoDB
   ✅ User "john" is now an admin!
   ```

3. **Log out and log back in:**
   - The user needs to log out and log back in for the admin token to be generated
   - After logging back in, navigate to `/admin` to access the admin dashboard

### Method 2: Using MongoDB Shell

1. **Connect to MongoDB:**
   ```bash
   docker exec -it pocketllm-mongodb mongosh
   ```

2. **Switch to the database:**
   ```javascript
   use pocketllm
   ```

3. **Update the user:**
   ```javascript
   db.users.updateOne(
     { username: "your_username" },
     { $set: { is_admin: true } }
   )
   ```

4. **Verify the change:**
   ```javascript
   db.users.findOne({ username: "your_username" })
   ```

5. **Log out and log back in** for the changes to take effect

### Method 3: Using MongoDB Compass (GUI)

1. Connect to `mongodb://localhost:27017`
2. Select the `pocketllm` database
3. Open the `users` collection
4. Find the user you want to make admin
5. Edit the document and set `is_admin: true`
6. Save the changes
7. User needs to log out and log back in

## Verifying Admin Access

1. **Log in** with the admin user
2. **Check the console** for the user object - it should have `is_admin: true`
3. **Navigate to `/admin`** - you should see the admin dashboard
4. If you see "Admin access required" error, the token doesn't have admin rights - log out and log back in

## Admin Dashboard Features

Once you have admin access, you can:

- **View Metrics**: See total requests, chats, messages, and response times
- **Cache Management**: View and clear server-side LRU cache
- **IndexedDB Stats**: View browser cache statistics (sessions, messages, user data)
- **Logs**: View system logs and clear them
- **Reset Metrics**: Reset all metrics to zero

## Troubleshooting

### "Admin access required" error

**Problem**: You see a 403 error when accessing `/admin`

**Solution**: 
1. Check if the user has `is_admin: true` in MongoDB
2. Log out completely from the app
3. Log back in to get a new token with admin rights
4. Try accessing `/admin` again

### Script not found error

**Problem**: `npm run make-admin` doesn't work

**Solution**:
1. Make sure you're in the backend directory
2. Run `npm install` to ensure all dependencies are installed
3. Try running directly: `node scripts/makeAdmin.js <username>`

### Cannot connect to MongoDB

**Problem**: Script shows MongoDB connection error

**Solution**:
1. Ensure MongoDB container is running: `docker ps | grep mongodb`
2. Check the connection string in the script matches your setup
3. If using docker-compose, the MongoDB host is `mongodb`, not `localhost`

### User not found

**Problem**: "User not found" message when running the script

**Solution**:
1. Verify the username is correct (case-sensitive)
2. Check users in MongoDB: `docker exec -it pocketllm-mongodb mongosh pocketllm --eval "db.users.find({}, {username: 1})"`
3. Register the user if they don't exist

## Security Notes

- ⚠️ **Be careful** who you give admin access to
- Admin users can view all logs, metrics, and system information
- Admin users can clear cache and reset metrics
- There's no way to remove admin access from the UI - use MongoDB directly

## First-Time Setup

When setting up the app for the first time:

1. Register a new user via `/register`
2. Use one of the methods above to make that user an admin
3. Log out and log back in
4. Access `/admin` to verify admin access works
5. You're ready to go!
