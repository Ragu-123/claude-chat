export interface Attachment {
  name: string;
  type: string;
  puterPath: string;
  size: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  id: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
  memoryAnchor?: string; // Persistent Context Memory
}

export interface AppSettings {
  systemPrompt: string;
  defaultModel: string;
}

export interface PuterAIStreamPart {
  text?: string;
  done?: boolean;
}

export type StorageMode = 'local' | 'puter';

export interface StorageContext {
    mode: StorageMode;
    path?: string; // For Puter mode
    handle?: any;  // FileSystemDirectoryHandle for Local mode
}

// Puter Type Definitions (Partial)
export interface PuterFile {
  name: string;
  path: string;
}

export interface PuterFS {
  write(path: string, content: string | Blob | File, options?: any): Promise<PuterFile>;
  read(path: string): Promise<string | Blob>;
  delete(path: string): Promise<void>;
  mkdir(path: string, options?: { recursive?: boolean; [key: string]: any }): Promise<void>;
  readdir(path: string): Promise<PuterFile[]>;
  stat?(path: string): Promise<any>; 
}

export interface PuterAuth {
  signIn(): Promise<void>;
  signOut(): Promise<void>;
  isSignedIn(): boolean;
  getUser(): Promise<{ username: string; [key: string]: any }>;
}

export interface PuterAIChatOptions {
  model?: string;
  stream?: boolean;
  system?: string;
}

export interface PuterAI {
  chat(
    messages: string | any[],
    options?: PuterAIChatOptions
  ): Promise<any>;
}

export interface Puter {
  fs: PuterFS;
  ai: PuterAI;
  auth: PuterAuth;
  print: (msg: any) => void;
}

declare global {
  interface Window {
    puter: Puter;
  }
  const puter: Puter;
}