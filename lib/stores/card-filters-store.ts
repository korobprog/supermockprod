import { create } from 'zustand';

interface CardFiltersState {
  selectedTech: string;
  selectedStatus: string;
  setSelectedTech: (tech: string) => void;
  setSelectedStatus: (status: string) => void;
  clearFilters: () => void;
}

export const useCardFiltersStore = create<CardFiltersState>((set) => ({
  selectedTech: '',
  selectedStatus: '',
  setSelectedTech: (tech: string) => set({ selectedTech: tech }),
  setSelectedStatus: (status: string) => set({ selectedStatus: status }),
  clearFilters: () => set({ selectedTech: '', selectedStatus: '' }),
}));

