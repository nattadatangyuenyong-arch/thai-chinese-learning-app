import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./context/ToastContext";
import { DecksProvider } from "./context/DecksContext";
import { AuthProvider } from "./context/AuthContext";

import Home from "./screens/Home";
import ImageUpload from "./screens/ImageUpload";
import ExtractionResults from "./screens/ExtractionResults";
import ImportList from "./screens/ImportList";
import DeckLibrary from "./screens/DeckLibrary";
import FlashcardStudy from "./screens/FlashcardStudy";
import DeckEditor from "./screens/DeckEditor";
import AuthPage from "./screens/AuthPage";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <DecksProvider>
          <div className="min-h-screen bg-grain">
            <HashRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/upload" element={<ImageUpload />} />
                <Route path="/extraction" element={<ExtractionResults />} />
                <Route path="/import" element={<ImportList />} />
                <Route path="/decks" element={<DeckLibrary />} />
                <Route path="/decks/:deckId/study" element={<FlashcardStudy />} />
                <Route path="/decks/:deckId/edit" element={<DeckEditor />} />
                <Route path="/auth" element={<AuthPage />} />
              </Routes>
            </HashRouter>
          </div>
          </DecksProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
