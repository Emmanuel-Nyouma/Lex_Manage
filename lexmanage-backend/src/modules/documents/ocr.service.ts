import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class OcrService {
  private readonly geminiKey: string;

  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY || '';
  }

  async extractText(fileBuffer: Buffer, mimeType: string): Promise<string> {
    if (!this.geminiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured');
    }

    const base64Data = fileBuffer.toString('base64');

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: mimeType,
                      data: base64Data,
                    },
                  },
                  {
                    text: "Extrais l'intégralité du texte de ce document juridique de manière très précise et exhaustive en français. Ne résume pas, restitue mot à mot tout le texte lisible. Si le document ne contient aucun texte, réponds simplement '[VIDE]'.",
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
            },
          }),
        },
      );

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Gemini API returned an empty response');
      }

      return text.trim();
    } catch (error) {
      console.error('Gemini OCR extraction failed:', error);
      throw new InternalServerErrorException('Failed to extract text from document using Gemini API');
    }
  }
}
