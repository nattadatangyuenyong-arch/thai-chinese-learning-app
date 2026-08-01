import React, { createContext, useContext } from "react";
import { useDecks } from "../hooks/useDecks";

type DecksContextValue = ReturnType<typeof useDecks>;

const DecksContext = createContext<DecksContextValue | undefined>(undefined);

export function DecksProvider({ children }: { children: React.ReactNode }) {
  const value = useDecks();
  return <DecksContext.Provider value={value}>{children}</DecksContext.Provider>;
}

export function useDecksContext() {
  const ctx = useContext(DecksContext);
  if (!ctx) throw new Error("useDecksContext must be used within DecksProvider");
  return ctx;
}
