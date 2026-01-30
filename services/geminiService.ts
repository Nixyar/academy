import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyze an image using gemini-3-pro-preview
 */
export const analyzeImage = async (file: File, prompt: string): Promise<string> => {
  try {
    const imagePart = await fileToGenerativePart(file);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          imagePart,
          { text: prompt || "Опиши подробно, что изображено на этой картинке." }
        ]
      }
    });

    return response.text || "Не удалось получить ответ от модели.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error("Ошибка при анализе изображения.");
  }
};

/**
 * Edit an image using gemini-2.5-flash-image
 * Prompt example: "Add a retro filter"
 */
export const editImage = async (file: File, prompt: string): Promise<string> => {
  try {
    const imagePart = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          imagePart,
          { text: prompt }
        ]
      },
      // Note: For image editing via generateContent, we expect an image back in the parts
    });

    // Iterate to find image part
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    // If no image returned, maybe text error
    return response.text || "Изображение не сгенерировано";

  } catch (error) {
    console.error("Error editing image:", error);
    throw new Error("Ошибка при редактировании изображения.");
  }
};

/**
 * General chat/coding helper (Mocked for vibe coding text generation context, 
 * or could use gemini-2.5-flash for speed)
 */
export const generateVibeCode = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "Ты опытный Vibe Coder. Ты пишешь код быстро и эффективно. Отвечай на русском языке."
            }
        });
        return response.text || "";
    } catch (error) {
        console.error("Error generating code", error);
        return "Ошибка генерации кода.";
    }
}
