import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations, TranslationKey, Idioma } from "../i18n/translations";
import { useAuth } from "./AuthContext";
import { setMeuIdioma } from "../services/usuaris";

const STORAGE_KEY = "idioma_preferit";

interface LanguageContextType {
  idioma: Idioma;
  canviarIdioma: (nou: Idioma) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [idioma, setIdioma] = useState<Idioma>("CA");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((desat) => {
      if (desat && desat in translations) setIdioma(desat as Idioma);
    });
  }, []);

  useEffect(() => {
    if (user?.idioma && user.idioma in translations) {
      setIdioma(user.idioma as Idioma);
      AsyncStorage.setItem(STORAGE_KEY, user.idioma);
    }
  }, [user?.idioma]);

  const canviarIdioma = useCallback(
    (nou: Idioma) => {
      setIdioma(nou);
      AsyncStorage.setItem(STORAGE_KEY, nou);
      if (isAuthenticated) {
        setMeuIdioma(nou).catch(() => {});
      }
    },
    [isAuthenticated]
  );

  const t = useCallback(
    (key: TranslationKey) => translations[idioma][key] ?? translations.CA[key] ?? key,
    [idioma]
  );

  return (
    <LanguageContext.Provider value={{ idioma, canviarIdioma, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
