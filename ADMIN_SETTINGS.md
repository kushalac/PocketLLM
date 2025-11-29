# Admin Settings & Dashboard Guide

This document covers all admin functionality including model settings, user preferences, and the admin dashboard.

## Quick Summary

Admin users can:
- ✅ Configure global model settings that apply to all users
- ✅ View system metrics and logs
- ✅ Manage user preferences
- ✅ Monitor system performance

**Access**: Navigate to `/admin` (admin-only route)

## Admin Dashboard Location

**Single Location**: `/admin` dashboard only
- Cleaner UI with no duplication
- Admin-only access (secure)
- Dedicated admin workspace
- Best practice for admin interfaces

## Authentication & Access Control

### Backend Protection
- All admin endpoints protected by `adminMiddleware`
- Checks for `is_admin` flag in JWT token
- Non-admin users receive 401 Unauthorized

### Frontend Protection
- `AdminRoute` component wraps admin pages
- Redirects non-admin users to home page
- No admin UI exposed to regular users

## Global Model Settings

### What Are They?
Admin-configurable settings that apply to **all users** in the system:
- Response Timeout (10-300 seconds)
- Cache TTL (30-3600 seconds)
- Quality Threshold (0-1)
- Request Throttle Per Minute (10-1000)
- Context Window Size (1-20 messages)
- Max Response Length (500-8000 tokens)

### How to Change Settings

1. Go to `/admin` dashboard
2. Find "Global Model Settings" card
3. Click "✎ Edit Settings"
4. Modify any settings
5. Click "✓ Save & Apply"

### How Settings Apply

```
Admin saves settings
    ↓
Saved to MongoDB (AdminSettings collection)
    ↓
Updated in global cache (global.modelSettings)
    ↓
ALL users receive new settings on next request
    ↓
Settings cached in IndexedDB on frontend
```

**Result**: All users see changes immediately without reloading

## Settings Flow Architecture

### Save Flow
```
Admin POST /api/admin/model-settings
    ↓
Backend validation (range checks)
    ↓
Save to MongoDB AdminSettings
    ↓
Update global.modelSettings cache
    ↓
Log the change
    ↓
Return success response
```

### Retrieve Flow
```
User requests /api/preferences
    ↓
Backend loads AdminSettings from cache/DB
    ↓
Merges with user's UI preferences
    ↓
Returns combined settings
    ↓
Frontend caches in IndexedDB
```

### Cache Strategy (4-Tier)
1. **Frontend IndexedDB** - Fast local cache
2. **Global Memory** - `global.modelSettings` (server)
3. **MongoDB** - Persistent storage
4. **Defaults** - Hardcoded fallbacks

## Admin Dashboard Components

### Model Settings Card
- Shows current global settings
- Edit button to modify
- Save & Apply button
- Success/error messages
- Before/after change summary

### User Preferences Panel
- Browse all users
- View their preferences
- Override user settings if needed
- Reset to defaults option

### Metrics & Logs
- System performance metrics
- Chat logs
- Admin activity logs
- Clear cache option

## API Endpoints

### Get Admin Settings
```
GET /api/admin/model-settings
Response: { settings: {...} }
```

### Update Admin Settings
```
POST /api/admin/model-settings
Body: { responseTimeout: 60, cacheTTL: 300, ... }
Response: { success: true, settings: {...} }
```

### Get User Preferences (Admin)
```
GET /api/admin/user-preferences/:userId
Response: { preferences: {...} }
```

### Update User Preferences (Admin)
```
POST /api/admin/user-preferences/:userId
Body: { responseTimeout: 50, ... }
Response: { success: true, preferences: {...} }
```

## Database Models

### AdminSettings Collection
```javascript
{
  setting_type: "model_settings",
  responseTimeout: 60,
  cacheTTL: 300,
  qualityThreshold: 0.7,
  requestThrottlePerMinute: 60,
  contextWindowSize: 8,
  maxResponseLength: 2000,
  created_at: Date,
  updated_at: Date
}
```

