import { Injectable, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';

interface EmbeddingChunk {
  text: string;
  documentId: string;
  firmId: string;
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly geminiKey: string;
  private readonly qdrantUrl: string;
  private readonly collection: string;

  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
  ) {
    this.geminiKey = process.env.GEMINI_API_KEY || '';
    this.qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
    this.collection = process.env.QDRANT_COLLECTION || 'lexmanage_docs';
  }

  async onModuleInit() {
    await this.ensureCollection();
  }

  private async ensureCollection() {
    try {
      const res = await fetch(`${this.qdrantUrl}/collections/${this.collection}`);
      if (res.status === 404) {
        await fetch(`${this.qdrantUrl}/collections/${this.collection}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vectors: {
              size: 768, // Gemini embedding-001 size
              distance: 'Cosine',
            },
          }),
        });
        console.log(`Qdrant collection '${this.collection}' created.`);
      }
    } catch (e) {
      console.error('Failed to initialize Qdrant collection:', e);
    }
  }

  // ── Embed text via Gemini Embedding API ───────────────────────────────────
  async embed(text: string): Promise<number[]> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${this.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text }] } }),
      },
    );
    const data = await res.json();
    if (!data?.embedding?.values) throw new InternalServerErrorException('Embedding failed');
    return data.embedding.values;
  }

  // ── Store document chunk in Qdrant (with firm isolation) ────────────────
  async indexChunk(chunk: EmbeddingChunk) {
    const vector = await this.embed(chunk.text);
    await fetch(`${this.qdrantUrl}/collections/${this.collection}/points`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        points: [{
          id: crypto.randomUUID(),
          vector,
          payload: {
            text: chunk.text,
            documentId: chunk.documentId,
            firmId: chunk.firmId,
          },
        }],
      }),
    });
  }

  // ── RAG Search: Find relevant chunks for a query (scoped to firm) ───────
  async searchRelevantChunks(query: string, firmId: string, limit = 5): Promise<any[]> {
    const vector = await this.embed(query);
    const res = await fetch(`${this.qdrantUrl}/collections/${this.collection}/points/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vector,
        limit,
        filter: { must: [{ key: 'firmId', match: { value: firmId } }] },
        with_payload: true,
      }),
    });
    const data = await res.json();
    return data?.result || [];
  }

  // ── Main Chat: RAG (Docs) + Global Intelligence (Cases/Members) + Gemini ──
  async chat(message: string, conversationId: string, firmId: string): Promise<{ text: string; sources: any[] }> {
    // 1. Fetch previous messages for context
    const history = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    // 2. Perform Global Search to get structured context (Cases, Members)
    const globalContext = await this.searchService.globalSearch(firmId, message);
    
    // 3. Search relevant document chunks from Qdrant (unstructured context)
    const chunks = await this.searchRelevantChunks(message, firmId);
    const ragContext = chunks.map(c => c.payload.text).join('\n---\n');

    // 4. Build Professional Context String
    const structuredContext = `
      DOSSIERS LIÉS: ${globalContext.cases.map(c => `${c.title} (Client: ${c.clientName}, N°: ${c.caseNumber || 'N/A'})`).join('; ') || 'Aucun dossier spécifique trouvé.'}
      ÉQUIPE LIÉE: ${globalContext.members.map(m => `${m.firstName} ${m.lastName} (${m.role})`).join(', ') || 'Aucun membre identifié.'}
      EXTRAITS DOCUMENTS: \n${ragContext || 'Aucun extrait documentaire pertinent.'}
    `;

    // 5. Build Gemini prompt
    const systemInstruction = `
      Tu es LexAssist, l'intelligence centrale d'excellence du cabinet.
      CONTEXTE DU CABINET (RAG & SEARCH):\n${structuredContext}
      
      RÈGLES D'OR:
      1. Réponds de façon concise, précise et très professionnelle (ton "Maître").
      2. Si on te demande "Qui travaille sur quoi", utilise la liste de l'ÉQUIPE LIÉE et des DOSSIERS.
      3. Cite toujours le nom du dossier ou le numéro de dossier si disponible.
      4. Réponds uniquement en français.
    `;

    const contents = [
      ...history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
        }),
      },
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Je suis désolé, je ne peux pas répondre à cette question.';

    // Format sources nicely to show the document context
    const sources = chunks.map(c => ({
      documentId: c.payload.documentId,
      text: c.payload.text,
    }));

    return { text, sources };
  }
}
