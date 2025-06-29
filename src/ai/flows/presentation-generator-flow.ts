
'use server';
/**
 * @fileOverview A flow for generating presentation outlines, now including generated images per slide
 * and an option to influence image style.
 *
 * - generatePresentationOutline - A function that generates a text outline and images for a presentation.
 * - GeneratePresentationInput - The input type for the generatePresentationOutline function.
 * - GeneratePresentationOutput - The return type for the generatePresentationOutline function.
 */

import {ai}from '@/ai/genkit';
import {z}from 'genkit';

const SlideSchema = z.object({
  title: z.string().describe('The title of the presentation slide.'),
  bulletPoints: z.array(z.string()).describe('A list of key bullet points for the slide content.'),
  suggestedImageDescription: z.string().describe('A brief description or keywords for an image relevant to this slide (e.g., "futuristic city skyline", "team collaborating").'),
  imageUrl: z.string().optional().describe("The data URI of the AI-generated image for this slide. Expected format: 'data:image/png;base64,<encoded_data>'."),
});

const GeneratePresentationInputSchema = z.object({
  topic: z.string().describe('The main topic or subject of the presentation.'),
  numSlides: z.number().optional().describe('The desired number of slides for the presentation (e.g., 3, 5, 10). Defaults to 5 if not specified.'),
  imageStylePrompt: z.string().optional().describe('An optional text prompt to influence the visual style of generated images (e.g., "vintage art style", "minimalist flat design", "vibrant cartoonish look").'),
});
export type GeneratePresentationInput = z.infer<typeof GeneratePresentationInputSchema>;

const GeneratePresentationOutputSchema = z.object({
  slides: z.array(SlideSchema).describe('An array of slide objects, each containing a title, bullet points, a suggested image description, and potentially an imageUrl.'),
  title: z.string().optional().describe('Overall presentation title.')
});
export type GeneratePresentationOutput = z.infer<typeof GeneratePresentationOutputSchema>;

// This prompt remains for generating the text structure and image descriptions
const textOutlinePrompt = ai.definePrompt({
  name: 'generatePresentationTextPrompt',
  input: {schema: GeneratePresentationInputSchema}, // Input schema includes imageStylePrompt but it's not directly used in *this* prompt template
  output: {
    schema: z.object({
      slides: z.array(z.object({
        title: z.string(),
        bulletPoints: z.array(z.string()),
        suggestedImageDescription: z.string(),
      })),
      title: z.string().optional(),
    })
  },
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
  async (input): Promise<GeneratePresentationOutput> => {
    // Step 1: Generate the text outline and image descriptions
    const {output: textOutput} = await textOutlinePrompt({ topic: input.topic, numSlides: input.numSlides }); // Only pass relevant fields to this prompt
    if (!textOutput) {
      throw new Error('Failed to generate presentation text outline.');
    }

    const slidesWithImages: z.infer<typeof SlideSchema>[] = [];

    // Step 2: Iterate through slides and generate images
    for (const slideTextData of textOutput.slides) {
      let imageUrl: string | undefined = undefined;
      if (slideTextData.suggestedImageDescription && slideTextData.suggestedImageDescription.trim() !== "") {
        try {
          let imageGenPrompt = `Generate an image for a presentation slide. The slide is about "${slideTextData.title}". The desired image content is: ${slideTextData.suggestedImageDescription}. Make it visually appealing for a presentation.`;
          if (input.imageStylePrompt && input.imageStylePrompt.trim() !== "") {
            imageGenPrompt += ` Apply the following style: ${input.imageStylePrompt.trim()}.`;
          }
          
          console.log(`Generating image for slide: ${slideTextData.title} with prompt: ${imageGenPrompt}`);
          const {media} = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: imageGenPrompt,
            config: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          });
          if (media && media.url) {
            imageUrl = media.url;
            console.log(`Successfully generated image for slide: ${slideTextData.title}`);
          } else {
            console.warn(`Image generation did not return a URL for slide: ${slideTextData.title}`);
          }
        } catch (error) {
          console.error(`Failed to generate image for slide "${slideTextData.title}":`, error);
          // Continue without image for this slide
        }
      }
      slidesWithImages.push({
        ...slideTextData,
        imageUrl: imageUrl,
      });
    }

    return {
      title: textOutput.title,
      slides: slidesWithImages,
    };
  }
);

export async function generatePresentationOutline(input: GeneratePresentationInput): Promise<GeneratePresentationOutput> {
  return generatePresentationOutlineFlow(input);
}
