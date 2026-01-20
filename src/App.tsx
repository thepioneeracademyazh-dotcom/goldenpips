import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InstallPWA } from "@/components/InstallPWA";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Signals from "./pages/Signals";
import Subscription from "./pages/Subscription";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Help from "./pages/Help";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <InstallPWA />
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/help" element={<Help />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/signals" element={
              <ProtectedRoute><Signals /></ProtectedRoute>
            } />
            <Route path="/subscription" element={
              <ProtectedRoute><Subscription /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAdmin><Admin /></ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
