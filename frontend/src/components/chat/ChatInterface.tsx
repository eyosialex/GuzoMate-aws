import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Send, 
  Mic, 
  Square,
  Sparkles, 
  Bot, 
  User, 
  ExternalLink, 
  CloudSun,
  RotateCcw,
  AlertTriangle 
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { useAppStore } from '../../features/useAppStore';
import { useI18n } from '../../hooks/useI18n';
import { assistantService } from '../../services/assistantService';
import { voiceChatService } from '../../services/voiceChatService';
import { PlaceCard } from '../places/PlaceCard';
import { SoundWaveVisualizer } from './SoundWaveVisualizer';
import { AudioMessagePlayer } from './AudioMessagePlayer';
import { warmUpAudio } from '../../lib/audioManager';
import { springGentle, springTactile, tactilePress, cardEnter } from '../../lib/motion';

export const ChatInterface: React.FC = () => {
  const { t, language } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const messages = useAppStore((state) => state.messages);
  const addMessage = useAppStore((state) => state.addMessage);
  const clearMessages = useAppStore((state) => state.clearMessages);
  const currentUser = useAppStore((state) => state.currentUser);
  const isAssistantLoading = useAppStore((state) => state.isAssistantLoading);
  const setAssistantLoading = useAppStore((state) => state.setAssistantLoading);
  const userLocation = useAppStore((state) => state.userLocation);
  const setSelectedPlace = useAppStore((state) => state.setSelectedPlace);
  const toggleSavePlace = useAppStore((state) => state.toggleSavePlace);

  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Integrated Voice Chat state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [silenceSeconds, setSilenceSeconds] = useState<number | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  // Track only the freshly returned assistant response to auto-play once
  const [autoPlayAudioId, setAutoPlayAudioId] = useState<string | null>(null);

  const voiceTranscriptRef = useRef('');
  const lastSpokeTimeRef = useRef<number>(Date.now());
  const hasSpokenRef = useRef(false);
  const isSendingVoiceRef = useRef(false); // guard against double-fire
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const silenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  // Ref so the setInterval closure always calls the latest handleSendVoice
  const handleSendVoiceRef = useRef<() => Promise<void>>(async () => {});

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAssistantLoading]);

  // Clean up audio streams and timers on unmount
  useEffect(() => {
    return () => {
      if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [mediaStream]);

  const cancelVoiceMode = () => {
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsVoiceActive(false);
    setIsSpeaking(false);
    setSilenceSeconds(null);
    voiceTranscriptRef.current = '';
    recordedChunksRef.current = [];
    hasSpokenRef.current = false;
    isSendingVoiceRef.current = false;
  };

  const handleSendVoice = async () => {
    warmUpAudio();
    // Prevent double-fire from the silence interval
    if (isSendingVoiceRef.current) return;
    isSendingVoiceRef.current = true;
    // Stop silence monitoring immediately
    if (silenceIntervalRef.current) {
      clearInterval(silenceIntervalRef.current);
      silenceIntervalRef.current = null;
    }
    // 1. Gather audio blob from MediaRecorder
    const recorder = mediaRecorderRef.current;
    let audioBlob: Blob | undefined;

    if (recorder && recorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        try {
          recorder.requestData();
          recorder.stop();
        } catch {
          resolve();
        }
      });
    }

    if (recordedChunksRef.current.length > 0) {
      const mime = recorder?.mimeType || 'audio/webm';
      audioBlob = new Blob(recordedChunksRef.current, { type: mime });
    }

    const transcriptToSend = voiceTranscriptRef.current.trim();
    cancelVoiceMode();

    if (!transcriptToSend && (!audioBlob || audioBlob.size === 0)) {
      return;
    }

    setAssistantLoading(true);

    try {
      const response = await voiceChatService.sendVoiceRecording({
        audioBlob,
        recognizedTranscript: transcriptToSend,
        language,
        userLocation,
      });

      // 1. Display user message in chat section as if user texted it
      const userMsg: ChatMessage = {
        id: `usr-${Date.now()}`,
        sender: 'user',
        content: response.transcript,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      addMessage(userMsg);

      // 2. Display assistant message with audioUrl (which automatically plays only for this fresh response)
      const assistantMsgId = `asst-${Date.now()}`;
      if (response.audioUrl) {
        setAutoPlayAudioId(assistantMsgId);
      }

      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        audioUrl: response.audioUrl,
        audioDurationSeconds: response.audioDurationSeconds,
        places: response.places,
        weather: response.weather,
        sources: response.sources,
      };
      addMessage(assistantMsg);
    } catch (err: any) {
      console.error('[ChatInterface] Voice recording error:', err);
      const noVoice = err?.message?.includes('No voice');
      let errorContent: string;
      if (noVoice) {
        if (language === 'am') {
          errorContent = 'ምንም ድምፅ አልተሰማም። እባክዎን ማይክሮፎኑን ተጭነው በግልጽ ይናገሩ።';
        } else if (language === 'om') {
          errorContent = 'Sagaleen hin dhagayamne. Maaloo af-dubbii kee ifatti dubbadhu.';
        } else {
          errorContent = 'No voice was recognized. Please speak clearly into your microphone.';
        }
      } else {
        errorContent = 'Unable to process voice recording right now. Please verify your connection.';
      }
      const fallbackMsg: ChatMessage = {
        id: `asst-err-${Date.now()}`,
        sender: 'assistant',
        content: errorContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      addMessage(fallbackMsg);
    } finally {
      setAssistantLoading(false);
      isSendingVoiceRef.current = false;
    }
  };

  // Keep the ref up-to-date after every render so the setInterval closure is never stale
  useEffect(() => {
    handleSendVoiceRef.current = handleSendVoice;
  });

  const startVoiceMode = async () => {
    if (isAssistantLoading) return;
    warmUpAudio();
    setIsVoiceActive(true);
    setIsSpeaking(true);
    setSilenceSeconds(null);
    voiceTranscriptRef.current = '';
    hasSpokenRef.current = false;
    lastSpokeTimeRef.current = Date.now();
    recordedChunksRef.current = [];

    // 1. Request microphone stream
    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);

        // Instantiate MediaRecorder to capture audio bytes
        let mimeType = 'audio/webm';
        if (typeof MediaRecorder !== 'undefined') {
          if (!MediaRecorder.isTypeSupported('audio/webm')) {
            if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
            else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
            else mimeType = '';
          }
          const recorder = mimeType
            ? new MediaRecorder(stream, { mimeType })
            : new MediaRecorder(stream);

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              recordedChunksRef.current.push(event.data);
            }
          };

          recorder.start(100);
          mediaRecorderRef.current = recorder;
        }

        // Connect audio analyser to detect user voice volume
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
        }
      }
    } catch (err) {
      console.warn('Microphone permission blocked or unavailable:', err);
    }

    // 2. Initialize Speech Recognition if supported
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'am' ? 'am-ET' : language === 'om' ? 'om-ET' : 'en-US';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript + ' ';
          }
          if (text.trim()) {
            voiceTranscriptRef.current = text.trim();
            hasSpokenRef.current = true;
            lastSpokeTimeRef.current = Date.now();
            setIsSpeaking(true);
            setSilenceSeconds(null);
          }
        };

        recognition.onerror = () => {};
        recognition.onend = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition start failed:', err);
      }
    }

    // 3. Monitor for volume & silence after user has spoken
    if (silenceIntervalRef.current) clearInterval(silenceIntervalRef.current);

    silenceIntervalRef.current = setInterval(() => {
      const analyser = analyserRef.current;
      let isLoud = false;

      if (analyser) {
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        if (avg > 5) {
          isLoud = true;
        }
      }

      const now = Date.now();
      if (isLoud) {
        lastSpokeTimeRef.current = now;
        hasSpokenRef.current = true;
        setIsSpeaking(true);
        setSilenceSeconds(null);
      } else if (hasSpokenRef.current) {
        // Only count down to auto-send AFTER user has actually spoken!
        const quietMs = now - lastSpokeTimeRef.current;
        if (quietMs >= 2000) {
          setIsSpeaking(false);
          const remainingSecs = Math.max(0, Math.ceil((5000 - quietMs) / 1000));
          setSilenceSeconds(remainingSecs);

          // 5 seconds of silence after speaking -> auto-send!
          if (quietMs >= 5000) {
            handleSendVoiceRef.current();
          }
        }
      }
    }, 150);
  };

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isAssistantLoading) return;

    if (isVoiceActive) {
      cancelVoiceMode();
    }

    warmUpAudio();

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addMessage(userMsg);
    setInputQuery('');
    setAssistantLoading(true);

    const sessionId = currentUser?.id || localStorage.getItem('guzomate_session_id') || (() => {
      const sid = `traveler_session_${Date.now()}`;
      localStorage.setItem('guzomate_session_id', sid);
      return sid;
    })();

    try {
      const response = await assistantService.query({
        query: textToSend.trim(),
        language,
        location: userLocation,
        userId: sessionId,
        enableVoice: isVoiceActive,
      });

      const audioUrl = response.voice?.audioUrl || (
        response.voice?.audioBase64
          ? `data:${response.voice.mimeType || 'audio/mpeg'};base64,${response.voice.audioBase64}`
          : undefined
      );

      const assistantMsgId = `asst-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        sender: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        places: response.places as any,
        weather: response.weather as any,
        incidents: response.incidents as any,
        sources: response.sources,
        limitations: response.limitations,
        audioUrl,
        audioDurationSeconds: response.voice?.durationSeconds,
      };

      if (audioUrl && isVoiceActive) {
        setAutoPlayAudioId(assistantMsg.id);
      }

      addMessage(assistantMsg);
    } catch (err) {
      console.error('[ChatInterface] Assistant query error:', err);
      const fallbackMsg: ChatMessage = {
        id: `asst-err-${Date.now()}`,
        sender: 'assistant',
        content: 'Unable to connect to Gemini RAG service right now. Please verify your connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      addMessage(fallbackMsg);
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleClearMemory = async () => {
    const sessionId = currentUser?.id || localStorage.getItem('guzomate_session_id') || 'traveler_session';
    try {
      await assistantService.clearMemory(sessionId);
    } catch {
      // ignore
    }
    clearMessages();
  };

  const suggestions = [
    t('assistant.suggest1'),
    t('assistant.suggest2'),
    t('assistant.suggest3'),
  ];

  return (
    <div className="flex flex-col h-full bg-[#fbfaf4] overflow-hidden">
      {/* Frosted Glass Header */}
      <div className="px-4 py-3 border-b border-[rgba(32,34,31,0.1)] backdrop-blur-md bg-white/95 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 leading-tight">
              {t('assistant.title')}
            </h2>
            <p className="text-[11px] text-stone-500 font-medium leading-relaxed">
              {t('assistant.subtitle')}
            </p>
          </div>
        </div>

        {/* <div className="flex items-center gap-2">
          <motion.button
            type="button"
            whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
            transition={springTactile}
            onClick={handleClearMemory}
            className="p-1.5 px-2.5 rounded-lg bg-white hover:bg-stone-50 border border-[rgba(32,34,31,0.12)] hover:border-blue-600/30 text-stone-700 hover:text-blue-600 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 select-none shadow-xs"
            title="Clear conversation memory & start new chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </motion.button>
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-full leading-none">
            Gemini RAG
          </span>
        </div> */}
      </div>

      {/* Messages Flow with Scale 0.95 Spring Entry */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            variants={cardEnter}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            transition={springGentle}
            className={`flex gap-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] space-y-3 ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Bubble text with Inverse Leading */}
              <div
                className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white font-medium rounded-tr-none shadow-xs'
                    : 'bg-white text-stone-900 font-medium border border-[rgba(32,34,31,0.12)] rounded-tl-none shadow-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Voice audio response played automatically ONLY when freshly returned */}
                {msg.audioUrl && (
                  <AudioMessagePlayer
                    audioUrl={msg.audioUrl}
                    autoPlay={msg.id === autoPlayAudioId}
                    onPlaybackEnd={() => setAutoPlayAudioId(null)}
                  />
                )}

                <span
                  className={`block text-[10px] mt-1.5 leading-none ${
                    msg.sender === 'user' ? 'text-white/70 text-right' : 'text-stone-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {/* Rich Embedded UI: Grounded Sources Badge */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap px-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase font-mono leading-none">
                    {t('assistant.sourcesLabel')}:
                  </span>
                  {msg.sources.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium font-mono bg-white text-stone-700 border border-[rgba(32,34,31,0.12)] px-2 py-0.5 rounded-full inline-flex items-center gap-1 leading-none shadow-xs"
                    >
                      <ExternalLink className="w-2.5 h-2.5 text-blue-600" />
                      {s.type}
                    </span>
                  ))}
                </div>
              )}

              {/* Rich Embedded UI: Weather card in chat */}
              {msg.weather && (
                <div className="bg-white rounded-2xl p-3 border border-[rgba(32,34,31,0.12)] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block font-mono leading-none">
                      Forecast at Arrival
                    </span>
                    <span className="text-xl font-bold text-stone-900 font-display leading-tight">
                      {msg.weather.current.temperatureC}°C
                    </span>
                    <span className="text-xs font-medium text-stone-500 ml-2">
                      {msg.weather.current.condition}
                    </span>
                  </div>
                  <CloudSun className="w-8 h-8 text-blue-600" />
                </div>
              )}

              {/* Rich Embedded UI: Place cards directly in chat flow */}
              {msg.places && msg.places.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-stone-900 block px-1 leading-none font-mono uppercase text-[11px]">
                    Mapped Places ({msg.places.length})
                  </span>
                  {msg.places.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      onSelect={setSelectedPlace}
                      onToggleSave={toggleSavePlace}
                    />
                  ))}
                </div>
              )}

              {/* Rich Embedded UI: Hazard / Incidents in chat */}
              {msg.incidents && msg.incidents.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-rose-700 flex items-center gap-1 block px-1 leading-none font-mono uppercase text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Reported Hazards ({msg.incidents.length})</span>
                  </span>
                  {msg.incidents.map((inc) => (
                    <div key={inc.id} className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-800">{inc.type.replace(/_/g, ' ')}</span>
                        {inc.distanceMeters && (
                          <span className="text-[10px] text-rose-600 font-semibold">{Math.round(inc.distanceMeters)}m away</span>
                        )}
                      </div>
                      <p className="text-rose-900 font-medium leading-relaxed">{inc.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Grounding Disclaimers */}
              {msg.limitations && msg.limitations.length > 0 && (
                <div className="text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200 rounded-xl p-2.5 leading-relaxed">
                  ⚠️ {msg.limitations.join(' • ')}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="h-8 w-8 rounded-full bg-stone-100 text-stone-600 border border-[rgba(32,34,31,0.12)] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </motion.div>
        ))}

        {/* Loading Indicator */}
        {isAssistantLoading && (
          <motion.div
            variants={cardEnter}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            transition={springGentle}
            className="flex gap-3 justify-start items-center"
          >
            <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-[rgba(32,34,31,0.12)] rounded-2xl rounded-tl-none p-3.5 shadow-xs flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs font-medium text-stone-500 ml-2">GuzoMate is responding...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts carousel chips with tactile springs */}
      {messages.length < 3 && !isVoiceActive && (
        <div className="px-4 py-2 border-t border-[rgba(32,34,31,0.08)] bg-white/70 backdrop-blur-sm flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {suggestions.map((sug, i) => (
            <motion.button
              key={i}
              whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
              transition={springTactile}
              onClick={() => handleSendMessage(sug)}
              className="min-h-[40px] px-3.5 py-2 rounded-full text-xs font-semibold leading-none text-stone-700 bg-white border border-[rgba(32,34,31,0.12)] hover:border-blue-600/40 hover:text-blue-600 transition-colors whitespace-nowrap shadow-xs select-none cursor-pointer"
            >
              {sug}
            </motion.button>
          ))}
        </div>
      )}

      {/* Input area with frosted glass */}
      <div className="p-3 border-t border-[rgba(32,34,31,0.1)] backdrop-blur-md bg-white/95 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Dynamic Text Input OR Real-time Sound Wave Indicator */}
          {isVoiceActive ? (
            <SoundWaveVisualizer
              analyser={analyserRef.current}
              silenceSeconds={silenceSeconds}
              isSpeaking={isSpeaking}
              onCancel={cancelVoiceMode}
              onSendNow={handleSendVoice}
            />
          ) : (
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={t('assistant.inputPlaceholder')}
              className="flex-1 min-h-[44px] px-4 py-2 bg-[#f8f7f2] border border-[rgba(32,34,31,0.12)] rounded-full text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600/15 focus:border-blue-600 focus:bg-white transition-all shadow-xs leading-normal"
              disabled={isAssistantLoading}
            />
          )}

          {/* Mic Button */}
          <motion.button
            type="button"
            aria-label={isVoiceActive ? 'Stop voice recording' : 'Start voice chat'}
            whileTap={shouldReduceMotion ? undefined : tactilePress.icon}
            transition={springTactile}
            onClick={isVoiceActive ? handleSendVoice : startVoiceMode}
            className={`h-11 w-11 rounded-full shrink-0 flex items-center justify-center transition-all cursor-pointer ${
              isVoiceActive
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-sm ring-2 ring-red-400/40 animate-pulse'
                : 'bg-white hover:bg-stone-50 border border-[rgba(32,34,31,0.12)] hover:border-blue-600/40 text-stone-600 hover:text-blue-600 shadow-xs'
            }`}
          >
            {isVoiceActive ? (
              <span className="relative flex h-5 w-5 items-center justify-center">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <Square className="w-3.5 h-3.5 fill-white text-white relative" />
              </span>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </motion.button>

          {/* Send Button */}
          <motion.button
            type="submit"
            aria-label="Send message to assistant"
            whileTap={shouldReduceMotion ? undefined : tactilePress.icon}
            transition={springTactile}
            disabled={(!inputQuery.trim() && !isVoiceActive) || isAssistantLoading}
            className="h-11 w-11 rounded-full shrink-0 flex items-center justify-center bg-blue-600 hover:bg-blue-700 active:scale-95 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer"
          >
            <Send className="w-5 h-5 text-white" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};
