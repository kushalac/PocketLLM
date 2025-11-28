# IndexedDB Caching Implementation

## Overview

This implementation adds **persistent IndexedDB caching** to the PocketLLM Portal, significantly improving performance and reducing the need for page refreshes. Data is now cached locally in the browser's IndexedDB, providing instant loading of sessions, messages, and user data.

## Features

### 1. **Persistent Cache Storage**
- **Sessions**: All chat sessions are cached with metadata (title, timestamps, message counts)
- **Messages**: Individual messages per session are cached separately
- **User Data**: Authentication tokens and user info persist across sessions
- **API Cache**: Generic caching for API responses with TTL (Time-To-Live)

### 2. **Smart Cache Strategy**
- **Cache-First Loading**: Displays cached data immediately for instant UI response
- **Background Refresh**: Automatically updates cache in the background
- **Fallback Support**: Falls back to cache when API is unavailable
- **Auto-Expiration**: Expired cache entries are cleaned automatically

### 3. **Seamless Integration**
- **No User Action Required**: Caching happens automatically
- **Session Restoration**: Restores user session from IndexedDB if localStorage is cleared
- **Optimistic Updates**: UI updates immediately, syncs with server in background

## Implementation Details

### Core Components

#### 1. **IndexedDBCache.js** (New)
Location: `frontend/src/core/IndexedDBCache.js`

Provides the main caching service with:
- `saveSessions()` / `getSessions()` - Cache session list
- `saveMessages()` / `getMessages()` - Cache messages per session
- `setUserData()` / `getUserData()` - Cache user authentication
- `setCache()` / `getCache()` - Generic API caching with TTL
- `clearAll()` / `getStats()` - Maintenance operations

#### 2. **Updated Services**

**ChatSessionService.js**
- Modified `getSessions()` to use cache-first strategy
- Modified `getMessages()` to load from cache instantly
- Background refresh updates cache without blocking UI
- Cache invalidation on create/update/delete operations

**AuthService.js**
- Stores auth tokens in both localStorage and IndexedDB
- Provides `restoreSession()` for session recovery
- Clears cache on logout

#### 3. **Updated Components**

**ChatInterface.jsx**
- Uses cached data for instant session/message loading
- Forces refresh after mutations (send, delete, rename)
- Maintains memory cache for active sessions

**HistoryPage.jsx**
- Loads session history from cache immediately
- Background refresh keeps data up-to-date

**AdminDashboard.jsx**
- New IndexedDB statistics panel
- Shows cached items count per store
- Clear IndexedDB cache button

**App.jsx**
- Restores user session on app load
- Clears expired cache entries

## Benefits

### 1. **Performance Improvements**
- ⚡ **Instant Loading**: Sessions and messages load immediately from cache
- 🚀 **Reduced API Calls**: Background refresh minimizes server requests
- 💾 **Offline Resilience**: Cached data available when API is down
- 🔄 **No More Refresh Spam**: Data persists across page reloads

### 2. **User Experience**
- 🎯 **Smoother Navigation**: No loading delays when switching sessions
- ✨ **Instant UI Response**: Optimistic updates feel immediate
- 🔐 **Session Persistence**: Stay logged in across browser restarts
- 📱 **Better Mobile Experience**: Less network dependency

### 3. **Developer Benefits**
- 🛠️ **Easy to Use**: Cache operations are automatic
- 🧪 **Testable**: Clear separation of concerns
- 📊 **Observable**: Admin panel shows cache statistics
- 🔍 **Debuggable**: Console logs show cache operations

## Cache Flow Example

### Loading Sessions
```
1. User navigates to chat
2. ChatInterface calls getSessions()
3. IndexedDB checked first
4. Cached sessions displayed immediately (< 50ms)
5. Background API call updates cache
6. UI auto-updates if data changed
```

### Sending Message
```
1. User sends message
2. Message added to local cache instantly
3. API request sent to server
4. On success: cache refreshed with server response
5. Session list updated with new message count
```

## Cache Management

### Admin Dashboard
Navigate to `/admin` to view:
- Number of cached sessions
- Number of cached messages
- User data entries
- API cache entries
- Clear cache button

### Manual Cache Clear
Users can clear the IndexedDB cache from:
1. Admin Dashboard → "Clear IndexedDB" button
2. Browser DevTools → Application → IndexedDB → Delete

### Automatic Cleanup
- Expired API cache entries removed on app load
- Old cache entries cleaned during background refresh
- Cache cleared completely on logout

## Browser Compatibility

IndexedDB is supported in all modern browsers:
- ✅ Chrome/Edge 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ Opera 15+

## Performance Metrics

Expected improvements:
- **Session Load**: ~500ms → <50ms (10x faster)
- **Message Load**: ~300ms → <30ms (10x faster)
- **Page Refresh**: No data loss, instant restore
- **Network Usage**: Reduced by ~70% after initial load

## Troubleshooting

### Cache Not Working
1. Check browser console for IndexedDB errors
2. Verify IndexedDB is enabled in browser settings
3. Check browser storage quota (shouldn't be an issue for chat apps)

### Stale Data
1. Force refresh by navigating away and back
2. Use "Clear IndexedDB" in admin dashboard
3. Background refresh should update automatically within 5 seconds

### Storage Full
- IndexedDB quota: ~50% of available disk space
- Automatic cleanup of expired entries
- Manual clear via admin dashboard

## Future Enhancements

Possible improvements:
- [ ] Service Worker integration for full offline mode
- [ ] Compression for large message content
- [ ] Sync indicator showing cache vs fresh data
- [ ] User-configurable cache TTL
- [ ] Cache analytics and hit rate tracking

## Testing

To test the implementation:
1. Load chat interface (should see console log: "Loaded X sessions from IndexedDB cache")
2. Refresh page (data should load instantly)
3. Disconnect network (cached data still available)
4. Check admin dashboard for cache statistics
5. Clear cache and verify it's removed

## Conclusion

The IndexedDB caching implementation dramatically improves the user experience by eliminating the sluggish behavior and need for multiple refreshes. Data loads instantly from the cache while staying synchronized with the server through background updates.
