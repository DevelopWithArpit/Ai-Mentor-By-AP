
'use server';
/**
 * @fileOverview A flow for generating diagram-like images from text prompts, including engineering graphics.
 *
 * - wrappedGenerateDiagram - A function that generates a diagram image using a defined flow.
 * - GenerateDiagramInput - The input type for the generateDiagram function.
 * - GenerateDiagramOutput - The return type for the generateDiagram function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const GenerateDiagramInputSchema = z.object({
  prompt: z.string().describe('A text prompt describing the diagram to be generated (e.g., flowchart, mind map, sequence diagram, basic engineering schematic).'),
});
export type GenerateDiagramInput = z.infer<typeof GenerateDiagramInputSchema>;

const GenerateDiagramOutputSchema = z.object({
  diagramImageUrl: z.string().describe("The data URI of the generated diagram image. Expected format: 'data:image/png;base64,<encoded_data>'."),
});
export type GenerateDiagramOutput = z.infer<typeof GenerateDiagramOutputSchema>;

// Core logic for generating a diagram
async function generateDiagram(input: GenerateDiagramInput): Promise<GenerateDiagramOutput> {
  const {media} = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp', // IMPORTANT: Use this specific model for image generation
    prompt: `You are an AI assistant that creates technical diagrams and engineering graphics. Generate an image based on the following description. Aim for clarity and accuracy typical of engineering drawings or schematics where appropriate: ${input.prompt}`,
    config: {
      responseModalities: ['TEXT', 'IMAGE'], // Must include TEXT and IMAGE
    },
  });

  if (media && media.url) {
    return { diagramImageUrl: media.url };
  }
  throw new Error('Diagram generation failed or no image was returned.');
}

const generateDiagramFlow = ai.defineFlow(
  {
    name: 'generateDiagramFlow',
    inputSchema: GenerateDiagramInputSchema,
    outputSchema: GenerateDiagramOutputSchema,
  },
  async (input) => {
    return generateDiagram(input); // Call the core logic function
  }
);

// Exported wrapper function that invokes the Genkit flow
export async function wrappedGenerateDiagram(input: GenerateDiagramInput): Promise<GenerateDiagramOutput> {
  return generateDiagramFlow(input);
}

