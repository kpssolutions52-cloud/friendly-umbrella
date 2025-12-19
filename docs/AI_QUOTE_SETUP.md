# AI Quote Feature Setup

The AI Quote feature uses OpenAI's GPT models to intelligently match user requirements with available products and services.

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API account and API key
   - Sign up at https://platform.openai.com/
   - Create an API key from https://platform.openai.com/api-keys

## Installation

1. **The OpenAI package is already added to `package.json`**. 
   - For local development: Run `npm install` in `packages/backend`
   - For Railway/deployment: Railway will automatically install it during build (no manual step needed)

2. **Configure Environment Variables**:
   
   **Local Development** - Add to `packages/backend/.env`:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your-api-key-here
   OPENAI_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
   ```
   
   **Railway Deployment** - Add as environment variables in Railway dashboard:
   - Go to your backend service → Variables tab
   - Add `OPENAI_API_KEY` = `your-api-key-here`
   - (Optional) Add `OPENAI_MODEL` = `gpt-4o-mini`

   **Note**: You can use different models:
   - `gpt-4o-mini` (default) - Fast, cost-effective, recommended
   - `gpt-4o` - More capable but slower and more expensive
   - `gpt-3.5-turbo` - Older, cheaper alternative

## How It Works

1. User enters a natural language prompt describing their requirements
2. The system fetches all available products/services from the database
3. OpenAI analyzes the prompt and matches relevant products
4. Results are returned with:
   - Matching products/services
   - Summary of what was found
   - Reasoning for the matches
   - Optional suggestions for better results

## Fallback Behavior

If the OpenAI API is unavailable or fails:
- The system automatically falls back to keyword-based search
- Users will still get relevant results, though less intelligent matching

## Usage

1. Log in as a company user
2. Navigate to the Company Dashboard
3. Click the **"AI Quote"** button (with sparkle icon)
4. Enter your requirements in natural language (e.g., "I need concrete for a construction project")
5. Review the matched products and suppliers

## Cost Considerations

- OpenAI API charges per token used
- `gpt-4o-mini` is very cost-effective (~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens)
- Typical query uses ~500-2000 tokens
- Estimate: ~$0.0001 - $0.001 per query

## Troubleshooting

**Error: "AI service is not configured"**
- Make sure `OPENAI_API_KEY` is set in your `.env` file
- Restart the backend server after adding the key

**Error: "Invalid API key"**
- Verify your API key is correct
- Check that your OpenAI account has credits/usage limits

**Slow responses**
- Consider using `gpt-4o-mini` instead of `gpt-4o`
- Check your network connection
- Response times are typically 1-3 seconds
