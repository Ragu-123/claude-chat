import React, { useState } from 'react';
import { ClaudeLogo } from './Icon';
import { StorageMode } from '../types';

interface SetupScreenProps {
  onSetup: (mode: StorageMode, pathOrHandle: any) => void;
  error?: string | null;
  isInitializing?: boolean;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onSetup, error, isInitializing }) => {
  const [mode, setMode] = useState<StorageMode>('local');
  const [puterPath, setPuterPath] = useState('~/puter-claude-memory');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleLocalSelect = async () => {
      setLocalError(null);
      try {
          if (!('showDirectoryPicker' in window)) {
              setLocalError("Your browser does not support the Local File System API.");
              return;
          }

          // @ts-ignore - File System Access API
          const handle = await window.showDirectoryPicker();
          if (handle) {
              onSetup('local', handle);
          }
      } catch (e: any) {
          console.error("FS Error:", e);
          if (e.name === 'AbortError') return; // User cancelled
          
          if (e.message?.includes('Cross origin sub frames') || e.name === 'SecurityError') {
             setLocalError("restricted");
          } else {
             setLocalError("Could not access local folder. Please try again or use Puter Cloud.");
          }
      }
  };

  const handlePuterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (puterPath.trim()) {
      onSetup('puter', puterPath.trim());
    }
  };

  const openNewTab = () => {
      window.open(window.location.href, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f1ec] p-4 font-sans">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-sm border border-stone-200 p-8 md:p-10">
        <div className="flex justify-center mb-6">
          <ClaudeLogo className="w-14 h-14" />
        </div>
        
        <h1 className="text-3xl font-serif text-center text-stone-800 mb-2">
          Welcome
        </h1>
        <p className="text-stone-500 text-center mb-8">
          Where should we store your conversation memory?
        </p>

        {/* Mode Toggle */}
        <div className="flex bg-stone-100 p-1 rounded-lg mb-8">
            <button 
                onClick={() => { setMode('local'); setLocalError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'local' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
                Local Computer
            </button>
            <button 
                onClick={() => { setMode('puter'); setLocalError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'puter' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
            >
                Puter Cloud
            </button>
        </div>

        {mode === 'local' ? (
            <div className="space-y-6 animate-fade-in">
                 <div className="bg-stone-50 p-4 rounded-lg border border-stone-100 text-center">
                    <h3 className="text-sm font-semibold text-stone-700 mb-2">Local File System</h3>
                    <p className="text-xs text-stone-500 leading-relaxed mb-4">
                        Select a folder on your device. We will create a <code>claude chats</code> subfolder to store your history securely.
                    </p>
                    
                    {localError === 'restricted' ? (
                        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs text-left">
                            <strong>Browser Restriction:</strong> <br/>
                            Accessing local folders is blocked within this frame. Please open the app in a new tab to enable this feature.
                            <button 
                                onClick={openNewTab}
                                className="mt-2 w-full py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded transition-colors"
                            >
                                Open in New Tab ↗
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleLocalSelect}
                            disabled={isInitializing}
                            className="w-full py-3 bg-[#D97757] hover:bg-[#c56a4b] text-white font-medium rounded-lg transition-colors shadow-sm"
                        >
                            {isInitializing ? "Initializing..." : "Select Folder"}
                        </button>
                    )}
                 </div>
                 <p className="text-[10px] text-stone-400 text-center">
                     Note: You may need to grant permission again if you refresh the page.
                 </p>
            </div>
        ) : (
            <form onSubmit={handlePuterSubmit} className="space-y-6 animate-fade-in">
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-100">
                    <h3 className="text-sm font-semibold text-stone-700 mb-2">Puter Cloud Storage</h3>
                    <p className="text-xs text-stone-500 leading-relaxed mb-4">
                        Save chats to your Puter account. Access them from anywhere.
                    </p>
                    <div>
                        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Path</label>
                        <input
                            type="text"
                            value={puterPath}
                            onChange={(e) => setPuterPath(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-stone-200 rounded-lg text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#D97757]/50 text-sm font-mono"
                            placeholder="~/puter-claude-memory"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isInitializing || !puterPath.trim()}
                    className="w-full py-3 bg-[#D97757] hover:bg-[#c56a4b] text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                    {isInitializing ? "Connecting..." : "Connect"}
                </button>
            </form>
        )}

        {(error || (localError && localError !== 'restricted')) && (
            <div className="mt-6 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs text-center">
                {error || localError}
            </div>
        )}
      </div>
    </div>
  );
};