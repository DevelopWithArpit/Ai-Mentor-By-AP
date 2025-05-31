
'use server';
/**
 * @fileOverview A flow for generating presentation outlines.
 *
 * - generatePresentationOutline - A function that generates a text outline for a presentation.
 * - GeneratePresentationInput - The input type for the generatePresentationOutline function.
 * - GeneratePresentationOutput - The return type for the generatePresentationOutline function.
 */

import {ai}from '@/ai/genkit';
import {z}from 'genkit';

const SlideSchema = z.object({
  title: z.string().describe('The title of the presentation slide.'),
  bulletPoints: z.array(z.string()).describe('A list of key bullet points for the slide content.'),
  suggestedImageDescription: z.string().describe('A brief description or keywords for an image relevant to this slide (e.g., "futuristic city skyline", "team collaborating").'),
});

const GeneratePresentationInputSchema = z.object({
  topic: z.string().describe('The main topic or subject of the presentation.'),
  numSlides: z.number().optional().describe('The desired number of slides for the presentation (e.g., 3, 5, 10). Defaults to 5 if not specified.'),
});
export type GeneratePresentationInput = z.infer<typeof GeneratePresentationInputSchema>;

const GeneratePresentationOutputSchema = z.object({
  slides: z.array(SlideSchema).describe('An array of slide objects, each containing a title, bullet points, and a suggested image description.'),
  title: z.string().optional().describe('Overall presentation title.')
});
export type GeneratePresentationOutput = z.infer<typeof GeneratePresentationOutputSchema>;

export async function generatePresentationOutline(input: GeneratePresentationInput): Promise<GeneratePresentationOutput> {
  return generatePresentationOutlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePresentationPrompt',
  input: {schema: GeneratePresentationInputSchema},
  output: {schema: GeneratePresentationOutputSchema},
  prompt: `You are an AI assistant specialized in creating presentation outlines.
Based on the topic: "{{{topic}}}"
Please generate a presentation outline with approximately {{#if numSlides}}{{numSlides}}{{else}}5{{/if}} slides.
For each slide, provide:
1. A concise title.
2. A few key bullet points (3-5 points).
3. A brief description or 2-3 keywords for a relevant image for that slide (e.g., "data analytics graph", "global network connections", "student studying").
Also provide an overall title for the presentation.
`,
});

const generatePresentationOutlineFlow = ai.defineFlow(
  {
    name: 'generatePresentationOutlineFlow',
    inputSchema: GeneratePresentationInputSchema,
    outputSchema: GeneratePresentationOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

