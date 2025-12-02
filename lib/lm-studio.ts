// LM Studio API Integration
// Default endpoint: http://localhost:1234/v1/chat/completions

interface LMStudioMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LMStudioResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

const LM_STUDIO_ENDPOINT = 'http://localhost:1234/v1/chat/completions';

export class LMStudioService {
  private endpoint: string;

  constructor(endpoint: string = LM_STUDIO_ENDPOINT) {
    this.endpoint = endpoint;
  }

  async chat(messages: LMStudioMessage[]): Promise<string> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.statusText}`);
      }

      const data: LMStudioResponse = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error calling LM Studio:', error);
      // Fallback response when LM Studio is not available
      return 'Mi dispiace, al momento non riesco a connettermi al servizio AI. Assicurati che LM Studio sia in esecuzione su localhost:1234.';
    }
  }

  async analyzeFreeTime(
    activities: any[],
    userProfile: any
  ): Promise<string[]> {
    const prompt = `Analizza il calendario dell'utente e suggerisci 3-5 attività significative per i momenti liberi.

Profilo utente:
- Interessi: ${userProfile?.interests?.join(', ') || 'non specificati'}
- Obiettivi: ${userProfile?.goals?.join(', ') || 'non specificati'}

Attività schedulate oggi: ${activities.length > 0 ? activities.map(a => `${a.title} (${new Date(a.startTime).toLocaleTimeString()} - ${new Date(a.endTime).toLocaleTimeString()})`).join(', ') : 'nessuna'}

Fornisci suggerimenti motivanti e personalizzati per riempire i momenti liberi in modo produttivo. Rispondi con una lista di suggerimenti separati da "|||".`;

    const response = await this.chat([
      {
        role: 'system',
        content:
          'Sei un assistente motivazionale intelligente che aiuta le persone a ottimizzare il loro tempo. Sei amichevole, incoraggiante ma mai invasivo. Dai suggerimenti pratici e realizzabili.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return response.split('|||').map((s) => s.trim()).filter((s) => s.length > 0);
  }

  async getMotivationalMessage(activity: any): Promise<string> {
    const prompt = `L'utente sta per affrontare: "${activity.title}".

Fornisci un breve messaggio motivazionale (max 2 frasi) per aiutarlo ad affrontare questa attività con energia e positività.`;

    const response = await this.chat([
      {
        role: 'system',
        content:
          'Sei un coach motivazionale che aiuta le persone a dare il meglio. Sei breve, incisivo e positivo.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return response;
  }

  async getCompletionCelebration(streak: number): Promise<string> {
    const prompt = `L'utente ha completato un'attività! Ha una streak di ${streak} giorni consecutivi.

Fornisci un messaggio di celebrazione breve e motivante (max 2 frasi).`;

    const response = await this.chat([
      {
        role: 'system',
        content:
          'Sei un cheerleader digitale che celebra i successi delle persone. Sei entusiasta ma non esagerato.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ]);

    return response;
  }
}

export const lmStudio = new LMStudioService();
