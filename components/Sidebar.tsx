import React, { useEffect, useState } from 'react';
import { ChatSession, StorageMode } from '../types';
import { ClaudeLogo, PlusIcon, TrashIcon, SettingsIcon } from './Icon';
import { getUserInfo } from '../services/puterService';

interface SidebarProps {
  sessions: ChatSession[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onOpenSettings: () => void;
  currentMode: StorageMode;
  onSwitchStorage: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    sessions, currentId, onSelect, onNewChat, onDelete, onOpenSettings, currentMode, onSwitchStorage 
}) => {
  const [username, setUsername] = useState<string>('User');

  useEffect(() => {
    getUserInfo().then(user => {
        if (user && user.username) {
            setUsername(user.username);
        }
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#f3f0eb]">
      <div className="p-4 flex items-center justify-between">
         {/* Logo Area */}
         <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-200/50 cursor-pointer transition-colors" onClick={onNewChat}>
            <ClaudeLogo className="w-8 h-8" />
         </div>
         <button 
           onClick={onNewChat}
           className="p-2 rounded-lg bg-white/50 hover:bg-stone-200/50 text-stone-600 transition-colors border border-stone-200/50"
           title="New Chat"
         >
           <PlusIcon />
         </button>
      </div>

      <div className="px-4 pb-2">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#D97757] text-white rounded-full font-medium shadow-sm hover:bg-[#c56a4b] transition-all transform hover:scale-[1.01] active:scale-[0.99] text-sm"
        >
            <PlusIcon /> <span>Start new chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2 space-y-1">
        <h3 className="px-3 py-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Recent
        </h3>
        
        {sessions.length === 0 && (
            <div className="text-stone-400 text-sm px-3 italic">No history yet.</div>
        )}

        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={`
              group relative flex items-center justify-between rounded-lg px-3 py-3 cursor-pointer text-sm transition-colors
              ${currentId === session.id ? 'bg-white shadow-sm text-stone-900 font-medium' : 'text-stone-600 hover:bg-stone-200/60'}
            `}
          >
            <div className="truncate pr-6">{session.title}</div>
            <button 
                onClick={(e) => onDelete(e, session.id)}
                className="hidden group-hover:block absolute right-2 p-1 text-stone-400 hover:text-red-500 hover:bg-stone-200 rounded"
            >
                <TrashIcon />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-stone-200 space-y-2">
        
        {/* Storage Switcher */}
        <button 
            onClick={onSwitchStorage}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-stone-200/60 text-stone-500 transition-colors text-xs"
        >
            <span>Storage: <span className="font-semibold text-stone-700 capitalize">{currentMode}</span></span>
            <span className="text-[#D97757]">Change</span>
        </button>

        <button 
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-200/60 text-stone-600 transition-colors text-sm"
        >
            <SettingsIcon className="w-5 h-5" />
            <span>Personalization</span>
        </button>

        <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#D97757] flex items-center justify-center text-white font-bold text-xs shadow-sm uppercase">
                {username.charAt(0)}
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-medium text-stone-700 truncate max-w-[140px]">{username}</span>
                <span className="text-xs text-stone-400">Pro Plan (Demo)</span>
            </div>
        </div>
      </div>
    </div>
  );
};