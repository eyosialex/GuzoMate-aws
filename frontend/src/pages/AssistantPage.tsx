import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, MessageSquare, Compass, ShieldCheck } from 'lucide-react';
import { ChatInterface } from '../components/chat/ChatInterface';
import { springGentle } from '../lib/motion';

export const AssistantPage: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="w-full h-[calc(100vh-4rem)] bg-[#f8faf8] flex flex-col overflow-hidden font-sans">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col h-full bg-white sm:border-x border-gray-200 shadow-xs overflow-hidden">
        {/* Assistant Header Banner */}
        <div className="px-4 py-3 bg-[#f0f7f3] border-b border-[#d1e2d8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#183a2b] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-extrabold text-gray-950">
                GuzoMate Multilingual Travel AI
              </h2>
              <p className="text-[10px] text-gray-500">
                Grounded via OSM places, real-time weather API, and highway safety telemetry
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold uppercase bg-white text-[#183a2b] border border-[#d1e2d8] px-2 py-0.5 rounded-full hidden sm:inline-block">
            Gemini & BAAI/bge-m3 RAG
          </span>
        </div>

        {/* Chat Interface Container */}
        <div className="flex-1 overflow-hidden relative">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
