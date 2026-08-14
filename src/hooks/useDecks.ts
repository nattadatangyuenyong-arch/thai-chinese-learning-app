import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import { VocabularyDeck, VocabularyItem, LearningStatus } from "../types";
import { storageService } from "../services/storageService";
import { buildDemoDeck } from "../data/demoDeck";
import { useAuth } from "../context/AuthContext";
import { cloudDeckService } from "../services/cloudDeckService";

function initialLocalDecks(): VocabularyDeck[] {
  const loaded = storageService.loadDecks("guest");
  if (loaded.length) return loaded;
  const demo = buildDemoDeck();
  storageService.saveDecks([demo], "guest");
  return [demo];
}

export function useDecks() {
  const { user, loading: authLoading } = useAuth();
  const [decks, setDecks] = useState<VocabularyDeck[]>(initialLocalDecks);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const initializedUserRef = useRef<string | null | undefined>(undefined);
  const skipNextSyncRef = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    const userKey = user?.id ?? null;
    if (initializedUserRef.current === userKey) return;
    initializedUserRef.current = userKey;

    if (!user) {
      setDecks(initialLocalDecks());
      setReady(true);
      setSyncError(null);
      return;
    }

    let cancelled = false;
    setReady(false);
    setSyncing(true);
    setSyncError(null);
    void (async () => {
      try {
        let cloudDecks = await cloudDeckService.loadDecks();
        if (cloudDecks.length === 0) {
          const localDecks = storageService.loadDecks("guest");
          if (localDecks.length) {
            await Promise.all(localDecks.map((deck) => cloudDeckService.replaceDeckItems(deck, user.id)));
            cloudDecks = localDecks;
          }
        }
        if (!cancelled) {
          skipNextSyncRef.current = true;
          setDecks(cloudDecks);
        }
      } catch (error) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : "Cloud sync failed");
          setDecks(storageService.loadDecks(`user-${user.id}`));
        }
      } finally {
        if (!cancelled) {
          setSyncing(false);
          setReady(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (!ready) return;
    storageService.saveDecks(decks, user ? `user-${user.id}` : "guest");
    if (!user) return;
    if (skipNextSyncRef.current) {
      skipNextSyncRef.current = false;
      return;
    }
    const timer = window.setTimeout(async () => {
      setSyncing(true);
      setSyncError(null);
      try {
        await Promise.all(decks.map((deck) => cloudDeckService.replaceDeckItems(deck, user.id)));
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : "Cloud sync failed");
      } finally {
        setSyncing(false);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [decks, user?.id, ready]);

  const getDeck = useCallback((deckId: string) => decks.find((d) => d.id === deckId), [decks]);

  const createDeck = useCallback((name: string, items: VocabularyItem[] = []): VocabularyDeck => {
    const now = new Date().toISOString();
    const newDeck: VocabularyDeck = { id: uuid(), name, createdAt: now, updatedAt: now, items };
    setDecks((prev) => [newDeck, ...prev]);
    return newDeck;
  }, []);

  const renameDeck = useCallback((deckId: string, name: string) => {
    setDecks((prev) => prev.map((d) => d.id === deckId ? { ...d, name, updatedAt: new Date().toISOString() } : d));
  }, []);

  const deleteDeck = useCallback((deckId: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    if (user) void cloudDeckService.deleteDeck(deckId).catch((error) => setSyncError(error.message));
  }, [user]);

  const importDeck = useCallback((deck: VocabularyDeck) => setDecks((prev) => [deck, ...prev]), []);

  const addItemsToDeck = useCallback((deckId: string, items: VocabularyItem[]) => {
    setDecks((prev) => prev.map((d) => d.id === deckId
      ? { ...d, items: [...d.items, ...items], updatedAt: new Date().toISOString() }
      : d));
  }, []);

  const updateItem = useCallback((deckId: string, item: VocabularyItem) => {
    setDecks((prev) => prev.map((d) => d.id === deckId ? {
      ...d,
      items: d.items.map((i) => i.id === item.id ? { ...item, updatedAt: new Date().toISOString() } : i),
      updatedAt: new Date().toISOString(),
    } : d));
  }, []);

  const deleteItem = useCallback((deckId: string, itemId: string) => {
    setDecks((prev) => prev.map((d) => d.id === deckId
      ? { ...d, items: d.items.filter((i) => i.id !== itemId), updatedAt: new Date().toISOString() }
      : d));
  }, []);

  const setItemStatus = useCallback((deckId: string, itemId: string, status: LearningStatus) => {
    setDecks((prev) => prev.map((d) => d.id === deckId ? {
      ...d,
      items: d.items.map((i) => i.id === itemId ? { ...i, learningStatus: status, updatedAt: new Date().toISOString() } : i),
      updatedAt: new Date().toISOString(),
    } : d));
  }, []);

  const resetKnownItems = useCallback((deckId: string) => {
    const now = new Date().toISOString();
    setDecks((prev) => prev.map((d) => d.id === deckId ? {
      ...d,
      items: d.items.map((i) => i.learningStatus === "known"
        ? { ...i, learningStatus: "new" as LearningStatus, updatedAt: now }
        : i),
      updatedAt: now,
    } : d));
  }, []);

  const retrySync = useCallback(async () => {
    if (!user) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await Promise.all(decks.map((deck) => cloudDeckService.replaceDeckItems(deck, user.id)));
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Cloud sync failed");
    } finally {
      setSyncing(false);
    }
  }, [decks, user]);

  return {
    decks, getDeck, createDeck, renameDeck, deleteDeck, importDeck, addItemsToDeck,
    updateItem, deleteItem, setItemStatus, resetKnownItems, syncing, syncError, ready, retrySync,
    storageMode: user ? "cloud" as const : "local" as const,
  };
}
