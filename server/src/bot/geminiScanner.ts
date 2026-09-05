import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('⚠️ GEMINI_API_KEY is not defined in environment variables');
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export interface ExtractedExpense {
  name: string;
  value: number;
  date: string;
  confidence?: string;
  rawNote?: string;
}

// Fallback models in priority order to guarantee 99.9% uptime and avoid 503 "High Demand" spikes
const CANDIDATE_MODELS = [
  'gemini-3.6-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
];

/**
 * Uses Google Gemini (with automatic multi-model fallback and retry) to extract expense data.
 */
export async function extractExpenseFromReceipt(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<ExtractedExpense> {
  const todayStr = new Date().toISOString().split('T')[0];

  const prompt = `Siz buxgalteriya va cheklarni skaner qiluvchi sun'iy intellektsiz.
Ushbu rasm chek, to'lov kvitansiyasi (Payme, Click, Uzum, bank cheki) yoki schyot-faktura hisoblanadi.
Rasmdan quyidagi ma'lumotlarni o'zbek tilida aniqlab oling:
1. "name": Xarajatning qisqa mazmuni yoki do'kon/xizmat nomi (masalan: "Kantselyariya buyumlari", "Korzinka supermarket", "Elektr energiyasi to'lovi", "Ofis suvi").
2. "value": To'langan yakuniy jami summa (faqat so'mda son ko'rinishida, masalan: 125000). Har qanday valyuta belgilarisiz raqam bo'lsin.
3. "date": Chekdagi sana (YYYY-MM-DD formatida). Agar sana topilmasa yoki noaniq bo'lsa, bugungi sanani qo'ying: "${todayStr}".
4. "confidence": "HIGH", "MEDIUM" yoki "LOW".
5. "rawNote": Chekdan olingan qo'shimcha tafsilotlar (agar mavjud bo'lsa).`;

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`🤖 Attempting OCR with model: ${model} (attempt ${attempt})...`);

        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType,
                data: imageBuffer.toString('base64'),
              },
            },
            { text: prompt },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: {
                  type: Type.STRING,
                  description: 'Xarajat nomi yoki sotuvchi nomi',
                },
                value: {
                  type: Type.NUMBER,
                  description: 'Xarajat summasi so‘mda',
                },
                date: {
                  type: Type.STRING,
                  description: 'Sana YYYY-MM-DD formatida',
                },
                confidence: {
                  type: Type.STRING,
                  description: 'Aniqlash ishonchlilik darajasi',
                },
                rawNote: {
                  type: Type.STRING,
                  description: 'Qo‘shimcha ma’lumotlar',
                },
              },
              required: ['name', 'value', 'date'],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');

        console.log(`✅ OCR successful using model: ${model}`);

        return {
          name: parsed.name || 'Nomaʼlum xarajat',
          value: Math.abs(Number(parsed.value) || 0),
          date: parsed.date || todayStr,
          confidence: parsed.confidence || 'MEDIUM',
          rawNote: parsed.rawNote || '',
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`⚠️ Model ${model} attempt ${attempt} failed: ${err?.message || err}`);

        // If error is 503 (High Demand) or 429 (Rate Limit), pause 800ms before retry or next model
        if (err?.message?.includes('503') || err?.message?.includes('429')) {
          await new Promise((res) => setTimeout(res, 800));
        } else {
          // If 404 or unsupported, immediately break to next model
          break;
        }
      }
    }
  }

  console.error('All Gemini fallback models exhausted:', lastError?.message || lastError);
  throw new Error('Chekni tahlil qilishda xatolik yuz berdi: ' + (lastError?.message || 'Server band'));
}
