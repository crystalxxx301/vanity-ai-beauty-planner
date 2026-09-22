import { create } from "zustand";
import type { FollowUp, ParsedContext } from "../services/aiClient";
import type { VisibleBeautyState, WeatherContext } from "@vanity/contracts/types";

type DraftState = {
  description: string;
  quickContexts: string[];
  photoName?: string;
  parsedContext?: ParsedContext;
  followUp?: FollowUp;
  followUpAnswer?: string;
  weather?: WeatherContext;
  visibleBeautyState?: VisibleBeautyState;
  outfit?: ParsedContext["outfit"];
  faceAnalysisSource?: "demo" | "photo";
  outfitAnalysisSource?: "demo" | "photo";
  demoMode: boolean;
  setDescription: (description: string) => void;
  toggleQuickContext: (context: string) => void;
  setPhotoName: (photoName?: string) => void;
  setParsedContext: (parsedContext: ParsedContext) => void;
  setFollowUp: (followUp: FollowUp) => void;
  setFollowUpAnswer: (followUpAnswer?: string) => void;
  setWeather: (weather?: WeatherContext) => void;
  setVisibleBeautyState: (visibleBeautyState?: VisibleBeautyState) => void;
  setOutfit: (outfit?: ParsedContext["outfit"]) => void;
  loadDemoScenario: () => void;
};

export const usePlanDraftStore = create<DraftState>((set) => ({
  description: "",
  quickContexts: [],
  demoMode: false,
  setDescription: (description) => set((state) => state.demoMode ? {
    description,
    demoMode: false,
    quickContexts: [],
    weather: undefined,
    visibleBeautyState: state.faceAnalysisSource === "photo" ? state.visibleBeautyState : undefined,
    outfit: state.outfitAnalysisSource === "photo" ? state.outfit : undefined,
    faceAnalysisSource: state.faceAnalysisSource === "photo" ? "photo" : undefined,
    outfitAnalysisSource: state.outfitAnalysisSource === "photo" ? "photo" : undefined,
    parsedContext: undefined,
    followUp: undefined,
    followUpAnswer: undefined,
  } : { description }),
  toggleQuickContext: (context) => set((state) => ({
    quickContexts: state.quickContexts.includes(context)
      ? state.quickContexts.filter((item) => item !== context)
      : [...state.quickContexts, context],
  })),
  setPhotoName: (photoName) => set({ photoName }),
  setParsedContext: (parsedContext) => set({ parsedContext }),
  setFollowUp: (followUp) => set({ followUp }),
  setFollowUpAnswer: (followUpAnswer) => set({ followUpAnswer }),
  setWeather: (weather) => set({ weather }),
  setVisibleBeautyState: (visibleBeautyState) => set({ visibleBeautyState, faceAnalysisSource: visibleBeautyState ? "photo" : undefined }),
  setOutfit: (outfit) => set({ outfit, outfitAnalysisSource: outfit ? "photo" : undefined }),
  loadDemoScenario: () => set({
    description: "今晚参加朋友的婚礼，只有 20 分钟。想精致一点但不要太浓，穿深绿色裙子。今天很热、湿度高，可能下雨，而且紫外线很强。",
    quickContexts: ["室内提案", "晚间聚会", "自然光"],
    weather: { temperature: 31, humidity: 82, rain: { probability: 55, expected: true }, uv: 8, source: "demo", interpretedConditions: ["hot", "humid", "rain_possible", "high_uv"] },
    visibleBeautyState: { redness: "mild", dryness: "none", oiliness: "mild", browsDefined: false, makeupAlreadyPresent: false, visibleIrritationOrWound: false },
    outfit: { description: "深绿色连衣裙", dominantColor: "深绿色", visibility: "clear" },
    faceAnalysisSource: "demo",
    outfitAnalysisSource: "demo",
    demoMode: true,
  }),
}));
