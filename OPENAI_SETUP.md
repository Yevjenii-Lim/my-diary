# OpenAI API Setup for AI Writing Suggestions

## Overview
The diary app now includes AI-powered writing suggestions that analyze your writing history and generate personalized prompts. This feature uses OpenAI's GPT-3.5-turbo model to create intelligent, context-aware writing suggestions.

## Setup Instructions

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to "API Keys" in your dashboard
4. Click "Create new secret key"
5. Copy the generated API key

### 2. Add Environment Variable
Add your OpenAI API key to your `.env.local` file:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Restart Your Development Server
After adding the environment variable, restart your development server:

```bash
npm run dev
```

## How It Works

### AI Analysis Process
1. **User Profile Analysis**: The system analyzes your writing history to understand:
   - Writing patterns and style
   - Common themes and topics
   - Entry length preferences
   - Writing frequency and streaks

2. **Context Building**: For each topic, the AI receives:
   - Your writing profile
   - Topic title and description
   - Recent entries for context

3. **Personalized Suggestions**: The AI generates 4-6 writing suggestions that are:
   - Tailored to your writing style
   - Relevant to the specific topic
   - Varied in difficulty (beginner, intermediate, advanced)
   - Engaging and actionable

### Features
- **Real-time Generation**: Suggestions are generated on-demand
- **Fallback System**: If AI is unavailable, intelligent fallback suggestions are provided
- **Refresh Capability**: Generate new suggestions anytime
- **Confidence Scoring**: Each suggestion includes a confidence level
- **Reasoning**: AI explains why each suggestion fits your profile

### Cost Considerations
- Uses GPT-3.5-turbo (cost-effective model)
- Limited to 1500 tokens per request
- Estimated cost: ~$0.002 per suggestion set
- Fallback system ensures functionality even without API access

## Troubleshooting

### Common Issues
1. **"OpenAI API key not found"**: Check your `.env.local` file
2. **"Failed to generate AI suggestions"**: Verify your API key is valid
3. **Rate limiting**: OpenAI has rate limits; wait a moment and try again

### Fallback Behavior
If the AI service is unavailable, the app will:
- Show intelligent fallback suggestions
- Continue to function normally
- Display a message indicating AI is unavailable

## Privacy & Security
- Your writing content is sent to OpenAI for analysis
- No data is stored by OpenAI beyond the request
- API keys are kept secure in environment variables
- Consider OpenAI's privacy policy for your use case

## Customization
You can modify the AI behavior by editing:
- `src/lib/ai-suggestions.ts` - AI service logic
- `src/app/api/ai-suggestions/route.ts` - API endpoint
- System prompts in the AI service for different suggestion styles
