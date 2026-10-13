import React, { useState, useEffect, useRef } from 'react';
import { 
  AIMessage, 
  AIMessageAttachment, 
  AIConversation, 
  AIMode, 
  School, 
  ClassRoom, 
  Student 
} from '../types';
import { getLS, setLS, genId, KEYS, sanitizeAIConversations } from '../lib/storage';
import { exportAIPedagogyPDF } from '../lib/pdfExport';
import { 
  Sparkles, 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  Plus, 
  Trash2, 
  Edit2, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Camera, 
  FileCode, 
  X, 
  GraduationCap, 
  Menu,
  ArrowLeft,
  Edit3,
  Loader2,
  Volume2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Table as TableIcon
} from 'lucide-react';
import { WordEditorModal } from './WordEditorModal';
import { ExcelEditorModal } from './ExcelEditorModal';
import { downloadWordDoc, downloadExcelCSV, exportAIPedagogyPDFEnhanced } from '../lib/documentExport';

interface AIViewProps {
  activeSchool: School | null;
  classes: ClassRoom[];
  students: Student[];
  initialPrompt?: string;
  initialMode?: AIMode;
  onNavigate?: (module: string) => void;
}

const MODES: { id: AIMode; label: string; icon: string; desc: string }[] = [
  { id: 'general', label: 'Général', icon: '✨', desc: 'Assistant pédagogique général' },
  { id: 'lesson', label: 'Fiche de Cours APC', icon: '📖', desc: 'Objectifs, prérequis & déroulé didactique' },
  { id: 'exam', label: 'Évaluation & Corrigé', icon: '📝', desc: 'Sujet sur 20 avec barème et corrigé complet' },
  { id: 'remedial', label: 'Remédiation Ciblée', icon: '🎯', desc: "Diagnostic d'erreurs & exercices de déblocage" },
  { id: 'bulletin', label: 'Appréciations Bulletins', icon: '🎓', desc: 'Appréciations personnalisées & bienveillantes' },
];

const SUGGESTIONS_BY_MODE: Record<AIMode, { title: string; prompt: string }[]> = {
  general: [
    { title: 'Explication pédagogique', prompt: 'Explique de manière imagée le théorème de Thalès pour des élèves de 3ème.' },
    { title: 'Gestion de classe', prompt: "Donne-moi 4 stratégies concrètes pour capter l'attention d'une classe nombreuse en début d'heure." },
    { title: 'Projet interdisciplinaire', prompt: "Propose une idée de projet commun en Mathématiques et Physique-Chimie sur l'énergie solaire." },
  ],
  lesson: [
    { title: 'Cours APC : Dérivées', prompt: "Rédige une fiche de préparation APC complète sur l'introduction de la fonction dérivée en Terminale C/D." },
    { title: 'Cours : Électrostatique', prompt: 'Conçois une séquence didactique sur la loi de Coulomb avec expérience de découverte.' },
    { title: 'Cours : Argumentation', prompt: "Prépare une fiche de cours de français sur la structure d'un texte argumentatif en classe de 1ère." },
  ],
  exam: [
    { title: 'Devoir de Maths (20 pts)', prompt: 'Crée un devoir surveillé complet de 2h sur les nombres complexes pour Terminale C, avec barème sur 20 et corrigé pas à pas.' },
    { title: 'Interrogation de Physique', prompt: 'Génère une interrogation écrite de 45 minutes sur les lois de Newton avec barème détaillé.' },
    { title: 'QCM Diagnostic', prompt: 'Rédige un QCM de 10 questions avec justifications pour vérifier les prérequis sur les équations du second degré.' },
  ],
  remedial: [
    { title: 'Blocage sur les fractions', prompt: "Plusieurs élèves confondent l'addition et la multiplication de fractions. Propose un diagnostic cognitif et 3 exercices de remédiation visuelle." },
    { title: 'Difficulté en Géométrie', prompt: "Un élève n'arrive pas à rédiger une démonstration géométrique. Donne-lui une méthode pas à pas avec phrases types." },
    { title: 'Soutien personnalisé', prompt: "Propose un plan d'accompagnement pour un élève ayant 7,5/20 en Sciences Physiques par manque de méthode." },
  ],
  bulletin: [
    { title: 'Élève brillant mais discret', prompt: "Rédige 3 propositions d'appréciations pour un élève qui a 16,5/20 de moyenne mais participe peu à l'oral." },
    { title: 'Élève en progrès constant', prompt: "Rédige une appréciation trimestrielle valorisant les efforts d'un élève passé de 8,5 à 11,5/20." },
    { title: 'Élève distrait en classe', prompt: 'Rédige une appréciation constructive pour un élève doué mais dispersé qui a 10,2/20.' },
  ],
};