### UserPreferences Collection
```javascript
{
  user_id: ObjectId,
  // Model settings (inherited from admin by default)
  responseTimeout: 60,
  cacheTTL: 300,
  qualityThreshold: 0.7,
  requestThrottlePerMinute: 60,
  contextWindowSize: 8,
  maxResponseLength: 2000,
  // UI preferences
  themePreference: "auto",
  messageGrouping: true,
  autoScroll: true,
  showTimestamps: false,
  // Session settings
  autoDeleteAfterDays: null,
  created_at: Date,
  updated_at: Date
}
```

## Key Implementation Details

### How Admin Settings Apply to All Users

1. **Single Source of Truth**: AdminSettings collection stores one record
2. **Global Cache**: `global.modelSettings` keeps it in memory
3. **Automatic Application**: Backend always merges admin settings when returning user preferences
4. **Immediate Effect**: Changes are visible to all users on next request

### Before/After Tracking
- System logs which admin made changes
- Shows what changed (before/after values)
- Timestamp of changes
- Number of fields changed

### Validation & Safety
- All numeric inputs validated against ranges
- Type checking for settings
- Required fields validation
- Error messages returned to user

## Troubleshooting

### Settings Not Applying
1. Check if admin is actually admin: `user.is_admin === true`
2. Verify MongoDB connection: `mongosh <connection_string>`
3. Check cache: Look at `global.modelSettings` in Node console
4. Clear IndexedDB: Use browser DevTools

### Admin Can't Access Dashboard
1. Verify user is admin: Check DB `users` collection
2. Check JWT token includes `is_admin: true`
3. Verify `AdminRoute` protection is working
4. Check browser console for errors

### Changes Not Visible to Other Users
1. Verify settings saved to MongoDB (check DB)
2. Restart backend to reload cache
3. Other users must refresh browser to clear IndexedDB
4. Check Network tab - API should return new values

## Backend Files

- `backend/models/AdminSettings.js` - Schema for global settings
- `backend/controllers/adminController.js` - Admin endpoints
- `backend/services/UserPreferencesService.js` - Preference merging logic
- `backend/middleware/adminMiddleware.js` - Admin route protection

## Frontend Files

- `frontend/src/features/admin/AdminDashboard.jsx` - Main admin page
- `frontend/src/features/admin/ModelSettings.jsx` - Settings editor
- `frontend/src/features/admin/UserPreferencesPanel.jsx` - User preference management
- `frontend/src/features/admin/AdminRoute.jsx` - Route protection
- `frontend/src/core/CacheService.js` - IndexedDB caching

## Summary of Settings Apply to All Users

✅ **How it works**:
1. Admin changes a setting
2. Saved to MongoDB
3. Updated in global cache
4. All users get new value on next API call
5. No toggle or flag needed

✅ **Benefits**:
- Consistent experience across all users
- Single point of configuration
- Immediate effect
- No complex inheritance logic

✅ **User Experience**:
- Settings appear automatically
- No page refresh needed in most cases
- Seamless transition
- No user action required

## Common Use Cases

### Scenario 1: Reduce Response Timeout During High Load
```
1. Admin goes to /admin
2. Changes Response Timeout from 60s to 30s
3. Saves settings
4. All active users see 30s timeout on next response
5. Prevents long waits during overload
```

### Scenario 2: Increase Cache TTL for Better Performance
```
1. Admin notices many repeated queries
2. Changes Cache TTL from 300s to 600s
3. Saves settings
4. All users benefit from longer cache window
5. Fewer API calls to Ollama
```

### Scenario 3: Adjust Quality Threshold
```
1. Admin wants stricter quality checking
2. Changes Quality Threshold from 0.7 to 0.8
3. Saves settings
4. All users' responses now filtered with stricter threshold
5. Better quality but possibly fewer results
```

## Next Steps

1. **Navigate to Admin**: Go to `http://localhost:3000/admin`
2. **Edit Model Settings**: Click Edit Settings button
3. **Make Changes**: Adjust any setting value
4. **Save & Apply**: Click Save & Apply button
5. **Verify**: Check other user sessions to see immediate changes

---

**Last Updated**: November 2025
**Implementation**: Complete ✅
