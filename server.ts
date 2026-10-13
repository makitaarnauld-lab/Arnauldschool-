import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '35mb' }));

// Initialize Gemini SDK with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('[Gemini SDK] Initialisation warning:', err);
  }
}

// System prompts for educational modes
const MODE_SYSTEM_PROMPTS: Record<string, string> = {
  general: `Tu es "ArnauldSchool AI", un assistant pédagogique d'élite conçu spécifiquement pour les enseignants africains et francophones (primaire, collège, lycée général et technique). Ton ton est rigoureux, chaleureux, hautement structuré et respectueux des programmes éducatifs officiels (APC - Approche Par Compétences, programmes nationaux d'Afrique francophone). Tu aides à la préparation de cours, l'explication de concepts complexes, la création d'exercices progressifs et la gestion de classe. Formate tes réponses avec une typographie soignée en Markdown (titres clairs, listes à puces, tableaux si approprié, formules bien détaillées).`,
  lesson: `Tu es un conseiller pédagogique expert chargé de concevoir des fiches de cours et des fiches de préparation complètes selon l'Approche Par Compétences (APC). Chaque fiche de cours doit comprendre : 1. Intitulé, Niveau/Classe, Discipline, Durée estimée 2. Compétences visées & Objectifs d'apprentissage opérationnels 3. Prérequis essentiels 4. Matériel et supports didactiques 5. Déroulement séquentiel : Phase de découverte / motivation, Phase d'apprentissage / structuration, Phase d'application guidée, Phase d'institutionnalisation / synthèse 6. Évaluation formative rapide (exercices d'application immédiate) 7. Travail à faire à la maison. Reste concret, précis et directement utilisable en classe.`,
  exam: `Tu es un concepteur d'épreuves académiques et de devoirs surveillés. Pour toute demande de devoir ou examen : 1. Propose un sujet équilibré avec barème total sur 20 points (Partie 1 : Restitution organisée des connaissances, Partie 2 : Application / Exercices, Partie 3 : Résolution de problème / Cas pratique). 2. Fournis IMMÉDIATEMENT à la suite le CORRIGÉ INTÉGRAL DÉTAILLÉ avec la grille de notation point par point (barème précis par sous-question). 3. Ajoute des critères de réussite et les pièges fréquents à anticiper.`,
  remedial: `Tu es un spécialiste de la remédiation pédagogique et de la différenciation. Ton rôle est d'analyser les blocages d'un élève ou d'une classe, d'identifier les causes didactiques des erreurs récurrentes et de proposer : 1. Le diagnostic précis du malentendu cognitif 2. Une explication alternative avec métaphore ou manipulation visuelle simple 3. Trois exercices progressifs de déblocage avec indices 4. Un mot d'encouragement personnalisé pour redonner confiance à l'élève.`,
  bulletin: `Tu es un rédacteur d'appréciations trimestrielles pour les bulletins scolaires. Tu rédiges des appréciations constructives, bienveillantes, précises et stimulantes. Pour chaque élève : - Souligne les points forts réels - Identifie avec tact le levier de progrès prioritaire (méthode, régularité, participation, concentration, confiance) - Termine par un encouragement motivant adapté au profil. Propose 2 à 3 variantes (concise 1 phrase, détaillée 3 phrases, ou version conseil aux parents).`
};

