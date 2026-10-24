import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  Bot, 
  User, 
  ExternalLink, 
  CloudSun 
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { useAppStore } from '../../features/useAppStore';
import { useI18n } from '../../hooks/useI18n';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { assistantService } from '../../services/assistantService';
import { PlaceCard } from '../places/PlaceCard';
import { IconButton } from '../common/IconButton';
import { springGentle, springTactile, tactilePress, cardEnter } from '../../lib/motion';

export const ChatInterface: React.FC = () => {
  const { t, language } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const messages = useAppStore((state) => state.messages);
  const addMessage = useAppStore((state) => state.addMessage);
  const isAssistantLoading = useAppStore((state) => state.isAssistantLoading);
  const setAssistantLoading = useAppStore((state) => state.setAssistantLoading);
  const userLocation = useAppStore((state) => state.userLocation);
  const setSelectedPlace = useAppStore((state) => state.setSelectedPlace);
  const toggleSavePlace = useAppStore((state) => state.toggleSavePlace);

  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleVoiceResult = (spokenText: string) => {
    setInputQuery(spokenText);
  };

  const { isListening, startListening, stopListening, hasSupport } =
    useSpeechRecognition(language, handleVoiceResult);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAssistantLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isAssistantLoading) return;

    if (isListening) {
      stopListening();
    }

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addMessage(userMsg);
    setInputQuery('');
    setAssistantLoading(true);

    try {
      const response = await assistantService.query({
        query: textToSend.trim(),
        language,
        location: userLocation,
      });

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        places: response.places,
        weather: response.weather,
        incidents: response.incidents,
        sources: response.sources,
      };

      addMessage(assistantMsg);
    } catch {
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

  const suggestions = [
    t('assistant.suggest1'),
    t('assistant.suggest2'),
    t('assistant.suggest3'),
  ];

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Frosted Glass Header */}
      <div className="px-4 py-3 border-b border-gray-100/80 backdrop-blur-md bg-white/85 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 leading-tight">
              {t('assistant.title')}
            </h2>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
              {t('assistant.subtitle')}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50/90 border border-indigo-100/80 px-2.5 py-0.5 rounded-full leading-none">
          Gemini RAG
        </span>
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
              <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
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
                    ? 'bg-indigo-600 text-white font-medium rounded-tr-none shadow-sm'
                    : 'bg-gray-50/90 text-gray-900 font-medium border border-gray-200/70 rounded-tl-none shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <span
                  className={`block text-[10px] mt-1.5 leading-none ${
                    msg.sender === 'user' ? 'text-indigo-200 text-right' : 'text-gray-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>

              {/* Rich Embedded UI: Grounded Sources Badge */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap px-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                    {t('assistant.sourcesLabel')}:
                  </span>
                  {msg.sources.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium bg-gray-100/80 text-gray-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1 leading-none"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      {s.type}
                    </span>
                  ))}
                </div>
              )}

              {/* Rich Embedded UI: Weather card in chat */}
              {msg.weather && (
                <div className="bg-gradient-to-r from-indigo-50/90 to-indigo-100/50 rounded-2xl p-3 border border-indigo-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block leading-none">
                      Forecast at Arrival
                    </span>
                    <span className="text-xl font-bold text-gray-900 leading-tight">
                      {msg.weather.current.temperatureC}°C
                    </span>
                    <span className="text-xs font-medium text-gray-600 ml-2">
                      {msg.weather.current.condition}
                    </span>
                  </div>
                  <CloudSun className="w-8 h-8 text-indigo-600" />
                </div>
              )}

              {/* Rich Embedded UI: Place cards directly in chat flow */}
              {msg.places && msg.places.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-gray-700 block px-1 leading-none">
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
            </div>

            {msg.sender === 'user' && (
              <div className="h-8 w-8 rounded-full bg-gray-200/80 text-gray-700 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
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
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-gray-50/90 border border-gray-200/70 rounded-2xl rounded-tl-none p-3.5 shadow-sm flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce" />
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs font-medium text-gray-500 ml-2">Retrieving Addis knowledge...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts carousel chips with tactile springs */}
      {messages.length < 3 && (
        <div className="px-4 py-2 border-t border-gray-50 bg-gray-50/60 backdrop-blur-sm flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {suggestions.map((sug, i) => (
            <motion.button
              key={i}
              whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
              transition={springTactile}
              onClick={() => handleSendMessage(sug)}
              className="min-h-[44px] px-3.5 py-2 rounded-full text-xs font-semibold leading-none text-gray-700 bg-white border border-gray-200/80 hover:border-indigo-300 hover:text-indigo-600 transition-colors whitespace-nowrap shadow-sm select-none"
            >
              {sug}
            </motion.button>
          ))}
        </div>
      )}

      {/* Voice Listening indicator banner */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, height: 'auto' }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={springGentle}
            className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-700 font-semibold"
          >
            <span className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-indigo-600 animate-bounce" />
              {t('assistant.listening')}
            </span>
            <button
              onClick={stopListening}
              className="text-xs text-indigo-800 underline font-semibold min-h-[44px] px-2 flex items-center"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area with frosted glass */}
      <div className="p-3 border-t border-gray-100/80 backdrop-blur-md bg-white/90 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Mic Button with 44px tap target */}
          {hasSupport && (
            <IconButton
              type="button"
              aria-label={isListening ? 'Stop listening' : 'Start speech recognition'}
              icon={
                isListening ? (
                  <MicOff className="w-5 h-5 text-red-600" />
                ) : (
                  <Mic className="w-5 h-5 text-gray-600" />
                )
              }
              onClick={() => (isListening ? stopListening() : startListening())}
              variant={isListening ? 'secondary' : 'ghost'}
              className="h-11 w-11 rounded-full shrink-0"
            />
          )}

          {/* Text input with pill styling */}
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={t('assistant.inputPlaceholder')}
            className="flex-1 min-h-[44px] px-4 py-2 bg-gray-50/80 border border-gray-200 rounded-full text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm leading-normal"
          />

          {/* Send Button with 44px tap target */}
          <IconButton
            type="submit"
            aria-label="Send message to assistant"
            icon={<Send className="w-5 h-5 text-white" />}
            variant="primary"
            shape="circle"
            disabled={!inputQuery.trim() || isAssistantLoading}
            className="h-11 w-11 shrink-0"
          />
        </form>
      </div>
    </div>
  );
};
