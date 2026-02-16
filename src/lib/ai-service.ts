import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * SERVICE IA - CLAUDE 3.5 SONNET
 * RAG STRICT & OCR VISION
 */

export async function analyseDocumentOCR(fileBase64: string, mimeType: string) {
  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extraire les données structurées de ce document juridique. Identifier le type de document et les informations clés (noms, dates, montants). Répondre en JSON."
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as any,
              data: fileBase64,
            },
          },
        ],
      },
    ],
  });

  return response.content[0];
}

export async function executeRAGQuery(query: string, context: string, pays: string) {
  const prompt = `
    Tu es un expert juridique spécialisé en droit de la famille pour le pays: ${pays}.
    Utilise UNIQUEMENT le contexte suivant pour répondre à la question. 
    Si la réponse n'est pas dans le contexte, dis que tu ne sais pas.
    
    CONTEXTE LÉGAL:
    ${context}
    
    QUESTION:
    ${query}
    
    RÈGLES D'OR:
    1. Cite l'article de loi précis (ex: Art. 229 Code Civil).
    2. Ne donne jamais de conseil juridique général.
    3. Reste factuel et neutre.
  `;

  const response = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0];
}
