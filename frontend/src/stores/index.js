import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: localStorage.getItem('username') || null,
  isAuthenticated: !!localStorage.getItem('access_token'),

  login: (username, access, refresh) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('username', username);
    set({ user: username, isAuthenticated: true });
  },

  logout: () => {
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));

export const useProblemStore = create((set, get) => ({
  problems: [],
  currentProblem: null,
  loading: false,
  error: null,

  setProblems: (problems) => set({ problems }),
  setCurrentProblem: (p) => set({ currentProblem: p }),
  setLoading: (v) => set({ loading: v }),
  setError: (e) => set({ error: e }),

  addProblem: (p) => set((s) => ({ problems: [p, ...s.problems] })),

  updateProblem: (id, updates) => set((s) => ({
    problems: s.problems.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    currentProblem: s.currentProblem?.id === id ? { ...s.currentProblem, ...updates } : s.currentProblem,
  })),

  removeProblem: (id) => set((s) => ({
    problems: s.problems.filter((p) => p.id !== id),
    currentProblem: s.currentProblem?.id === id ? null : s.currentProblem,
  })),
}));