export const AIView: React.FC<AIViewProps> = ({
  activeSchool,
  classes,
  students,
  initialPrompt,
  initialMode = 'general',
  onNavigate,
}) => {
  // Load conversation state
  const [conversations, setConversations] = useState<AIConversation[]>(() => {
    const raw = getLS<AIConversation[]>(KEYS.aiState, []);
    const sanitized = sanitizeAIConversations(raw);
    if (sanitized.length === 0) {
      return [{
        id: genId('conv'),
        title: 'Nouvelle conversation',
        mode: initialMode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      }];
    }
    return sanitized;
  });

  const [activeConvId, setActiveConvId] = useState<string>(() => {
    const raw = getLS<AIConversation[]>(KEYS.aiState, []);
    const sanitized = sanitizeAIConversations(raw);
    return sanitized.length > 0 ? sanitized[0].id : '';
  });

  const [activeMode, setActiveMode] = useState<AIMode>(initialMode);
  const [inputMessage, setInputMessage] = useState<string>(initialPrompt || '');
  const [attachments, setAttachments] = useState<AIMessageAttachment[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string>('');

  // Voice recording & dictation states
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [liveInterimSpeech, setLiveInterimSpeech] = useState<string>('');
  const [transcriptionSuccessNotice, setTranscriptionSuccessNotice] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [sidebarWidth, setSidebarWidth] = useState<number>(256);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);

  // References for voice audio processing & recognition
  const isListeningRef = useRef<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<any>(null);
  const animFrameRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');
  const currentSpeechTextRef = useRef<string>('');
  const inputMessageRef = useRef<string>(inputMessage);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Keep ref synchronized with inputMessage state
  useEffect(() => {
    inputMessageRef.current = inputMessage;
  }, [inputMessage]);

  // Dynamically auto-resize textarea height so all text is clearly visible!
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(120, Math.max(34, scrollH))}px`;
    }
  }, [inputMessage]);

  // Touch gesture handling for sidebar slide
  const touchStartXRef = useRef<number>(0);
  const touchEndXRef = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchEndXRef.current - touchStartXRef.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && touchStartXRef.current < 60 && !sidebarOpen) {
        setSidebarOpen(true);
      } else if (diff < -50 && sidebarOpen) {
        setSidebarOpen(false);
      }
    }
  };

  const startResizing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsResizingSidebar(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar) return;
      const newWidth = Math.max(200, Math.min(480, e.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };
    if (isResizingSidebar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar]);

  // Dedicated Word & Excel Large Interface States
  const [wordEditorOpen, setWordEditorOpen] = useState<boolean>(false);
  const [excelEditorOpen, setExcelEditorOpen] = useState<boolean>(false);
  const [editingMessageContent, setEditingMessageContent] = useState<string>('');
  const [editingMessageTitle, setEditingMessageTitle] = useState<string>('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const handleOpenWordEditor = (msgId: string, content: string) => {
    setEditingMessageId(msgId);
    setEditingMessageContent(content);
    setEditingMessageTitle(activeConversation?.title || 'Fiche_Pedagogique');
    setWordEditorOpen(true);
  };

  const handleOpenExcelEditor = (msgId: string, content: string) => {
    setEditingMessageId(msgId);
    setEditingMessageContent(content);
    setEditingMessageTitle(activeConversation?.title || 'Tableau_Notes_Evaluation');
    setExcelEditorOpen(true);
  };

  const handleOpenEditor = (msgId: string, content: string) => {
    handleOpenWordEditor(msgId, content);
  };

  const handleSaveEditedContent = (newContent: string) => {
    if (!editingMessageId || !activeConversation) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === editingMessageId ? { ...m, content: newContent } : m
              ),
            }
          : c
      )
    );
  };

  // Ensure activeConvId is valid on load or change
  useEffect(() => {
    if (!activeConvId || !conversations.some(c => c.id === activeConvId)) {
      if (conversations.length > 0) {
        setActiveConvId(conversations[0].id);
      }
    }
  }, [conversations, activeConvId]);

  const activeConversation = conversations.find((c) => c.id === activeConvId) || conversations[0] || null;

  useEffect(() => {
    setLS(KEYS.aiState, conversations);
  }, [conversations]);

  useEffect(() => {
    if (initialPrompt && initialPrompt !== inputMessage) {
      setInputMessage(initialPrompt);
      if (initialMode) setActiveMode(initialMode);
    }
  }, [initialPrompt, initialMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isGenerating]);

  // CLEANUP AUDIO STREAM & AUDIO CONTEXT
  const cleanUpMediaStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      mediaStreamRef.current = null;
    }
    setMicVolume(0);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // MULTIMODAL AI TRANSCRIPTION BACKUP/ENHANCEMENT
  const requestTranscription = async (blob: Blob) => {
    if (blob.size < 300) return;
    setIsTranscribing(true);
    try {
      const base64 = await blobToBase64(blob);
      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64,
          mimeType: blob.type || 'audio/webm'
        })
      });
      if (res.ok) {
        const data = await res.json();
        const transcribed = data.text ? data.text.trim() : '';
        if (transcribed) {
          setInputMessage((prev) => {
            const cleanPrev = prev.trim();
            // If already captured speech matches, don't duplicate
            if (cleanPrev && cleanPrev.toLowerCase().includes(transcribed.toLowerCase())) {
              return cleanPrev;
            }
            if (cleanPrev) {
              return `${cleanPrev} ${transcribed}`;
            }
            return transcribed;
          });
          setTranscriptionSuccessNotice(`Paroles transcrites : "${transcribed.slice(0, 50)}${transcribed.length > 50 ? '...' : ''}"`);
          setTimeout(() => setTranscriptionSuccessNotice(null), 4000);
        }
      }
    } catch (err) {
      console.warn('[Transcription API warning]:', err);
    } finally {
      setIsTranscribing(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 80);
    }
  };

  // START BROWSER WEB SPEECH RECOGNITION (LIVE INSTANT TEXT IN INPUT BAR)
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript + ' ';
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        const currentSpoken = (finalTranscript + interimTranscript).trim();
        currentSpeechTextRef.current = currentSpoken;
        setLiveInterimSpeech(currentSpoken);

        // Immediately update inputMessage state so the user SEES IT LIVE in the textarea!
        const base = baseTextRef.current.trim();
        const full = base ? `${base} ${currentSpoken}` : currentSpoken;
        setInputMessage(full);
      };

      recognition.onerror = (event: any) => {
        console.warn('[SpeechRecognition status]:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicError("Accès micro refusé. Veuillez autoriser le microphone dans votre navigateur.");
        }
      };

      recognition.onend = () => {
        // If still listening, auto-restart to prevent Chrome's brief silence cutoff
        if (isListeningRef.current) {
          if (currentSpeechTextRef.current) {
            const base = baseTextRef.current.trim();
            baseTextRef.current = base ? `${base} ${currentSpeechTextRef.current}` : currentSpeechTextRef.current;
            currentSpeechTextRef.current = '';
          }
          setTimeout(() => {
            if (isListeningRef.current) {
              startSpeechRecognition();
            }
          }, 100);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('[SpeechRecognition init error]:', e);
    }
  };

  // STOP RECORDING
  const stopAudioRecording = () => {
    isListeningRef.current = false;
    setIsListening(false);
    setLiveInterimSpeech('');

    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    // Anchor any final spoken text to the inputMessage
    if (currentSpeechTextRef.current) {
      const base = baseTextRef.current.trim();
      const full = base ? `${base} ${currentSpeechTextRef.current}` : currentSpeechTextRef.current;
      setInputMessage(full);
      currentSpeechTextRef.current = '';
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        cleanUpMediaStream();
      }
    } else {
      cleanUpMediaStream();
    }

    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // TOGGLE MICROPHONE RECORDING (INLINE ON INPUT BAR)
  const handleToggleVoice = async () => {
    if (isListeningRef.current || isListening) {
      stopAudioRecording();
    } else {
      setMicError(null);
      setTranscriptionSuccessNotice(null);
      isListeningRef.current = true;
      setIsListening(true);
      setRecordingSeconds(0);
      setLiveInterimSpeech('');
      audioChunksRef.current = [];
      baseTextRef.current = inputMessageRef.current.trim();
      currentSpeechTextRef.current = '';

      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      // 1. Start live speech recognition for immediate visual writing in the textarea
      startSpeechRecognition();

      // 2. Start MediaRecorder & Audio Visualizer for volume wave and fallback transcription
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!isListeningRef.current) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          mediaStreamRef.current = stream;

          // Audio Context to visualize voice volume in real time
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const audioCtx = new AudioContextClass();
              audioContextRef.current = audioCtx;
              const source = audioCtx.createMediaStreamSource(stream);
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 64;
              source.connect(analyser);

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const checkVolume = () => {
                if (!isListeningRef.current) return;
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
                const avg = sum / dataArray.length;
                setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
                animFrameRef.current = requestAnimationFrame(checkVolume);
              };
              checkVolume();
            }
          } catch (e) {
            console.warn('[AudioContext volume listener error]:', e);
          }

          let mimeType = 'audio/webm';
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          }

          const recorder = new MediaRecorder(stream, { mimeType });
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
              audioChunksRef.current.push(e.data);
            }
          };

          recorder.onstop = () => {
            cleanUpMediaStream();
            const blob = new Blob(audioChunksRef.current, { type: mimeType });
            
            // Always transcribe the recorded audio to ensure complete and accurate speech text
            if (blob.size > 300) {
              requestTranscription(blob);
            }
          };

          recorder.start(400);
        } catch (err: any) {
          console.warn('[Microphone getUserMedia error]:', err);
          isListeningRef.current = false;
          setIsListening(false);
          if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setMicError("Microphone bloqué : veuillez autoriser le microphone dans les paramètres de votre navigateur.");
          } else {
            setMicError("Impossible d'accéder au microphone. Vérifiez les branchements.");
          }
        }
      }
    }
  };

  const handleNewConversation = () => {
    const newConv: AIConversation = {
      id: genId('conv'),
      title: 'Nouvelle conversation',
      mode: activeMode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setAttachments([]);
    setInputMessage('');
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Voulez-vous supprimer cette discussion ?')) {
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        if (remaining.length === 0) {
          const fresh = {
            id: genId('conv'),
            title: 'Nouvelle conversation',
            mode: activeMode,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [],
          };
          setActiveConvId(fresh.id);
          return [fresh];
        }
        if (activeConvId === id) {
          setActiveConvId(remaining[0].id);
        }
        return remaining;
      });
    }
  };

  const handleRenameConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    const newTitle = prompt('Nouveau titre pour la discussion :', conv.title);
    if (newTitle && newTitle.trim()) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim(), updatedAt: Date.now() } : c))
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf' | 'audio') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setShowAttachMenu(false);
    const file = files[0];
    if (file.size > 25 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (maximum 25 Mo).');
      return;
    }

    if (type === 'image') {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            h = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
        const base64 = compressedDataUrl.split(',')[1] || '';

        const newAtt: AIMessageAttachment = {
          id: genId('att'),
          name: file.name,
          size: Math.round((base64.length * 3) / 4),
          type: 'image',
          previewURL: objectUrl,
          data: base64,
          mimeType: 'image/jpeg',
        };
        setAttachments((prev) => [...prev, newAtt]);
      };
      img.src = objectUrl;
    } else if (type === 'audio') {
      // Audio recording or uploaded voice note
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        const newAtt: AIMessageAttachment = {
          id: genId('att'),
          name: file.name,
          size: file.size,
          type: 'audio',
          data: base64,
          mimeType: file.type || 'audio/webm',
        };
        setAttachments((prev) => [...prev, newAtt]);
        // Also automatically transcribe the audio into the input bar
        requestTranscription(file);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        const newAtt: AIMessageAttachment = {
          id: genId('att'),
          name: file.name,
          size: file.size,
          type: 'pdf',
          data: base64,
          mimeType: 'application/pdf',
        };
        setAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInjectContext = () => {
    const classCount = classes.length;
    const studentCount = students.length;
    const schoolName = activeSchool?.name || 'Mon établissement';
    const contextText = `[Contexte de mon école : ${schoolName}, ${classCount} classes actives, ${studentCount} élèves enregistrés. Année scolaire : ${activeSchool?.year_label || '2025-2026'}] `;
    setInputMessage((prev) => `${contextText}\n${prev}`);
  };

  const handleSendMessage = async (textToSend?: string) => {
    if (isListening) {
      stopAudioRecording();
    }
    const prompt = (textToSend || inputMessage).trim();
    if (!prompt && attachments.length === 0) return;

    let targetConv = activeConversation;
    let convList = conversations;
    if (!targetConv) {
      targetConv = {
        id: genId('conv'),
        title: prompt.slice(0, 45) || 'Question avec pièce jointe',
        mode: activeMode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      };
      convList = [targetConv, ...conversations];
      setConversations(convList);
      setActiveConvId(targetConv.id);
    }

    const userMsg: AIMessage = {
      id: genId('msg'),
      role: 'user',
      content: prompt,
      attachments: attachments.map((a) => ({
        id: a.id,
        name: a.name,
        size: a.size,
        type: a.type,
      })),
      timestamp: Date.now(),
    };

    const assistantMsgId = genId('msg');
    const assistantMsg: AIMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      loading: true,
      timestamp: Date.now(),
    };

    const updatedMessages = [...targetConv.messages, userMsg, assistantMsg];
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConv!.id
          ? {
              ...c,
              title: c.messages.length === 0 ? prompt.slice(0, 45) || c.title : c.title,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : c
      )
    );

    setInputMessage('');
    const curAttachments = [...attachments];
    setAttachments([]);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: prompt,
          messages: targetConv.messages.map((m) => ({ role: m.role, content: m.content })),
          attachments: curAttachments.map((a) => ({ data: a.data, mimeType: a.mimeType })),
          mode: activeMode,
          context: {
            schoolName: activeSchool?.name,
            year: activeSchool?.year_label,
          },
        }),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        throw new Error(errorJson?.error || errorJson?.details || `Erreur de traitement (${response.status})`);
      }

      const data = await response.json();
      const answer = data.answer || "Désolé, aucune réponse n'a été retournée.";

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConv!.id
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: answer, loading: false } : m
                ),
              }
            : c
        )
      );
    } catch (err: any) {
      console.error(err);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConv!.id
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: `⚠️ Une erreur est survenue lors de la communication avec Gemini AI : ${err.message}. Veuillez vérifier votre connexion.`,
                        loading: false,
                        error: true,
                      }
                    : m
                ),
              }
            : c
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleDownloadTxt = (title: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}_ArnauldSchool.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = (title: string, text: string) => {
    const modeObj = MODES.find((m) => m.id === activeMode);
    exportAIPedagogyPDF(title, text, modeObj?.label || 'Pédagogie', activeSchool?.name);
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          const codeText = codeBuffer.join('\n');
          elements.push(
            <div key={`code-${index}`} className="relative my-3 rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
              <pre>{codeText}</pre>
            </div>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }
      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="font-display text-sm font-bold text-slate-900 dark:text-white mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="font-display text-base font-extrabold text-blue-600 dark:text-cyan-400 mt-5 mb-2">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="font-display text-lg font-black text-slate-900 dark:text-white mt-6 mb-3">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={index} className="ml-4 list-disc text-sm text-slate-700 dark:text-slate-200 my-1">
            {line.replace(/^[-*]\s+/, '')}
          </li>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={index} className="h-2" />);
      } else {
        elements.push(
          <p key={index} className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 my-1.5">
            {line}
          </p>
        );
      }
    });

    return elements;
  };

  const filteredHistory = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchHistory.toLowerCase())
  );

  return (
    <div 
      className="flex h-screen w-full overflow-hidden bg-white dark:bg-slate-900 select-none md:select-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* AI Conversations Sidebar */}
      {sidebarOpen && (
        <aside 
          style={{ width: `${sidebarWidth}px`, transition: isResizingSidebar ? 'none' : 'width 0.15s ease' }}
          className="relative flex flex-col border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 shrink-0"
        >
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl overflow-hidden shadow-xs border border-slate-200 bg-white">
                <img src="https://lh3.googleusercontent.com/d/1UGE1bVKWHiBPPu8hAup4QoGYQqE64lkl" alt="ArnauldSchool Logo" className="h-full w-full object-cover" />
              </div>
              <span className="font-display text-sm font-extrabold text-slate-900 dark:text-white">ArnauldSchool</span>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 lg:hidden cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <button
              type="button"
              onClick={handleNewConversation}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition-colors active:scale-95 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau chat</span>
            </button>
            <input
              type="text"
              placeholder="Rechercher un ancien chat..."
              value={searchHistory}
              onChange={(e) => setSearchHistory(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Mode Selector in Sidebar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Modes Pédagogiques
            </div>
            <div className="grid grid-cols-1 gap-1">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveMode(m.id)}
                  className={`flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-xs font-semibold text-left transition-colors cursor-pointer ${
                    activeMode === m.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{m.icon}</span>
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Anciens chats
            </div>
            {filteredHistory.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Aucune discussion enregistrée
              </div>
            ) : (
              filteredHistory.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setActiveConvId(c.id);
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`group flex cursor-pointer items-center justify-between rounded-xl p-2.5 text-xs transition-colors ${
                    c.id === activeConvId
                      ? 'bg-blue-100/70 text-blue-900 font-bold dark:bg-slate-800 dark:text-cyan-300'
                      : 'text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-cyan-500" />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <div className="hidden group-hover:flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleRenameConversation(c.id, e)}
                      className="p-1 hover:text-blue-600"
                      title="Renommer"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteConversation(c.id, e)}
                      className="p-1 hover:text-rose-600"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-200 p-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <GraduationCap className="h-3.5 w-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Spécialisation Pédagogique</span>
            </div>
            <div>Approche Par Compétences (APC)</div>
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={startResizing}
            onTouchStart={startResizing}
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-500/40 active:bg-blue-600 transition-colors flex items-center justify-center group z-10"
            title="Glisser pour redimensionner"
          >
            <div className="w-0.5 h-10 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500" />
          </div>
        </aside>
      )}

      {/* Main Chat Container */}
      <main className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700/80 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-cyan-400 transition-all hover:-translate-x-1 shadow-xs cursor-pointer group"
              title="Retourner au Tableau de Bord"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1 text-blue-600 dark:text-cyan-400" />
              <span>Tableau de bord</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors shadow-xs shrink-0 cursor-pointer"
              title="Menu historique"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 text-white">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <h1 className="font-display text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                {activeConversation?.title || 'ArnauldSchool AI'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Assistant Pédagogique Actif</span>
            </div>
          </div>
        </div>

        {/* Message Thread Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div className="mx-auto max-w-2xl py-8 text-center space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <h2 className="font-display text-xl font-black text-slate-900 dark:text-white">
                  Que souhaitez-vous préparer aujourd'hui ?
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Mode sélectionné : <strong className="text-blue-600 dark:text-cyan-400">{MODES.find((m) => m.id === activeMode)?.label}</strong> • Posez votre question au clavier ci-dessous.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-left">
                {SUGGESTIONS_BY_MODE[activeMode]?.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(sug.prompt)}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs transition-all hover:border-blue-500 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-850 dark:hover:border-cyan-500 cursor-pointer"
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-100">{sug.title}</span>
                    <span className="mt-2 text-slate-500 dark:text-slate-400 text-[11px] line-clamp-3">
                      "{sug.prompt}"
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeConversation.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
                <div className={`max-w-3xl rounded-2xl p-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white shadow-sm rounded-br-xs'
                    : 'border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-850 rounded-bl-xs'
                }`}>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {msg.attachments.map((att, aIdx) => (
                        <div
                          key={aIdx}
                          className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs"
                        >
                          {att.type === 'image' && att.previewURL ? (
                            <img src={att.previewURL} alt="aperçu" className="h-8 w-8 rounded object-cover" />
                          ) : att.type === 'audio' ? (
                            <Mic className="h-4 w-4 text-rose-300" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          <span className="truncate max-w-[140px] text-[11px]">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.loading ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className="inline-block h-2 w-2 animate-ping rounded-full bg-blue-600 dark:bg-cyan-400" />
                      <span>ArnauldSchool AI analyse et structure sa réponse...</span>
                    </div>
                  ) : msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>{renderMarkdown(msg.content)}</div>
                  )}

                  {msg.role === 'assistant' && !msg.loading && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-200/90 pt-3 dark:border-slate-700/80 text-xs">
                      {/* Direct Document Downloads: .DOC and .PDF */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => downloadWordDoc(activeConversation?.title || 'Document_Pedagogique', msg.content, activeSchool?.name)}
                          className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                          title="Télécharger directement au format Microsoft Word (.doc)"
                        >
                          <FileText className="h-3.5 w-3.5 text-blue-600" />
                          <span>Télécharger .DOC</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => exportAIPedagogyPDFEnhanced(activeConversation?.title || 'Document_Pedagogique', msg.content, 'Pédagogie APC', activeSchool?.name)}
                          className="flex items-center gap-1.5 rounded-xl bg-rose-50 px-3 py-1.5 font-bold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                          title="Télécharger directement au format PDF officiel"
                        >
                          <Download className="h-3.5 w-3.5 text-rose-600" />
                          <span>Télécharger .PDF</span>
                        </button>
                      </div>

                      {/* Dedicated Large Interfaces for Word and Excel */}
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenWordEditor(msg.id, msg.content)}
                          className="flex items-center gap-1.5 rounded-xl bg-[#2b579a] px-3.5 py-1.5 font-bold text-white hover:bg-blue-700 shadow-sm transition-all active:scale-95 cursor-pointer"
                          title="Ouvrir la grande interface Word pour modifier et mettre en page le document"
                        >
                          <FileText className="h-3.5 w-3.5 text-blue-200" />
                          <span>Grande interface Word</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenExcelEditor(msg.id, msg.content)}
                          className="flex items-center gap-1.5 rounded-xl bg-[#107c41] px-3.5 py-1.5 font-bold text-white hover:bg-emerald-700 shadow-sm transition-all active:scale-95 cursor-pointer"
                          title="Ouvrir la grande interface Excel pour modifier le tableau, trier et calculer"
                        >
                          <TableIcon className="h-3.5 w-3.5 text-emerald-200" />
                          <span>Grande interface Excel</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 cursor-pointer transition-colors"
                          title="Copier tout le texte"
                        >
                          {copiedMsgId === msg.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachments Preview Bar */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-800 dark:bg-slate-950">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
              >
                {att.previewURL ? (
                  <img src={att.previewURL} alt="thumbnail" className="h-6 w-6 rounded object-cover" />
                ) : att.type === 'audio' ? (
                  <Mic className="h-4 w-4 text-rose-500" />
                ) : (
                  <FileText className="h-4 w-4 text-amber-500" />
                )}
                <span className="truncate max-w-[120px] font-medium">{att.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Composer Bar & Microphone Dictation Controls */}
        <div className="relative border-t border-slate-200 bg-white px-3 py-2 sm:px-6 sm:py-2.5 dark:border-slate-800 dark:bg-slate-900">
          


          {/* MAIN INPUT CONTAINER - WIDER AND SLEEKER */}
          <div className="w-full max-w-5xl mx-auto flex items-end gap-1.5 sm:gap-2 rounded-2xl border border-slate-300 bg-white p-1.5 sm:p-2 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 shadow-xs transition-all">
            
            {/* Attachment Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 cursor-pointer"
                title="Joindre un fichier (Photo d'exercice, Copie d'élève, PDF)"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              {/* Attachment Dropdown */}
              {showAttachMenu && (
                <div className="absolute bottom-11 left-0 z-50 flex w-48 flex-col rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                    <span>Image / Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      className="hidden"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">
                    <Camera className="h-4 w-4 text-cyan-500" />
                    <span>Prendre photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleFileUpload(e, 'image')}
                      className="hidden"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">
                    <FileText className="h-4 w-4 text-amber-500" />
                    <span>Document PDF</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleFileUpload(e, 'pdf')}
                      className="hidden"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700">
                    <Mic className="h-4 w-4 text-rose-500" />
                    <span>Enregistrement / Audio</span>
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.aac"
                      onChange={(e) => handleFileUpload(e, 'audio')}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Educational Context Inject Button */}
            <button
              type="button"
              onClick={handleInjectContext}
              className="hidden sm:flex h-9 items-center gap-1 rounded-xl px-2 text-[11px] font-bold text-blue-600 hover:bg-blue-50 dark:text-cyan-400 dark:hover:bg-slate-700 cursor-pointer"
              title="Ajouter automatiquement le contexte de votre classe active"
            >
              <span>+ Contexte</span>
            </button>

            {/* Input Textarea - HIGH CONTRAST & DYNAMIC HEIGHT */}
            <div className="relative flex-1 flex flex-col justify-center min-w-0">
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isTranscribing
                    ? 'Transcription vocale en cours...'
                    : isListening
                    ? "🎤 Parlez... vos paroles s'écrivent ici"
                    : `Écrivez ou dictez votre consigne pour ArnauldSchool AI (${MODES.find((m) => m.id === activeMode)?.label})...`
                }
                className="w-full resize-none bg-transparent px-2 py-1 text-sm sm:text-base font-medium text-slate-900 placeholder-slate-400 outline-none dark:text-white leading-relaxed min-h-[34px] max-h-32"
              />

              {isTranscribing && (
                <div className="absolute right-2 top-1.5 flex items-center gap-1.5 rounded-lg bg-blue-100/90 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/80 dark:text-cyan-300">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Transcription...</span>
                </div>
              )}
            </div>

            {/* Clear Input Bar if text exists */}
            {inputMessage && !isListening && (
              <button
                type="button"
                onClick={() => setInputMessage('')}
                className="flex h-9 w-7 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Effacer le texte saisi"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}



            {/* Send Button */}
            <button
              type="button"
              disabled={(!inputMessage.trim() && attachments.length === 0) || isGenerating || isTranscribing}
              onClick={() => handleSendMessage()}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:opacity-40 disabled:pointer-events-none active:scale-95 shrink-0 cursor-pointer"
              title="Envoyer la question à l'IA"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>

      {/* Dedicated Word Large Interface Modal */}
      <WordEditorModal
        isOpen={wordEditorOpen}
        onClose={() => setWordEditorOpen(false)}
        initialContent={editingMessageContent}
        title={editingMessageTitle}
        onSave={handleSaveEditedContent}
        schoolName={activeSchool?.name}
      />

      {/* Dedicated Excel Large Interface Modal */}
      <ExcelEditorModal
        isOpen={excelEditorOpen}
        onClose={() => setExcelEditorOpen(false)}
        initialContent={editingMessageContent}
        title={editingMessageTitle}
        onSave={handleSaveEditedContent}
        schoolName={activeSchool?.name}
      />


    </div>
  );
};
