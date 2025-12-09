import { GoogleGenAI } from '@google/genai';

class GeminiService {
  private ai: GoogleGenAI;
  private modelId = 'gemini-2.5-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    this.ai = new GoogleGenAI({ apiKey });
  }

  async getCodeHelp(currentCode: string, userQuery: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelId,
        contents: `
          Ты — "VibeCoder", продвинутый AI-наставник и сердце платформы VibeCoderAI.
          
          Контекст: Пользователь пишет код в песочнице.
          Текущий код:
          \`\`\`
          ${currentCode}
          \`\`\`
          
          Вопрос пользователя: ${userQuery}
          
          Инструкции:
          1. Отвечай на РУССКОМ языке.
          2. Будь кратким, технологичным, но с "вайбом".
          3. Объясняй решение четко.
          4. Если в коде ошибки, указывай на них как на возможность для апгрейда.
          5. Используй стиль общения: "Привет, кодер", "Лови фикс", "Смотри как можно оптимизировать".
        `,
      });
      return response.text || "Связь с ядром VibeCoder прервана. Переподключаюсь...";
    } catch (error) {
      console.error("AI Error:", error);
      return "Системная ошибка VibeCoder Cloud. Попробуй еще раз.";
    }
  }

  async reviewCode(code: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelId,
        contents: `
          Ты — VibeCoder AI. Проведи сканирование и ревью этого кода. Отвечай на РУССКОМ языке.
          Код:
          \`\`\`
          ${code}
          \`\`\`
          Дай 3 четких поинта (буллитами) для оптимизации или исправления. Стиль: киберпанк-наставник.
        `,
      });
      return response.text || "Код принят. Анализ завершен. Выглядит неплохо.";
    } catch (error) {
      return "Не могу просканировать код сейчас.";
    }
  }
}

export const geminiService = new GeminiService();
