import { VocabularyDeck, VocabularyItem } from "../types";
import { supabaseClient } from "./supabaseClient";

type DeckRow = { id: string; user_id: string; name: string; created_at: string; updated_at: string };
type ItemRow = {
  id: string; user_id: string; deck_id: string; chinese: string; pinyin: string;
  thai_translation: string; example_sentence: string | null; example_sentence_pinyin: string | null;
  example_sentence_thai: string | null; learning_status: "new" | "learning" | "known";
  created_at: string; updated_at: string;
};

function itemFromRow(row: ItemRow): VocabularyItem {
  return {
    id: row.id,
    chinese: row.chinese,
    pinyin: row.pinyin,
    thaiTranslation: row.thai_translation,
    exampleSentence: row.example_sentence || undefined,
    exampleSentencePinyin: row.example_sentence_pinyin || undefined,
    exampleSentenceThai: row.example_sentence_thai || undefined,
    learningStatus: row.learning_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const cloudDeckService = {
  async loadDecks(): Promise<VocabularyDeck[]> {
    const decks = await supabaseClient.rest<DeckRow[]>("decks?select=*&order=updated_at.desc");
    const items = await supabaseClient.rest<ItemRow[]>("vocabulary_items?select=*&order=created_at.asc");
    return decks.map((deck) => ({
      id: deck.id,
      name: deck.name,
      createdAt: deck.created_at,
      updatedAt: deck.updated_at,
      items: items.filter((item) => item.deck_id === deck.id).map(itemFromRow),
    }));
  },

  async saveDeck(deck: VocabularyDeck, userId: string): Promise<void> {
    await supabaseClient.rest("decks?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        id: deck.id,
        user_id: userId,
        name: deck.name,
        created_at: deck.createdAt,
        updated_at: deck.updatedAt,
      }),
    });
    if (deck.items.length) {
      await supabaseClient.rest("vocabulary_items?on_conflict=id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify(deck.items.map((item, index) => ({
          id: item.id,
          user_id: userId,
          deck_id: deck.id,
          chinese: item.chinese,
          pinyin: item.pinyin,
          thai_translation: item.thaiTranslation,
          example_sentence: item.exampleSentence || null,
          example_sentence_pinyin: item.exampleSentencePinyin || null,
          example_sentence_thai: item.exampleSentenceThai || null,
          learning_status: item.learningStatus,
          sort_order: index,
          created_at: item.createdAt,
          updated_at: item.updatedAt,
        }))),
      });
    }
  },

  async replaceDeckItems(deck: VocabularyDeck, userId: string): Promise<void> {
    await this.saveDeck(deck, userId);
    const ids = deck.items.map((item) => item.id);
    const filter = ids.length ? `&id=not.in.(${ids.join(",")})` : "";
    await supabaseClient.rest(`vocabulary_items?deck_id=eq.${deck.id}${filter}`, { method: "DELETE" });
  },

  async deleteDeck(deckId: string): Promise<void> {
    await supabaseClient.rest(`decks?id=eq.${deckId}`, { method: "DELETE" });
  },
};
