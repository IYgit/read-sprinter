import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NumbersExercise from "./components/exercises/NumbersExercise";
import WordPairsExercise from "./components/exercises/WordPairsExercise";
import WordSearchExercise from "./components/exercises/WordSearchExercise";
import DuelExercise from "./pages/DuelExercise";
import RsvpExercise from "./components/exercises/RsvpExercise";
import SyntagmReadingExercise from "./components/exercises/SyntagmReadingExercise";
import SchulteTableExercise from "./components/exercises/SchulteTableExercise";
import LetterSearchExercise from "./components/exercises/LetterSearchExercise";
import AuthPage from "./pages/AuthPage";
import { getCurrentUser } from "./lib/auth";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/exercises/numbers" element={<ProtectedRoute><NumbersExercise /></ProtectedRoute>} />
          <Route path="/exercises/word-pairs" element={<ProtectedRoute><WordPairsExercise /></ProtectedRoute>} />
          <Route path="/exercises/word-search" element={<ProtectedRoute><WordSearchExercise /></ProtectedRoute>} />
          <Route path="/exercises/duel" element={<ProtectedRoute><DuelExercise /></ProtectedRoute>} />
          <Route path="/exercises/rsvp" element={<ProtectedRoute><RsvpExercise /></ProtectedRoute>} />
          <Route path="/exercises/syntagm-reading" element={<ProtectedRoute><SyntagmReadingExercise /></ProtectedRoute>} />
          <Route path="/exercises/schulte-table" element={<ProtectedRoute><SchulteTableExercise /></ProtectedRoute>} />
          <Route path="/exercises/letter-search" element={<ProtectedRoute><LetterSearchExercise /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
