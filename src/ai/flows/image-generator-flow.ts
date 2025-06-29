
'use server';
/**
 * @fileOverview A flow for generating images from text prompts.
 *
 * - wrappedGenerateImage - A function that generates an image using a defined flow.
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

// Core logic for generating an image
async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  const {media} = await ai.generate({
    model: 'googleai/gemini-2.0-flash-preview-image-generation', // IMPORTANT: Use this specific model for image generation
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

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    return generateImage(input); // Call the core logic function
  }
);

// Exporting the wrapper function that calls the flow.
export async function wrappedGenerateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

