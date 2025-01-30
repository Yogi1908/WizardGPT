import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Send, Loader2, Sun, Moon } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { Message } from './types';
import { useTheme } from './context/ThemeContext';

function App() {
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error('Gemini API key is not configured');
      }

      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const chat = model.startChat({
        history: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: msg.content,
        })),
      });

      const result = await chat.sendMessage(input);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Empty response received from Gemini API');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: text,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      let errorMessage = 'Sorry, there was an error processing your request.';
      
      if (error.message === 'Gemini API key is not configured') {
        errorMessage = 'Please configure your Gemini API key in the .env file.';
      } else if (error.status === 401) {
        errorMessage = 'Invalid Gemini API key. Please check your configuration.';
      } else if (error.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (error.message?.includes('SAFETY')) {
        errorMessage = 'The request was flagged by content safety filters. Please try rephrasing your message.';
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      <div className="flex-1 flex flex-col max-h-screen">
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 transition-colors duration-200">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-3 md:px-6 py-3 md:py-4 flex justify-between items-center flex-shrink-0">
            <div>
              <h1 className="text-lg md:text-2xl font-bold text-white">WizardGPT</h1>
              {!import.meta.env.VITE_GEMINI_API_KEY && (
                <p className="text-xs md:text-sm text-red-200 mt-1">⚠️ Please add your Gemini API key to the .env file</p>
              )}
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 md:p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon size={18} className="md:w-5 md:h-5 text-white" />
              ) : (
                <Sun size={18} className="md:w-5 md:h-5 text-white" />
              )}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-2 md:px-4 py-3 md:py-6 space-y-3 md:space-y-6 bg-gray-50 dark:bg-gray-800/50 transition-colors duration-200">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <p className="text-sm md:text-base">How can I assist you today?</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className="transform transition-all duration-300 ease-out"
                style={{
                  animation: 'slideIn 0.3s ease-out forwards',
                }}
              >
                <ChatMessage message={message} />
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-3 md:gap-4 text-gray-600 dark:text-gray-400 animate-fade-in">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center">
                  <Loader2 size={16} className="md:w-[18px] md:h-[18px] text-white animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-2 md:p-4 bg-white dark:bg-gray-800 transition-colors duration-200">
            <div className="flex gap-2 max-w-screen-xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-3 md:px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-white dark:hover:bg-gray-600 text-[13px] md:text-[15px] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !import.meta.env.VITE_GEMINI_API_KEY}
                className={`px-3 md:px-4 py-2 rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 text-white flex items-center gap-2 transition-all duration-200 ${
                  isLoading || !import.meta.env.VITE_GEMINI_API_KEY
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:from-gray-800 hover:to-gray-900 hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {isLoading ? (
                  <Loader2 size={14} className="md:w-4 md:h-4 animate-spin" />
                ) : (
                  <Send size={14} className="md:w-4 md:h-4" />
                )}
                <span className="hidden sm:inline text-[13px] md:text-[15px]">
                  {isLoading ? 'Processing...' : 'Send'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;