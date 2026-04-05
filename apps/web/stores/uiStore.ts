import { create } from 'zustand';

interface UIState {
  selectedVillagerId: string | null;
  showDebug: boolean;
  showChat: boolean;
  cameraX: number;
  cameraY: number;
  zoom: number;

  selectVillager: (id: string | null) => void;
  toggleDebug: () => void;
  toggleChat: () => void;
  setCamera: (x: number, y: number) => void;
  setZoom: (zoom: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedVillagerId: null,
  showDebug: false,
  showChat: false,
  cameraX: 0,
  cameraY: 0,
  zoom: 1,

  selectVillager: (id) => set({ selectedVillagerId: id, showChat: id !== null }),
  toggleDebug: () => set((s) => ({ showDebug: !s.showDebug })),
  toggleChat: () => set((s) => ({ showChat: !s.showChat })),
  setCamera: (x, y) => set({ cameraX: x, cameraY: y }),
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),
}));
