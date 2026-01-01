import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CreativeWriting from "./pages/CreativeWriting";
import ProblemSolving from "./pages/ProblemSolving";
import Conversation from "./pages/Conversation";
import CodeHelp from "./pages/CodeHelp";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/settings" element={<Settings />} />
          
          <Route path="/creative-writing" element={<CreativeWriting />} />
          <Route path="/problem-solving" element={<ProblemSolving />} />
          <Route path="/conversation" element={<Conversation />} />
          <Route path="/code-help" element={<CodeHelp />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
