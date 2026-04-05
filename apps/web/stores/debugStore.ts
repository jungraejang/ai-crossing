import { create } from 'zustand';

interface AILogEntry {
  id: string;
  type: string;
  villagerId: string;
  prompt: string;
  response: string;
  durationMs: number;
  timestamp: number;
}

interface DebugState {
  showPaths: boolean;
  showGoals: boolean;
  showRelationships: boolean;
  showMemories: boolean;
  aiLogs: AILogEntry[];

  togglePaths: () => void;
  toggleGoals: () => void;
  toggleRelationships: () => void;
  toggleMemories: () => void;
  addAILog: (entry: AILogEntry) => void;
  clearAILogs: () => void;
}

const MAX_AI_LOGS = 50;

export const useDebugStore = create<DebugState>((set) => ({
  showPaths: false,
  showGoals: true,
  showRelationships: false,
  showMemories: false,
  aiLogs: [],

  togglePaths: () => set((s) => ({ showPaths: !s.showPaths })),
  toggleGoals: () => set((s) => ({ showGoals: !s.showGoals })),
  toggleRelationships: () => set((s) => ({ showRelationships: !s.showRelationships })),
  toggleMemories: () => set((s) => ({ showMemories: !s.showMemories })),
  addAILog: (entry) =>
    set((s) => ({ aiLogs: [...s.aiLogs.slice(-MAX_AI_LOGS), entry] })),
  clearAILogs: () => set({ aiLogs: [] }),
}));
