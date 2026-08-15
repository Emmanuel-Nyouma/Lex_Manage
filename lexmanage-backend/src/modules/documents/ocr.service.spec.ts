import { InternalServerErrorException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OcrService } from './ocr.service';

describe('OcrService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'gemini-test-key';
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('refuse une extraction sans clé Gemini', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(new OcrService().extractText(Buffer.from('file'), 'application/pdf'))
      .rejects.toThrow(InternalServerErrorException);
  });

  it('envoie le document encodé et nettoie le texte retourné', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ candidates: [{ content: { parts: [{ text: '  Texte extrait  ' }] } }] }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(new OcrService().extractText(Buffer.from('legal'), 'application/pdf'))
      .resolves.toBe('Texte extrait');
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('gemini-test-key'), expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining(Buffer.from('legal').toString('base64')),
    }));
  });

  it('masque une panne réseau ou une réponse vide derrière une erreur stable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue({ candidates: [] }) }));
    await expect(new OcrService().extractText(Buffer.from('file'), 'application/pdf'))
      .rejects.toThrow('Failed to extract text from document using Gemini API');

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(new OcrService().extractText(Buffer.from('file'), 'application/pdf'))
      .rejects.toThrow(InternalServerErrorException);
  });
});
