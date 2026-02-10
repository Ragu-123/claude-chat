import React, { useState, useEffect } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { ChatSession, Message, AppSettings, Attachment, StorageContext, StorageMode } from './types';
import { PersonalizationModal } from './components/PersonalizationModal';
import * as puterService from './services/puterService';

const App: React.FC = () => {
  const [storageCtx, setStorageCtx] = useState<StorageContext | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnchor, setCurrentAnchor] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(puterService.DEFAULT_SETTINGS);

  // Setup State
  const [setupError, setSetupError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Attempt to recover Puter session, but Local requires explicit re-selection
  useEffect(() => {
    const savedMode = localStorage.getItem('claude-storage-mode');
    const savedPath = localStorage.getItem('claude-storage-path');
    
    if (savedMode === 'puter' && savedPath) {
        validateAndInitialize('puter', savedPath);
    }
    // Note: We don't auto-load 'local' because we need the handle again via user gesture usually.
  }, []);

  const validateAndInitialize = async (mode: StorageMode, pathOrHandle: any) => {
    setIsInitializing(true);
    setSetupError(null);
    
    const context: StorageContext = {
        mode,
        path: mode === 'puter' ? pathOrHandle : undefined,
        handle: mode === 'local' ? pathOrHandle : undefined
    };

    const success = await puterService.initializeStorage(context);
    
    if (success || mode === 'local') { // Local might fail on first try if dir is empty but handle is valid
      setStorageCtx(context);
      
      // Persist preference
      localStorage.setItem('claude-storage-mode', mode);
      if (mode === 'puter') localStorage.setItem('claude-storage-path', pathOrHandle);
      
      refreshSessionList(context);
      const loadedSettings = await puterService.loadSettings(context);
      setSettings(loadedSettings);
    } else {
        setSetupError("Could not initialize storage. Check permissions or path.");
    }
    setIsInitializing(false);
  };

  const refreshSessionList = async (ctx: StorageContext) => {
    const list = await puterService.loadChatList(ctx);
    setSessions(list);
  };

  const handleSelectSession = async (sessionId: string) => {
    if (!storageCtx) return;
    if (sessionId === currentSessionId) return;

    setIsLoading(true);
    const session = await puterService.loadChatSession(storageCtx, sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setCurrentAnchor(session.memoryAnchor);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    }
    setIsLoading(false);
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setCurrentAnchor(undefined);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!storageCtx) return;
    if (confirm("Are you sure you want to delete this chat?")) {
        await puterService.deleteChatSession(storageCtx, sessionId);
        await refreshSessionList(storageCtx);
        if (currentSessionId === sessionId) {
            handleNewChat();
        }
    }
  }

  const handleSaveSettings = async (newSettings: AppSettings) => {
      setSettings(newSettings);
      if (storageCtx) {
          await puterService.saveSettings(storageCtx, newSettings);
      }
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!storageCtx) return;

    setIsLoading(true);
    let uploadedAttachment: Attachment | null = null;

    if (file) {
        uploadedAttachment = await puterService.uploadFile(storageCtx, file);
    }

    const userMsg: Message = {
      role: 'user',
      content,
      attachments: uploadedAttachment ? [uploadedAttachment] : undefined,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    let sessionId = currentSessionId;
    let title = "New Chat";
    let anchor = currentAnchor;

    if (!sessionId) {
      sessionId = crypto.randomUUID();
      title = await puterService.generateTitle(content);
      setCurrentSessionId(sessionId);
    } else {
        const s = sessions.find(s => s.id === sessionId);
        if(s) title = s.title;
    }

    const aiMsgId = crypto.randomUUID();
    setMessages(prev => [
      ...prev, 
      { role: 'assistant', content: '', id: aiMsgId, timestamp: Date.now() }
    ]);

    let fullAiResponse = "";

    try {
      const stream = puterService.streamChatResponse(
          updatedMessages, 
          settings.defaultModel, 
          settings.systemPrompt,
          anchor
      );

      for await (const chunk of stream) {
        fullAiResponse += chunk;
        setMessages(prev => prev.map(m => 
          m.id === aiMsgId ? { ...m, content: fullAiResponse } : m
        ));
      }

      const finalAssistantMsg: Message = { 
          role: 'assistant', 
          content: fullAiResponse, 
          id: aiMsgId, 
          timestamp: Date.now() 
      };
      
      const finalMessages = [...updatedMessages, finalAssistantMsg];

      // Advanced Memory Update
      const newAnchor = await puterService.updateMemoryAnchor(anchor, [userMsg, finalAssistantMsg]);
      setCurrentAnchor(newAnchor);

      const updatedSession: ChatSession = {
        id: sessionId,
        title,
        updatedAt: Date.now(),
        messages: finalMessages,
        memoryAnchor: newAnchor
      };

      await puterService.saveChatSession(storageCtx, updatedSession);
      await refreshSessionList(storageCtx);

    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { role: 'system', content: 'Error: Failed to generate response.', id: crypto.randomUUID(), timestamp: Date.now() }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchStorage = () => {
      setStorageCtx(null);
      localStorage.removeItem('claude-storage-mode');
  };

  if (!storageCtx) {
    return (
        <SetupScreen 
            onSetup={validateAndInitialize} 
            error={setupError}
            isInitializing={isInitializing}
        />
    );
  }

  return (
    <div className="flex h-full w-full bg-[#f5f1ec] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
         <div 
           className="fixed inset-0 bg-stone-900/20 z-20 md:hidden"
           onClick={() => setIsSidebarOpen(false)}
         />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-30 h-full w-[260px] bg-stone-100 border-r border-stone-200 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-[280px]'}
      `}>
        <Sidebar 
          sessions={sessions}
          currentId={currentSessionId}
          onSelect={handleSelectSession}
          onNewChat={handleNewChat}
          onDelete={handleDeleteChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
          currentMode={storageCtx.mode}
          onSwitchStorage={handleSwitchStorage}
        />
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full relative w-full">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center p-4 border-b border-stone-200 bg-[#f5f1ec]">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -ml-2 text-stone-600 hover:bg-stone-200 rounded-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <span className="ml-2 font-serif text-stone-700 font-medium">Claude (Puter)</span>
        </div>

        <ChatInterface 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading}
          currentModelId={settings.defaultModel}
        />
      </div>

      <PersonalizationModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
};

export default App;