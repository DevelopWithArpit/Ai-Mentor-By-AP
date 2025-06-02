
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {openai} from '@genkit-ai/openai'; // Step 1: Uncomment after installing the OpenAI plugin

export const ai = genkit({
  plugins: [
    googleAI(),
    // openai({apiKey: process.env.OPENAI_API_KEY}), // Step 2: Uncomment and ensure OPENAI_API_KEY is in your .env
  ],
  model: 'googleai/gemini-2.0-flash', // Default model if not specified in a flow
});

