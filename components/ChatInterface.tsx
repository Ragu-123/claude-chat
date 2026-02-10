import React, { useEffect, useRef, useState } from 'react';
import { Message, Attachment } from '../types';
import { ClaudeLogo, UserIcon, SendIcon, PaperClipIcon, XMarkIcon, FileIcon } from './Icon';
import { MarkdownText } from './MarkdownText';
import { AVAILABLE_MODELS } from '../services/puterService';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string, file?: File) => void;
  isLoading: boolean;
  currentModelId: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, currentModelId }) => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll effect
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]); 

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!input.trim() && !selectedFile) || isLoading) return;
    onSendMessage(input, selectedFile || undefined);
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // Reset height
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setSelectedFile(e.target.files[0]);
      }
  };

  const modelName = AVAILABLE_MODELS.find(m => m.id === currentModelId)?.name || currentModelId;

  const renderAttachments = (attachments?: Attachment[]) => {
      if (!attachments || attachments.length === 0) return null;
      return (
          <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-700">
                      <FileIcon className="w-4 h-4 text-stone-500" />
                      <span className="font-medium truncate max-w-[200px]">{att.name}</span>
                  </div>
              ))}
          </div>
      );
  };

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 scrollbar-thin">
        <div className="max-w-3xl mx-auto space-y-8 pb-32">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-20 text-center space-y-6 animate-fade-in">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-stone-100">
                    <ClaudeLogo className="w-16 h-16" />
                </div>
                <div>
                    <h2 className="text-2xl font-serif text-stone-800 mb-2">Good afternoon</h2>
                    <p className="text-stone-500">How can I help you today?</p>
                </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 md:gap-6 ${index === messages.length - 1 ? 'animate-fade-in' : ''}`}
            >
              <div className="flex-shrink-0 mt-1">
                {msg.role === 'assistant' ? (
                   <ClaudeLogo className="w-7 h-7" />
                ) : (
                   <UserIcon className="w-7 h-7" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-stone-800 text-sm mb-1">
                  {msg.role === 'assistant' ? 'Claude' : 'You'}
                </div>
                {/* Render Attachments if any */}
                {renderAttachments(msg.attachments)}
                <div className="text-stone-800">
                    <MarkdownText content={msg.content} />
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
             <div className="flex gap-4 md:gap-6 animate-fade-in">
                 <div className="flex-shrink-0 mt-1">
                    <ClaudeLogo className="w-7 h-7" />
                 </div>
                 <div className="flex items-center">
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce mr-1"></div>
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce mr-1 delay-75"></div>
                    <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-150"></div>
                 </div>
             </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#f5f1ec] via-[#f5f1ec] to-transparent pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-2 flex flex-col relative focus-within:ring-2 focus-within:ring-[#D97757]/20 focus-within:border-[#D97757]/50 transition-all">
            
            {selectedFile && (
                <div className="mx-2 mt-2 mb-1 inline-flex items-center gap-2 bg-stone-100 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-700 w-fit">
                    <FileIcon className="w-4 h-4 text-stone-500" />
                    <span className="font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                    <button onClick={() => setSelectedFile(null)} className="ml-2 hover:text-stone-900"><XMarkIcon /></button>
                </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Reply to Claude..."
              rows={1}
              className="w-full bg-transparent border-none text-stone-800 placeholder-stone-400 focus:ring-0 resize-none max-h-48 py-3 px-3 scrollbar-thin font-sans text-base"
              disabled={isLoading}
            />
            
            <div className="flex justify-between items-center px-2 pb-1 pt-2">
                <div className="flex items-center gap-3">
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Attach file"
                     >
                         <PaperClipIcon />
                     </button>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect}
                        accept=".pdf,.txt,.doc,.docx,.md,.csv,.js,.ts,.tsx,.json,.html,.css"
                     />
                     <div className="text-xs text-stone-400 font-medium">
                        {modelName}
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={(!input.trim() && !selectedFile) || isLoading}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                    (input.trim() || selectedFile) && !isLoading
                        ? 'bg-[#D97757] text-white hover:bg-[#c56a4b]'
                        : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                    }`}
                >
                    <SendIcon />
                </button>
            </div>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-stone-400">
                AI can make mistakes. Please use with caution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};