import type { BeautyPlan, BeautyProduct, PlanHistory } from "@vanity/contracts/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { demoBeautyBag } from "../fixtures/demo";

const safeLocalStorage = {
  getItem: (name: string) => {
    const value = localStorage.getItem(name);
    if (!value) return null;
    try {
      JSON.parse(value);
      return value;
    } catch {
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name: string, value: string) => localStorage.setItem(name, value),
  removeItem: (name: string) => localStorage.removeItem(name),
};

type AppStore = {
  beautyBag: BeautyProduct[];
  planHistory: PlanHistory[];
  currentPlan?: BeautyPlan;
  loadDemoBag: () => void;
  addProduct: (product: BeautyProduct) => void;
  updateProduct: (id: string, patch: Partial<Pick<BeautyProduct, "userNotes" | "userExperience" | "shade" | "tags">>) => void;
  removeProduct: (id: string) => void;
  removeDemoProducts: () => void;
  setCurrentPlan: (plan: BeautyPlan) => void;
  saveCurrentPlan: (refinementSummary?: string) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      beautyBag: [],
      planHistory: [],
      currentPlan: undefined,
      loadDemoBag: () => set((state) => ({
        beautyBag: [...state.beautyBag.filter((item) => !item.isDemo), ...demoBeautyBag],
      })),
      addProduct: (product) => set((state) => ({
        beautyBag: state.beautyBag.some((item) => item.id === product.id)
          ? state.beautyBag
          : [product, ...state.beautyBag],
      })),
      updateProduct: (id, patch) => set((state) => ({
        beautyBag: state.beautyBag.map((product) => product.id === id
          ? { ...product, ...patch, updatedAt: new Date().toISOString() }
          : product),
      })),
      removeProduct: (id) => set((state) => ({
        beautyBag: state.beautyBag.filter((item) => item.id !== id),
      })),
      removeDemoProducts: () => set((state) => ({
        beautyBag: state.beautyBag.filter((item) => !item.isDemo),
      })),
      setCurrentPlan: (plan) => set({ currentPlan: plan }),
      saveCurrentPlan: (refinementSummary) => {
        const plan = get().currentPlan;
        if (!plan) return;
        const entry: PlanHistory = {
          id: `${plan.id}-${Date.now()}`,
          timestamp: new Date().toISOString(),
          contextSummary: plan.contextSummary,
          finalPlan: plan,
          refinementSummary,
        };
        set((state) => ({ planHistory: [entry, ...state.planHistory.filter((item) => item.finalPlan.id !== plan.id)].slice(0, 5) }));
      },
    }),
    {
      name: "vanity:app:v1",
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({ beautyBag: state.beautyBag, planHistory: state.planHistory }),
    },
  ),
);
