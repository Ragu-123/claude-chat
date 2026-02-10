import { ChatSession, Message, AppSettings, Attachment, StorageContext } from '../types';

export const AVAILABLE_MODELS = [
  { id: 'claude-opus-4-6', name: 'Claude Opus 4.6 (Preview)' },
  { id: 'claude-opus-4-5', name: 'Claude Opus 4.5' },
  { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5' },
  { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5' },
  { id: 'claude-opus-4', name: 'Claude Opus 4' },
  { id: 'claude-sonnet-4', name: 'Claude Sonnet 4' },
];

export const DEFAULT_SETTINGS: AppSettings = {
    systemPrompt: "",
    defaultModel: 'claude-opus-4-6'
};

// --- Storage Logic Abstraction ---

const getLocalFileHandle = async (dirHandle: any, name: string, create = false) => {
    return await dirHandle.getFileHandle(name, { create });
};

const getLocalDirHandle = async (dirHandle: any, name: string, create = false) => {
    return await dirHandle.getDirectoryHandle(name, { create });
};

const readLocalFile = async (dirHandle: any, name: string): Promise<string | null> => {
    try {
        const fileHandle = await getLocalFileHandle(dirHandle, name);
        const file = await fileHandle.getFile();
        return await file.text();
    } catch {
        return null;
    }
};

const writeLocalFile = async (dirHandle: any, name: string, content: string) => {
    const fileHandle = await getLocalFileHandle(dirHandle, name, true);
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
};

const deleteLocalFile = async (dirHandle: any, name: string) => {
    try {
        await dirHandle.removeEntry(name);
    } catch (e) { /* ignore */ }
};

// --- Main Service Functions ---

// Robust directory creation helper
const ensureDir = async (path: string) => {
    try {
        // Try creating with recursive option
        await puter.fs.mkdir(path, { recursive: true });
    } catch (e: any) {
        // Ignore if directory already exists
        if (e?.code === 'entry_already_exists' || e?.code === 'EEXIST') return;
        
        // If recursive failed, try simple mkdir just in case (sometimes helps with top-level)
        try { await puter.fs.mkdir(path); } catch (e2) { /* ignore */ }
    }
};

export const initializeStorage = async (context: StorageContext): Promise<boolean> => {
    if (context.mode === 'local') {
        try {
            if (!context.handle) return false;
            
            // Try to create/access the 'claude chats' subdirectory
            let chatDirHandle;
            try {
                chatDirHandle = await context.handle.getDirectoryHandle('claude chats', { create: true });
            } catch (e) {
                console.error("Could not create 'claude chats' folder", e);
                return false;
            }

            // Verify read/write by checking index.json
            const indexContent = await readLocalFile(chatDirHandle, 'index.json');
            if (!indexContent) {
                await writeLocalFile(chatDirHandle, 'index.json', JSON.stringify([]));
            }
            
            return true;
        } catch (error) {
            console.error('Failed to initialize local storage:', error);
            return false;
        }
    } 
    
    // Puter Mode
    else {
        const path = context.path?.replace(/\/$/, '') || '~/puter-claude-memory';
        try {
            const runFS = async <T>(op: () => Promise<T>): Promise<T> => {
                try { return await op(); } 
                catch (err: any) {
                    if (err?.status === 401 || err?.message?.toLowerCase().includes('unauthorized')) {
                        await puter.auth.signIn();
                        return await op();
                    }
                    throw err;
                }
            };

            await runFS(() => ensureDir(path));
            await runFS(() => ensureDir(`${path}/uploads`));
            
            // Ensure index
            const indexPath = `${path}/index.json`;
            try {
                await runFS(() => puter.fs.read(indexPath));
            } catch {
                await runFS(() => puter.fs.write(indexPath, JSON.stringify([])));
            }

            return true;
        } catch (error) {
            console.error('Failed to initialize Puter storage:', error);
            return false;
        }
    }
};

// Helper to get the working directory handle or path
const getWorkingContext = async (context: StorageContext) => {
    if (context.mode === 'local') {
        return await context.handle.getDirectoryHandle('claude chats', { create: true });
    }
    return context.path?.replace(/\/$/, '');
};

export const uploadFile = async (context: StorageContext, file: File): Promise<Attachment | null> => {
    // NOTE: Even in Local mode, we MUST upload the file to Puter Cloud 
    // because the puter.ai.chat API requires a `puter_path` to access the file.
    // The AI runs in the cloud and cannot read your local disk directly.
    
    try {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        
        // We use a temporary upload folder in Puter for the AI access
        // Ensure this directory exists before writing
        const uploadDir = '~/puter_claude_temp_uploads';
        await ensureDir(uploadDir);
        
        const filePath = `${uploadDir}/${timestamp}_${safeName}`;
        const writtenFile = await puter.fs.write(filePath, file);
        
        return {
            name: file.name,
            type: file.type,
            puterPath: writtenFile?.path || filePath,
            size: file.size
        };
    } catch (error) {
        console.error("Upload failed", error);
        return null;
    }
};

export const loadSettings = async (context: StorageContext): Promise<AppSettings> => {
    try {
        if (context.mode === 'local') {
            const dir = await getWorkingContext(context);
            const content = await readLocalFile(dir, 'settings.json');
            return content ? { ...DEFAULT_SETTINGS, ...JSON.parse(content) } : DEFAULT_SETTINGS;
        } else {
            const path = `${await getWorkingContext(context)}/settings.json`;
            try {
                const blob = await puter.fs.read(path);
                const text = blob instanceof Blob ? await blob.text() : String(blob);
                return { ...DEFAULT_SETTINGS, ...JSON.parse(text) };
            } catch { return DEFAULT_SETTINGS; }
        }
    } catch { return DEFAULT_SETTINGS; }
};

export const saveSettings = async (context: StorageContext, settings: AppSettings): Promise<void> => {
    try {
        if (context.mode === 'local') {
            const dir = await getWorkingContext(context);
            await writeLocalFile(dir, 'settings.json', JSON.stringify(settings));
        } else {
            const path = `${await getWorkingContext(context)}/settings.json`;
            await puter.fs.write(path, JSON.stringify(settings));
        }
    } catch (e) { console.error("Failed to save settings", e); }
};

export const loadChatList = async (context: StorageContext): Promise<ChatSession[]> => {
    try {
        let content;
        if (context.mode === 'local') {
            const dir = await getWorkingContext(context);
            content = await readLocalFile(dir, 'index.json');
        } else {
            const path = `${await getWorkingContext(context)}/index.json`;
            const blob = await puter.fs.read(path);
            content = blob instanceof Blob ? await blob.text() : String(blob);
        }
        return content ? JSON.parse(content) : [];
    } catch { return []; }
};

export const saveChatSession = async (context: StorageContext, session: ChatSession): Promise<void> => {
    try {
        const list = await loadChatList(context);
        const existingIndex = list.findIndex((c) => c.id === session.id);
        
        const metadata: ChatSession = {
            id: session.id,
            title: session.title,
            updatedAt: session.updatedAt,
            messages: [] // Don't store messages in index
        };

        if (existingIndex >= 0) list[existingIndex] = metadata;
        else list.unshift(metadata);

        if (context.mode === 'local') {
            const dir = await getWorkingContext(context);
            await writeLocalFile(dir, `${session.id}.json`, JSON.stringify(session));
            await writeLocalFile(dir, 'index.json', JSON.stringify(list));
        } else {
            const basePath = await getWorkingContext(context);
            await puter.fs.write(`${basePath}/${session.id}.json`, JSON.stringify(session));
            await puter.fs.write(`${basePath}/index.json`, JSON.stringify(list));
        }
    } catch (error) {
        console.error('Error saving session:', error);
        throw error;
    }
};

export const loadChatSession = async (context: StorageContext, sessionId: string): Promise<ChatSession | null> => {
    try {
        let content;
        if (context.mode === 'local') {
            const dir = await getWorkingContext(context);
            content = await readLocalFile(dir, `${sessionId}.json`);
        } else {
            const path = `${await getWorkingContext(context)}/${sessionId}.json`;
            const blob = await puter.fs.read(path);
            content = blob instanceof Blob ? await blob.text() : String(blob);
        }
        return content ? JSON.parse(content) : null;
    } catch { return null; }
};

export const deleteChatSession = async (context: StorageContext, sessionId: string): Promise<void> => {
    try {
        const list = await loadChatList(context);
        const newList = list.filter(c => c.id !== sessionId);
        
        if (context.mode === 'local') {
            const dir = await getWorkingContext(context);
            await deleteLocalFile(dir, `${sessionId}.json`);
            await writeLocalFile(dir, 'index.json', JSON.stringify(newList));
        } else {
            const basePath = await getWorkingContext(context);
            await puter.fs.delete(`${basePath}/${sessionId}.json`);
            await puter.fs.write(`${basePath}/index.json`, JSON.stringify(newList));
        }
    } catch (e) { console.error("Error deleting", e); }
}

// --- AI Logic & Advanced Memory ---

export const updateMemoryAnchor = async (currentAnchor: string | undefined, newMessages: Message[]): Promise<string> => {
    try {
        // Advanced Context Distillation Prompt
        const recentContext = newMessages.slice(-2);
        const recentText = recentContext.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

        const prompt = `
        You are the Cortex of an advanced AI system.
        Your goal is to maintain a "Dynamic Context Anchor" that serves as the long-term memory for a conversation.

        INPUTS:
        1. Current Anchor: "${currentAnchor || "None initialized."}"
        2. New Interaction:
        ${recentText}

        TASK:
        Analyze the conversation flow and distill the context.

        STRATEGY:
        - **Goal Tracking**: What is the user trying to achieve globally?
        - **Knowledge Graph**: Extract key facts, preferences, specific file contents referenced, or technical constraints.
        - **Progress**: Where are we in the problem-solving process?
        - **Pruning**: Remove obsolete details (e.g., old errors that are fixed).

        OUTPUT:
        Produce a concise, dense textual summary (max 150 words) that describes the *current state of the mission*, the *active constraints*, and *key learnings*. Do not simply recount history; synthesize it.
        `;

        const response = await puter.ai.chat(prompt, { model: 'claude-haiku-4-5' });
        return response?.message?.content?.[0]?.text || currentAnchor || "";
    } catch (e) {
        console.warn("Memory update failed", e);
        return currentAnchor || "";
    }
}

export const streamChatResponse = async function* (
  messages: Message[],
  modelId: string,
  systemPrompt?: string,
  memoryAnchor?: string
): AsyncGenerator<string, void, unknown> {
  
  let effectiveSystem = systemPrompt || "";
  if (memoryAnchor) {
      effectiveSystem += `\n\n=== PERSISTENT CONTEXT ANCHOR ===\n${memoryAnchor}\n=================================`;
  }

  const formattedMessages = messages.map(m => {
    if (m.attachments && m.attachments.length > 0) {
        const contentParts: any[] = [];
        m.attachments.forEach(att => contentParts.push({ type: 'file', puter_path: att.puterPath }));
        contentParts.push({ type: 'text', text: m.content });
        return { role: m.role, content: contentParts };
    } else {
        return { role: m.role, content: m.content };
    }
  });

  const response = await puter.ai.chat(formattedMessages, {
      model: modelId,
      stream: true,
      system: effectiveSystem.trim() !== "" ? effectiveSystem : undefined
  });

  for await (const part of response) {
      if (part?.text) yield part.text;
  }
};

export const generateTitle = async (firstMessage: string): Promise<string> => {
    try {
        const response = await puter.ai.chat(`Summarize this message into a short 3-5 word title. No quotes. Message: "${firstMessage}"`, {
            model: 'claude-haiku-4-5' 
        });
        return response?.message?.content?.[0]?.text || "New Chat";
    } catch { return "New Chat"; }
}

export const getUserInfo = async () => {
    try {
        if (puter.auth.isSignedIn()) return await puter.auth.getUser();
        return null;
    } catch { return null; }
}