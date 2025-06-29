
'use server';
/**
 * @fileOverview An AI flow for generating suggestions for LinkedIn profile pictures and cover images.
 *
 * - generateLinkedInVisuals - A function that generates image suggestions.
 * - GenerateLinkedInVisualsInput - The input type for the generateLinkedInVisuals function.
 * - GenerateLinkedInVisualsOutput - The return type for the generateLinkedInVisuals function.
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

const GenerateLinkedInVisualsInputSchema = z.object({
  fullName: z.string().describe("The user's full name, to potentially inspire stylized initials or abstract designs for the profile picture."),
  professionalTitle: z.string().describe("The user's professional title or field (e.g., 'Software Engineer', 'UX Designer', 'Marketing Specialist'). This will heavily influence the theme of the cover image."),
  resumeContent: z.string().optional().describe("The user's resume content (text). If provided, this will be used to generate a portfolio-style cover image, taking precedence over the professional title."),
  stylePreference: z.enum(["professional-minimalist", "creative-abstract", "modern-tech", "elegant-corporate", "vibrant-energetic"]).optional().default("professional-minimalist").describe("The desired visual style for the generated images."),
});
export type GenerateLinkedInVisualsInput = z.infer<typeof GenerateLinkedInVisualsInputSchema>;

const GenerateLinkedInVisualsOutputSchema = z.object({
  suggestedProfilePictureUrl: z.string().optional().describe("The data URI of the AI-generated suggestion for a profile picture. Expected format: 'data:image/png;base64,<encoded_data>'. This will be an abstract design, pattern, or stylized initials, NOT a realistic human face."),
  suggestedCoverImageUrl: z.string().optional().describe("The data URI of the AI-generated suggestion for a LinkedIn cover image. Expected format: 'data:image/png;base64,<encoded_data>'. This image will be themed around the professional title."),
  profilePicturePromptUsed: z.string().optional().describe("The prompt used to generate the profile picture, for user reference."),
  coverImagePromptUsed: z.string().optional().describe("The prompt used to generate the cover image, for user reference."),
});
export type GenerateLinkedInVisualsOutput = z.infer<typeof GenerateLinkedInVisualsOutputSchema>;

export async function generateLinkedInVisuals(input: GenerateLinkedInVisualsInput): Promise<GenerateLinkedInVisualsOutput> {
  return generateLinkedInVisualsFlow(input);
}

const generateLinkedInVisualsFlow = ai.defineFlow(
  {
    name: 'generateLinkedInVisualsFlow',
    inputSchema: GenerateLinkedInVisualsInputSchema,
    outputSchema: GenerateLinkedInVisualsOutputSchema,
  },
  async (input): Promise<GenerateLinkedInVisualsOutput> => {
    let profilePictureUrl: string | undefined;
    let coverImageUrl: string | undefined;

    const profilePicPrompt = `Generate a professional LinkedIn profile picture. Style: ${input.stylePreference}. Theme it subtly around the name "${input.fullName}" and title "${input.professionalTitle}". Consider an abstract design, a professional geometric pattern, elegant stylized initials based on "${input.fullName}", or a subtle visual metaphor for the profession. ABSOLUTELY DO NOT generate a realistic human face or any likeness of a person. The image should be square and suitable for a small circular crop common in profile pictures.`;
    
    let coverImagePrompt: string;
    if (input.resumeContent && input.resumeContent.trim().length > 50) { // Check for meaningful resume content
        coverImagePrompt = `Generate a professional LinkedIn cover image (banner) that acts as a visual portfolio based on the following resume content: "${input.resumeContent}". The image should artistically and abstractly represent the key skills, projects, and experiences mentioned. For example, if the resume mentions software development, data science, and cloud computing, the image could be an abstract collage of code snippets, charts, and network diagrams. The style should be: "${input.stylePreference}". It must be visually appealing as a background banner (approximately 1584x396 pixels aspect ratio, landscape) and subtle enough not to overpower profile content. Do not include any readable text in the image.`;
    } else {
        coverImagePrompt = `Generate a professional LinkedIn cover image (banner). The image should be themed around the professional title: "${input.professionalTitle}". Style: ${input.stylePreference}. It should be visually appealing as a background banner, approximately 1584 x 396 pixels aspect ratio (landscape), but focus on creating a good composition rather than exact pixel dimensions. Examples: for a software engineer, perhaps abstract code patterns, a clean tech-themed background, or a subtle network graphic; for a designer, an artistic composition or color palette; for a marketing specialist, a dynamic graphic representing growth or communication. The image should be relatively subtle so as not to overpower the profile content.`;
    }

    try {
      console.log(`Generating LinkedIn Profile Picture with prompt: ${profilePicPrompt}`);
      const {media: profileMedia} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: profilePicPrompt,
        config: { responseModalities: ['TEXT', 'IMAGE'] },
      });
      if (profileMedia?.url) {
        profilePictureUrl = profileMedia.url;
        console.log('Successfully generated LinkedIn Profile Picture.');
      } else {
        console.warn('LinkedIn Profile Picture generation did not return a URL.');
      }
    } catch (error) {
      console.error(`Failed to generate LinkedIn Profile Picture for "${input.fullName}":`, error);
    }

    try {
      console.log(`Generating LinkedIn Cover Image with prompt: ${coverImagePrompt}`);
      const {media: coverMedia} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: coverImagePrompt,
        config: { responseModalities: ['TEXT', 'IMAGE'] },
      });
      if (coverMedia?.url) {
        coverImageUrl = coverMedia.url;
        console.log('Successfully generated LinkedIn Cover Image.');
      } else {
        console.warn('LinkedIn Cover Image generation did not return a URL.');
      }
    } catch (error) {
      console.error(`Failed to generate LinkedIn Cover Image for "${input.professionalTitle}":`, error);
    }

    return {
      suggestedProfilePictureUrl: profilePictureUrl,
      suggestedCoverImageUrl: coverImageUrl,
      profilePicturePromptUsed: profilePicPrompt,
      coverImagePromptUsed: coverImagePrompt
    };
  }
);
