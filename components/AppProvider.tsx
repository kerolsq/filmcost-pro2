"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction
} from "react";
import { demoState } from "@/lib/demo-data";
import { mergeAppState } from "@/lib/app-state";
import { directionFor, translate, type TranslationKey } from "@/lib/i18n";
import type { AppState, Language } from "@/types/domain";

const STORAGE_KEY = "filmcost-pro-state-v1";
const LANGUAGE_STORAGE_KEY = "filmcost-pro-language";

interface AppContextValue {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  ready: boolean;
  setLanguage: (language: Language) => void;
  resetDemo: () => void;
  t: (key: TranslationKey) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

function getSavedLanguage(): Language | null {
  const language = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return language === "en" || language === "ar" ? language : null;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(demoState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const savedLanguage = getSavedLanguage();
      if (raw) {
        const savedState = mergeAppState(JSON.parse(raw) as Partial<AppState>);
        setState(savedLanguage ? { ...savedState, language: savedLanguage } : savedState);
      } else if (savedLanguage) {
        setState((current) => ({ ...current, language: savedLanguage }));
      }
    } catch {
      setState(demoState);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = state.language;
    document.documentElement.dir = directionFor(state.language);
  }, [ready, state.language]);

  useEffect(() => {
    if (ready) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, state.language);
    }
  }, [ready, state]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      setState,
      ready,
      setLanguage: (language) => {
        window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        setState((current) => ({ ...current, language }));
      },
      resetDemo: () => setState(demoState),
      t: (key) => translate(state.language, key)
    }),
    [ready, state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useApp must be used inside AppProvider");
  }
  return value;
}
