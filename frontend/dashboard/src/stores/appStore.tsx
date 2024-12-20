import { create } from "zustand";
import supabase from "../stores/supabaseClient"; // Import the singleton Supabase client
import { RealtimeChannel } from "@supabase/supabase-js";

interface ConversationData {
    riskyEvent_id: number;
    conversation_id: number;
    conversationTopics: string;
    conversationSummarization: string;
    riskType: string;
    riskLevel: string;
    riskyReason: string;
    timestamp: string;
    chatbotPlatform: string;
    chatbotDescription: string;
}


interface AppState {
  conversations: ConversationData[];
  setConversations: (conversations: ConversationData[]) => void;
  addConversations: (conversations: ConversationData[]) => void;
  showAlert: boolean;
  setShowAlert: (showAlert: boolean) => void;
  clearAlert: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  conversations: [],
  setConversations: (conversations: ConversationData[]) => set({ conversations }),
  addConversations: (conversations: ConversationData[]) => set((state) => ({ conversations: [...state.conversations, ...conversations] })),
  showAlert: false,
  setShowAlert: (showAlert: boolean) => set({ showAlert }),
  clearAlert: () => set({ showAlert: false }),
}));
