
'use server';
/**
 * @fileOverview An AI flow for attempting to remove watermarks from images.
 *
 * - removeWatermarkFromImage - A function that attempts to remove watermarks from an image.
 * - WatermarkRemoverInput - The input type for the removeWatermarkFromImage function.
 * - WatermarkRemoverOutput - The return type for the removeWatermarkFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const WatermarkRemoverInputSchema = z.object({
  imageDataUri: z.string().describe("The image data URI with the watermark. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type WatermarkRemoverInput = z.infer<typeof WatermarkRemoverInputSchema>;

const WatermarkRemoverOutputSchema = z.object({
  processedImageUrl: z.string().optional().describe("The data URI of the image with the watermark ideally removed. Expected format: 'data:image/png;base64,<encoded_data>'."),
  statusMessage: z.string().describe("A message indicating the outcome of the operation."),
});
export type WatermarkRemoverOutput = z.infer<typeof WatermarkRemoverOutputSchema>;

export async function removeWatermarkFromImage(input: WatermarkRemoverInput): Promise<WatermarkRemoverOutput> {
  return watermarkRemoverFlow(input);
}

const watermarkRemoverFlow = ai.defineFlow(
  {
    name: 'watermarkRemoverFlow',
    inputSchema: WatermarkRemoverInputSchema,
    outputSchema: WatermarkRemoverOutputSchema,
  },
  async (input) => {
    try {
      const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation', // This model supports image in/out
        prompt: [
          {media: {url: input.imageDataUri}},
          // The text prompt guides the model on what to do with the image.
          {text: "Analyze this image and identify any visible watermarks (text, logos, or patterns superimposed on the image to indicate ownership or prevent unauthorized use). Remove these watermarks. The goal is to make the image look as if the watermarks were never there, by intelligently filling in the areas where the watermarks were located, matching the surrounding content and texture. Preserve the original image quality and details as much as possible."},
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'], // We expect an image back
        },
      });

      if (media && media.url) {
        return {
          processedImageUrl: media.url,
          statusMessage: 'AI attempted to remove watermarks. Please review the result.',
        };
      } else {
        // Check if there's a text response indicating an issue
        // const responseText = (await response)?.text(); // Assuming 'response' is available if 'media' is not.
        // For simplicity, directly returning a generic message.
        return {
          statusMessage: 'AI could not process the image for watermark removal or did not return an image. The model might have refused the request due to safety filters or inability to perform the task.',
        };
      }
    } catch (error: any) {
      console.error('Error in watermarkRemoverFlow:', error);
      return {
        statusMessage: `Error during watermark removal: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
