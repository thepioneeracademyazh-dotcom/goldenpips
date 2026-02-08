import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InstallPWA } from "@/components/InstallPWA";
import { BlockedScreen } from "@/components/BlockedScreen";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Signals from "./pages/Signals";
import Subscription from "./pages/Subscription";
import PaymentHistory from "./pages/PaymentHistory";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import Help from "./pages/Help";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show blocked screen if user is blocked
  if (user?.isBlocked) {
    return <BlockedScreen />;
  }

  return (
    <>
      <InstallPWA />
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/signals" element={
            <ProtectedRoute><Signals /></ProtectedRoute>
          } />
          <Route path="/subscription" element={
            <ProtectedRoute><Subscription /></ProtectedRoute>
          } />
          <Route path="/payments" element={
            <ProtectedRoute><PaymentHistory /></ProtectedRoute>
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
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
