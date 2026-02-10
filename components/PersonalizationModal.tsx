import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { AVAILABLE_MODELS } from '../services/puterService';

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const PersonalizationModal: React.FC<PersonalizationModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-[#fcfaf8]">
          <h2 className="text-lg font-serif font-bold text-stone-800">Personalization</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Default Model
            </label>
            <div className="relative">
              <select
                value={localSettings.defaultModel}
                onChange={(e) => setLocalSettings({...localSettings, defaultModel: e.target.value})}
                className="w-full appearance-none bg-stone-50 border border-stone-200 text-stone-800 text-sm rounded-lg focus:ring-[#D97757] focus:border-[#D97757] block p-3 pr-8"
              >
                {AVAILABLE_MODELS.map(model => (
                    <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-stone-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
            <p className="mt-1 text-xs text-stone-500">Select the model you'd like to use for new chats.</p>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">
              Custom Instructions (System Prompt)
            </label>
            <textarea
              value={localSettings.systemPrompt}
              onChange={(e) => setLocalSettings({...localSettings, systemPrompt: e.target.value})}
              rows={6}
              className="w-full bg-stone-50 border border-stone-200 text-stone-800 text-sm rounded-lg focus:ring-[#D97757] focus:border-[#D97757] block p-3 resize-none scrollbar-thin"
              placeholder="e.g., You are an expert Python developer. Always answer concisely and provide code snippets."
            />
            <p className="mt-1 text-xs text-stone-500">
              These instructions will be sent to the AI at the start of every chat to keep it on goal.
            </p>
          </div>
        </div>

        <div className="p-5 border-t border-stone-100 bg-[#fcfaf8] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-[#D97757] rounded-lg hover:bg-[#c56a4b] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D97757]"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};