// API: AI Chat with Gemini (with automatic model fallback)
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { question, messages = [], attachments = [], mode = 'general', context = {} } = req.body;

    if (!question && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Une question ou un document joint est requis.' });
    }

    const systemPrompt = MODE_SYSTEM_PROMPTS[mode] || MODE_SYSTEM_PROMPTS.general;
    
    // Add school context if provided
    let contextualInstructions = systemPrompt;
    if (context.schoolName || context.className || context.subjectName) {
      contextualInstructions += `\n\nContexte scolaire actuel de l'enseignant :`;
      if (context.schoolName) contextualInstructions += `\n- Établissement : ${context.schoolName}`;
      if (context.className) contextualInstructions += `\n- Classe : ${context.className}`;
      if (context.subjectName) contextualInstructions += `\n- Matière : ${context.subjectName}`;
      if (context.period) contextualInstructions += `\n- Période : ${context.period}`;
    }

    if (!aiClient) {
      return res.json({
        answer: `### Réponse Pédagogique ArnauldSchool\n\n**Note :** La clé d'API \`GEMINI_API_KEY\` n'est pas encore configurée dans l'environnement.\n\nVoici néanmoins une trame de réponse pédagogique pour votre demande : **"${question}"**\n\n1. **Objectif pédagogique** : Développer la compréhension et l'autonomie des apprenants.\n2. **Rappel méthodologique** : Structurer la réponse par étapes logiques avec des exemples concrets du quotidien.\n3. **Application pratique** : Proposer un exercice guidé puis un exercice autonome.\n\n*Configurez votre clé GEMINI_API_KEY dans les secrets pour activer l'analyse complète en temps réel avec Gemini.*`,
        model: 'simulated-fallback'
      });
    }

    // Prepare contents array for Gemini
    const contents: any[] = [];

    // Prior conversation history (up to last 4 messages for maximum speed)
    const validHistory = Array.isArray(messages) ? messages.slice(-4) : [];
    for (const msg of validHistory) {
      if (msg.content && (msg.role === 'user' || msg.role === 'assistant')) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    // Build current user message parts
    const currentParts: any[] = [];
    if (question) {
      currentParts.push({ text: question });
    }

    // Add attachments (images, PDF)
    if (Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.data && att.mimeType) {
          currentParts.push({
            inlineData: {
              data: att.data,
              mimeType: att.mimeType
            }
          });
        }
      }
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    let lastError: any = null;
    let answer: string | null = null;
    let successfulModel: string = 'gemini-3.1-flash-lite';

    for (const modelName of candidateModels) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction: contextualInstructions,
            temperature: 0.4,
            topP: 0.8,
            maxOutputTokens: 1500,
          }
        });

        if (response && response.text) {
          answer = response.text;
          successfulModel = modelName;
          break;
        }
      } catch (err: any) {
        console.warn(`[Gemini SDK] ${modelName} failed, trying next candidate:`, err.message || err);
        lastError = err;
      }
    }

    if (!answer) {
      console.error('[Gemini SDK All Candidates Failed]:', lastError);
      return res.json({
        answer: `### Assistant ArnauldSchool\n\nLe service Gemini rencontre une forte demande temporaire.\n\nRepères pédagogiques pour votre demande : **"${question}"** :\n\n- **Démarche recommandée** : Privilégier une approche progressive, expliciter les critères de réussite aux apprenants et vérifier les prérequis essentiels.\n- Vous pouvez retenter votre question dans un instant.`,
        model: 'temporary-fallback',
        warning: lastError?.message || 'High demand spike'
      });
    }

    return res.json({
      answer,
      model: successfulModel,
      timestamp: Date.now()
    });
  } catch (err: any) {
    console.error('[AI Chat Error]:', err);
    return res.json({
      answer: `### Assistant ArnauldSchool\n\nUne erreur est survenue : ${err.message || 'Service indisponible'}.\n\n1. **Approche APC** : Vérifiez les compétences et prérequis attendus.\n2. **Évaluation** : Construisez un barème précis par compétence.`,
      model: 'resilient-fallback',
      error: err.message
    });
  }
});

// API: Audio Transcription with Gemini multimodal audio
app.post('/api/ai/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioData, mimeType = 'audio/webm' } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: 'Données audio manquantes.' });
    }

    if (!aiClient) {
      return res.json({ text: '', warning: 'Clé GEMINI_API_KEY non configurée.' });
    }

    let cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    if (!cleanMime || cleanMime === 'audio') cleanMime = 'audio/webm';

    // gemini-3.5-transcribe is the primary official model for audio transcription
    const candidateModels = [
      'gemini-3.5-transcribe',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-3.8-flash'
    ];
    let transcribedText = '';

    for (const modelName of candidateModels) {
      try {
        const response = await aiClient.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: audioData,
                    mimeType: cleanMime
                  }
                },
                {
                  text: "Transcris mot à mot les paroles de cet enregistrement vocal en français. Renvoie UNIQUEMENT le texte exact dicté sans guillemets, sans formule de politesse ni commentaire. Si l'enregistrement ne contient aucune parole intelligible, renvoie une chaîne vide."
                }
              ]
            }
          ],
          config: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          }
        });

        let candidateText = '';
        if (response && response.text) {
          candidateText = response.text.trim();
        } else if (response && response.candidates?.[0]?.content?.parts) {
          candidateText = response.candidates[0].content.parts
            .map((p: any) => p.text)
            .filter(Boolean)
            .join(' ')
            .trim();
        }

        if (candidateText) {
          candidateText = candidateText.replace(/^["'«»\s]+|["'«»\s]+$/g, '').trim();
          const lower = candidateText.toLowerCase();
          // Filter out generic timestamp or model hallucination on silence
          if (
            /^00?:\d\d$/i.test(candidateText) ||
            lower.includes('aucun audio') ||
            lower.includes('aucun son') ||
            lower.includes('silence') ||
            lower.includes('transmettre le fichier') ||
            lower.includes('aucun fichier audio') ||
            lower.includes("pas d'audio")
          ) {
            candidateText = '';
          }
          if (candidateText) {
            transcribedText = candidateText;
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[Transcription model ${modelName} error]:`, err.message || err);
      }
    }

    return res.json({ text: transcribedText });
  } catch (err: any) {
    console.error('[Transcription API Error]:', err);
    return res.json({ text: '', error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!aiClient,
    timestamp: new Date().toISOString()
  });
});

// In dev, mount Vite middleware; in prod, serve dist
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[ArnauldSchool] Serveur démarré sur http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[ArnauldSchool] Échec du démarrage du serveur:', err);
  process.exit(1);
});
