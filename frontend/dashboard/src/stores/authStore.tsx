import { create } from "zustand";
import supabase from "../stores/supabaseClient"; // Import the singleton Supabase client
import { SupabaseClient } from "@supabase/supabase-js";
interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  supabaseClient: SupabaseClient;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: localStorage.getItem("authToken"),
    isAuthenticated: !!localStorage.getItem("authToken"),
    supabaseClient: supabase, // Inject the singleton client here
    login: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw new Error(error.message);
      }
      if (data.session?.access_token) {
        const token = data.session.access_token;
        set({ token, isAuthenticated: true });
        localStorage.setItem("authToken", token);
      }
    },
    logout: async () => {
      await supabase.auth.signOut();
      set({ token: null, isAuthenticated: false });
      localStorage.removeItem("authToken");
    },
    register: async (email: string, password: string) => {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        throw new Error(error.message);
      }
    },
  }));
