
'use server';
/**
 * @fileOverview An AI flow for manipulating text within an image based on user instructions.
 *
 * - manipulateImageText - A function that attempts to edit text in an image.
 * - ManipulateImageTextInput - The input type for the manipulateImageText function.
 * - ManipulateImageTextOutput - The return type for the manipulateImageText function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const ManipulateImageTextInputSchema = z.object({
  imageDataUri: z.string().describe("The image data URI containing text to be manipulated. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  instruction: z.string().describe("User instruction on how to manipulate the text (e.g., 'Change \"Old Text\" to \"New Text\"', 'Remove the title')."),
});
export type ManipulateImageTextInput = z.infer<typeof ManipulateImageTextInputSchema>;

const ManipulateImageTextOutputSchema = z.object({
  processedImageUrl: z.string().optional().describe("The data URI of the image with manipulated text. Expected format: 'data:image/png;base64,<encoded_data>'."),
  statusMessage: z.string().describe("A message indicating the outcome of the operation."),
});
export type ManipulateImageTextOutput = z.infer<typeof ManipulateImageTextOutputSchema>;

export async function manipulateImageText(input: ManipulateImageTextInput): Promise<ManipulateImageTextOutput> {
  return manipulateImageTextFlow(input);
}

const manipulateImageTextFlow = ai.defineFlow(
  {
    name: 'manipulateImageTextFlow',
    inputSchema: ManipulateImageTextInputSchema,
    outputSchema: ManipulateImageTextOutputSchema,
  },
  async (input) => {
    try {
      const {media, text: modelTextResponse} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-exp', 
        prompt: [
          {media: {url: input.imageDataUri}},
          {text: `Instruction for image text manipulation: ${input.instruction}. Analyze the provided image. Identify text relevant to the instruction. Modify the text in the image according to this instruction. For example, if asked to change text 'A' to 'B', find 'A' in the image and replace it with 'B', attempting to match the original style and context. If asked to remove text, remove it and fill the background cohesively. Preserve overall image quality. If the instruction cannot be reasonably applied (e.g., text not found, instruction unclear for image content), explain why in a brief text response instead of returning a modified image.`},
        ],
        config: {
          responseModalities: ['TEXT', 'IMAGE'], 
        },
      });

      if (media && media.url) {
        return {
          processedImageUrl: media.url,
          statusMessage: 'AI attempted to manipulate text in the image. Please review the result.',
        };
      } else {
        return {
          statusMessage: modelTextResponse || 'AI could not process the image for text manipulation or did not return a modified image. The model might have refused or failed to perform the task.',
        };
      }
    } catch (error: any) {
      console.error('Error in manipulateImageTextFlow:', error);
      return {
        statusMessage: `Error during AI image text manipulation: ${error.message || 'Unknown error'}`,
      };
    }
  }
);
