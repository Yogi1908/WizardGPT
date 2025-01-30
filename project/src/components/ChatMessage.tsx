import React from 'react';
import { Copy, Check, Bot } from 'lucide-react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

function CodeBlock({ content }: { content: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 p-2 rounded bg-gray-700/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy code"
      >
        {copied ? <Check size={14} className="md:w-4 md:h-4" /> : <Copy size={14} className="md:w-4 md:h-4" />}
      </button>
      <pre className="bg-gray-900 text-gray-100 p-3 md:p-4 rounded-lg overflow-x-auto text-[12px] md:text-sm">
        <code className="font-mono">
          {content}
        </code>
      </pre>
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  const processContent = (content: string) => {
    const parts = content.split('```');
    return parts.map((part, index) => {
      if (index % 2 === 0) {
        const segments = part.split(/\n\n/);
        return segments.map((segment, sIndex) => {
          const lines = segment.split('\n');
          return lines.map((line, lineIndex) => {
            const endsWithColon = line.trim().endsWith(':');
            
            if (line.trim().startsWith('**')) {
              return (
                <h3 key={`bold-${index}-${sIndex}-${lineIndex}`} className="text-base md:text-lg font-bold mb-2 mt-3 first:mt-0">
                  {line.replace(/^\*\*\s*/, '')}
                </h3>
              );
            }
            else if (line.trim().startsWith('#')) {
              return (
                <h3 key={`h-${index}-${sIndex}-${lineIndex}`} className="text-sm md:text-base font-bold mb-2 mt-3 first:mt-0">
                  {line.replace(/^#+\s/, '')}
                </h3>
              );
            }
            return line.trim() && (
              <p 
                key={`p-${index}-${sIndex}-${lineIndex}`} 
                className={`mb-1.5 last:mb-0 text-[13px] md:text-[15px] leading-relaxed ${
                  endsWithColon ? 'font-semibold text-gray-900 dark:text-white' : ''
                }`}
              >
                {line}
              </p>
            );
          });
        });
      } else {
        const [language, ...codeLines] = part.split('\n');
        const code = codeLines.join('\n').trim();
        return <CodeBlock key={`code-${index}`} content={code} />;
      }
    });
  };

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse ml-auto' : ''}`}>
      {!isUser && (
        <div className="w-6 h-6 md:w-7 md:h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-gray-600 to-gray-700">
          <Bot size={14} className="md:w-4 md:h-4 text-white" />
        </div>
      )}
      <div className={`px-3 md:px-4 py-2.5 md:py-3 rounded-xl max-w-[calc(100vw-3.5rem)] md:max-w-[85%] shadow-sm ${
        isUser 
          ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white border border-gray-600/20' 
          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600/30'
      }`}>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {processContent(message.content)}
        </div>
      </div>
    </div>
  );
}