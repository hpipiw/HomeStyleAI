import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateMakeover(
  imageFile: File,
  style: string,
  preservedItems: string[],
  customPrompt?: string
): Promise<string> {
  try {
    // Convert file to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Construct the prompt
    let prompt = `Transform this room into a ${style} style.`;
    
    if (customPrompt && customPrompt.trim()) {
      prompt += ` ${customPrompt.trim()}`;
    }

    if (preservedItems.length > 0) {
      prompt += ` Crucially, do NOT change the following elements: ${preservedItems.join(", ")}. Keep them exactly as they are in the original image. Maintain the original layout and perspective.`;
    } else {
      prompt += ` Maintain the original layout and perspective.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image.split(',')[1], // Remove data:image/jpeg;base64, prefix
              mimeType: imageFile.type,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // Extract the image from the response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating makeover:", error);
    throw error;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
