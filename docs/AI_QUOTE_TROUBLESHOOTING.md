# AI Quote Assistant Troubleshooting Guide

## Common Issues and Solutions

### 1. "AI service is not configured" Error

**Error Message:**
```
AI service is not configured. Please set OPENAI_API_KEY environment variable.
```

**Solution:**
1. Add OpenAI API key to backend `.env` file:
   ```bash
   OPENAI_API_KEY=your-api-key-here
   OPENAI_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
   ```

2. Restart the backend server after adding the key.

### 2. Chatbot Not Responding / Timeout Errors

**Possible Causes:**
- Network timeout (default is 60 seconds)
- OpenAI API rate limits
- Large product database causing slow processing

**Solutions:**
- Check browser console for error messages
- Verify OpenAI API key is valid and has credits
- Check backend logs for detailed error messages
- Try a simpler query first

### 3. "No products found" Response

**Cause:** Database has no active products with pricing

**Solution:**
- Ensure products are created in the system
- Verify products have `isActive: true`
- Check that products have default or private prices set

### 4. Frontend Errors

**Check:**
1. Browser console (F12) for JavaScript errors
2. Network tab for failed API requests
3. Verify API URL is correct in `.env`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

### 5. CORS Errors

**Error:** `Access-Control-Allow-Origin` errors

**Solution:**
- Verify backend CORS is configured correctly
- Check that frontend URL is allowed in backend CORS settings

## Testing the AI Quote Assistant

### Manual Test:
1. Navigate to landing page
2. Click "AI Quote" tab
3. Type a query like: "I need concrete for construction"
4. Check browser console and network tab for errors

### Backend Test:
```bash
curl -X POST http://localhost:8000/api/v1/quotes/ai-search \
  -H "Content-Type: application/json" \
  -d '{"prompt": "I need concrete"}'
```

## Debug Steps

1. **Check Environment Variables:**
   ```bash
   # Backend
   cd packages/backend
   cat .env | grep OPENAI
   ```

2. **Check Backend Logs:**
   - Look for `[AI-Quote]` log messages
   - Check for OpenAI API errors

3. **Check Frontend Console:**
   - Open browser DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

4. **Verify API Endpoint:**
   - Test endpoint directly: `POST /api/v1/quotes/ai-search`
   - Check response status and error messages

## Quick Fixes

### If chatbot shows error immediately:
- Check if `OPENAI_API_KEY` is set in backend `.env`
- Verify the API key is valid
- Restart backend server

### If chatbot times out:
- Check OpenAI API status
- Verify network connection
- Try a shorter, simpler query

### If no products are returned:
- Verify products exist in database
- Check product `isActive` status
- Ensure products have prices set

