import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export interface ExtractedExpense {
  name: string;
  value: number;
  date: string;
  confidence?: string;
  rawNote?: string;
}

// Fallback models in priority order for maximum speed (<1.5s) and high reliability
const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

/**
 * Fast helper to prevent any single model call from blocking for more than `ms` milliseconds.
 */
function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    promise.then(
      (res) => { clearTimeout(timer); resolve(res); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

/**
 * Instant regex parser for receipt captions (e.g. "Karam uchun 100000" or "50 ming obed").
 * Completes in <1ms without calling any AI model!
 */
export function parseExpenseFromCaption(caption?: string): ExtractedExpense | null {
  if (!caption) return null;
  const clean = caption.trim();
  if (!clean || !/\d/.test(clean)) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  // Regex 1: "Name 100000" or "Name 100 000 so'm" or "Name 50 ming"
  const matchEnd = clean.match(/^(.+?)\s+([0-9][0-9\s.,]*)(?:\s*(so'?m|sum|ming|k))?$/i);
  if (matchEnd) {
    const name = matchEnd[1].trim();
    let numStr = matchEnd[2].replace(/[^\d]/g, '');
    let val = parseInt(numStr, 10);
    const unit = (matchEnd[3] || '').toLowerCase();
    if ((unit.includes('ming') || unit === 'k') && val < 100000) {
      val *= 1000;
    }
    if (val > 0 && name && name.length >= 2) {
      return { name, value: val, date: todayStr, confidence: 'HIGH' };
    }
  }

  // Regex 2: "100000 Name" or "100 000 so'm Name"
  const matchStart = clean.match(/^([0-9][0-9\s.,]*)(?:\s*(so'?m|sum|ming|k))?\s+(.+)$/i);
  if (matchStart) {
    let numStr = matchStart[1].replace(/[^\d]/g, '');
    let val = parseInt(numStr, 10);
    const unit = (matchStart[2] || '').toLowerCase();
    const name = matchStart[3].trim();
    if ((unit.includes('ming') || unit === 'k') && val < 100000) {
      val *= 1000;
    }
    if (val > 0 && name && name.length >= 2) {
      return { name, value: val, date: todayStr, confidence: 'HIGH' };
    }
  }

  return null;
}

/**
 * Uses Google Gemini (with automatic fast multi-model fallback) to extract expense data.
 */
export async function extractExpenseFromReceipt(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg',
  userCaption?: string
): Promise<ExtractedExpense> {
  const todayStr = new Date().toISOString().split('T')[0];

  // If user caption already has amount, return instantly!
  const captionParsed = parseExpenseFromCaption(userCaption);
  if (captionParsed) {
    return captionParsed;
  }

  const captionHint = userCaption?.trim()
    ? `\nIzoh: Foydalanuvchi quyidagi izohni yuborgan: "${userCaption.trim()}". Xarajat nomi sifatida ushbu izohni oling.`
    : '';

  const prompt = `Siz buxgalteriya va cheklarni skaner qiluvchi tezkor sun'iy intellektsiz.
Ushbu rasm to'lov cheki yoki kvitansiya hisoblanadi.${captionHint}
Rasmdan quyidagilarni aniqlang:
1. "name": Xarajat nomi yoki do'kon nomi. (Agar foydalanuvchi izoh yozgan bo'lsa, o'sha izohni oling).
2. "value": Yakuniy to'langan summa (faqat so'mda musbat raqam, masalan: 125000).
3. "date": Chekdagi sana (YYYY-MM-DD formatida). Agar sana topilmasa, bugungi sanani qo'ying: "${todayStr}".
4. "confidence": "HIGH", "MEDIUM" yoki "LOW".
5. "rawNote": Chekdan olingan qisqa tafsilotlar.`;

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      console.log(`🤖 Attempting fast OCR with model: ${model}...`);

      const response = await timeoutPromise(
        ai.models.generateContent({
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
        }),
        6000 // 6 seconds max timeout per model!
      );

      const parsed = JSON.parse(response.text || '{}');

      console.log(`✅ OCR successful using model: ${model}`);

      return {
        name: parsed.name || (userCaption?.trim() || 'Nomaʼlum xarajat'),
        value: Math.abs(Number(parsed.value) || 0),
        date: parsed.date || todayStr,
        confidence: parsed.confidence || 'MEDIUM',
        rawNote: parsed.rawNote || '',
      };
    } catch (err: any) {
      lastError = err;
      console.warn(`⚠️ Model ${model} failed or timed out: ${err?.message || err}`);
    }
  }

  // Fallback: If OCR failed but user supplied a caption, use that caption with 0 value or default
  if (userCaption && userCaption.trim().length >= 2) {
    return {
      name: userCaption.trim(),
      value: 0,
      date: todayStr,
      confidence: 'LOW',
      rawNote: 'Rasmdan summa o‘qilmadi, izohdan olindi',
    };
  }

  console.error('All Gemini fallback models exhausted:', lastError?.message || lastError);
  throw new Error('Chekni tahlil qilishda xatolik yuz berdi: ' + (lastError?.message || 'Server band'));
}

/**
 * Extracts expense information from a text message (e.g., "Taksi 30000" or "Kantselyariya 150 000 so'm").
 */
export async function extractExpenseFromText(text: string): Promise<ExtractedExpense | null> {
  const clean = text.trim();
  if (!clean || clean.startsWith('/') || clean.length < 3) return null;

  // Check if text contains any digit
  const hasDigit = /\d/.test(clean);
  if (!hasDigit) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const prompt = `Siz buxgalteriya yordamchisisiz. Foydalanuvchi quyidagi matn orqali xarajat kiritmoqda:
"${clean}"

Matndan quyidagilarni aniqlang:
1. "name": Xarajat nomi yoki maqsadi (masalan: "Taksi", "Kantselyariya", "Tushlik", "Benzin"). Agar faqat summa bo'lsa, "Xarajat" deb oling.
2. "value": Xarajat summasi faqat so'mda musbat butun son (masalan, 30000 yoki 150000). Agar ming, mln so'zlar bo'lsa hisoblang (masalan "50 ming" -> 50000).
3. "date": Sana YYYY-MM-DD formatida. Agar matnda sana aytilmagan bo'lsa, bugungi sanani oling: "${todayStr}".
4. "isExpense": Matn xarajat summasi va nomini o'z ichiga olganmi? (true yoki false).`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await timeoutPromise(
        ai.models.generateContent({
          model,
          contents: [{ text: prompt }],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.NUMBER },
                date: { type: Type.STRING },
                isExpense: { type: Type.BOOLEAN },
              },
              required: ['name', 'value', 'date', 'isExpense'],
            },
          },
        }),
        5000 // 5 seconds max
      );

      const parsed = JSON.parse(response.text || '{}');
      if (!parsed.isExpense || !parsed.value || parsed.value <= 0) {
        return null;
      }

      return {
        name: parsed.name?.trim() || clean,
        value: Math.abs(Number(parsed.value)),
        date: parsed.date || todayStr,
        confidence: 'HIGH',
      };
    } catch (err: any) {
      console.warn(`⚠️ Text extraction model ${model} failed: ${err?.message || err}`);
    }
  }

  // Fast fallback regex if API was unresponsive
  const match = clean.match(/^(.+?)\s+(\d[\d\s.,]*)(?:\s*so'?m)?$/i) || clean.match(/^(\d[\d\s.,]*)(?:\s*so'?m)?\s+(.+)$/i);
  if (match) {
    const isFirstNum = /^\d/.test(match[1]);
    const numPart = (isFirstNum ? match[1] : match[2]).replace(/[^\d]/g, '');
    const namePart = (isFirstNum ? match[2] : match[1]).trim();
    const val = parseInt(numPart, 10);
    if (val > 0 && namePart) {
      return {
        name: namePart,
        value: val,
        date: todayStr,
        confidence: 'MEDIUM',
      };
    }
  }

  return null;
}
