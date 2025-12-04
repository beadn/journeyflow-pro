import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import LandingPage from "./pages/LandingPage";
import WorkflowsPage from "./pages/WorkflowsPage";
import BuilderPage from "./pages/BuilderPage";
import MonitorPage from "./pages/MonitorPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/workflows" element={<WorkflowsPage />} />
            <Route path="/builder" element={<Navigate to="/workflows" replace />} />
            <Route path="/builder/:journeyId" element={<BuilderPage />} />
            <Route path="/monitor" element={<Navigate to="/workflows" replace />} />
            <Route path="/monitor/:journeyId" element={<MonitorPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
