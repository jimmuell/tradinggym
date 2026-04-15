import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { TierProvider } from "@/contexts/TierContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Simulator from "./pages/Simulator";
import Dashboard from "./pages/Dashboard";
import Strategies from "./pages/Strategies";
import Backtesting from "./pages/Backtesting";
import Resources from "./pages/Resources";
import Learning from "./pages/Learning";
import Coaching from "./pages/Coaching";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function LayoutRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <TierProvider>
        <DashboardLayout>{children}</DashboardLayout>
      </TierProvider>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
              <Route path="/dashboard" element={<LayoutRoute><Dashboard /></LayoutRoute>} />
              <Route path="/strategies" element={<LayoutRoute><Strategies /></LayoutRoute>} />
              <Route path="/backtesting" element={<LayoutRoute><Backtesting /></LayoutRoute>} />
              <Route path="/resources" element={<LayoutRoute><Resources /></LayoutRoute>} />
              <Route path="/learning" element={<LayoutRoute><Learning /></LayoutRoute>} />
              <Route path="/coaching" element={<LayoutRoute><Coaching /></LayoutRoute>} />
              <Route path="/analytics" element={<LayoutRoute><Analytics /></LayoutRoute>} />
              <Route path="/profile" element={<LayoutRoute><Profile /></LayoutRoute>} />
              <Route path="/settings" element={<LayoutRoute><Settings /></LayoutRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
