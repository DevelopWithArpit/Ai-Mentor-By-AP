
'use server';
/**
 * @fileOverview A flow for generating images from text prompts.
 *
 * - generateImage - A function that generates an image.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the image to be generated.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the generated image. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const {media} = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Use this specific model for image generation
    prompt: input.prompt,
    config: {
      responseModalities: ['TEXT', 'IMAGE'], // Must include TEXT and IMAGE
    },
  });

  if (media && media.url) {
    return { imageUrl: media.url };
  }
  throw new Error('Image generation failed or no image was returned.');
}

// Note: We don't define a flow with ai.defineFlow for direct ai.generate calls if no further logic is needed.
// However, if you plan to add more steps or use tools, wrapping it in a flow is a good practice.
// For consistency with other flows, let's wrap it.

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    return generateImage(input); // Call the function defined above
  }
);

// Exporting the wrapper function that calls the flow.
export async function wrappedGenerateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}
