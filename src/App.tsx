import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { TierProvider } from "@/contexts/TierContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DevTierSwitcher from "@/components/dev/DevTierSwitcher";
import DashboardLayout from "@/layouts/DashboardLayout";
import Auth from "./pages/Auth";
import Landing from "./pages/Landing";
import Simulator from "./pages/Simulator";
import Dashboard from "./pages/Dashboard";
import Strategies from "./pages/Strategies";
import StrategyDetailPage from "./pages/StrategyDetailPage";
import Backtesting from "./pages/Backtesting";
import Resources from "./pages/Resources";
import Learning from "./pages/Learning";
import Coaching from "./pages/Coaching";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import FoundationLearning from "./pages/learning/Foundation";
import GuruApplyPage from "./pages/guru/GuruApplyPage";
import GuruDashboardPage from "./pages/guru/GuruDashboardPage";
import GuruCohortsPage from "./pages/guru/GuruCohortsPage";
import GuruCohortFormPage from "./pages/guru/GuruCohortFormPage";
import GuruStudentsPage from "./pages/guru/GuruStudentsPage";
import GuruStudentDetailPage from "./pages/guru/GuruStudentDetailPage";
import FoundationF1 from "./pages/learning/FoundationF1";
import Tier1Learning from "./pages/learning/Tier1";
import Tier2Learning from "./pages/learning/Tier2";
import Tier3Learning from "./pages/learning/Tier3";
import ModulePlaceholder from "./pages/learning/ModulePlaceholder";
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
              <Route path="/simulator" element={<ProtectedRoute><TierProvider><><Simulator /><DevTierSwitcher /></></TierProvider></ProtectedRoute>} />
              <Route path="/dashboard" element={<LayoutRoute><Dashboard /></LayoutRoute>} />
              <Route path="/strategies" element={<LayoutRoute><Strategies /></LayoutRoute>} />
              <Route path="/strategies/:id" element={<LayoutRoute><StrategyDetailPage /></LayoutRoute>} />
              <Route path="/backtesting" element={<LayoutRoute><Backtesting /></LayoutRoute>} />
              <Route path="/resources" element={<LayoutRoute><Resources /></LayoutRoute>} />
              <Route path="/learning" element={<LayoutRoute><Learning /></LayoutRoute>} />
              <Route path="/learning/foundation" element={<LayoutRoute><FoundationLearning /></LayoutRoute>} />
              <Route path="/learning/foundation/f1" element={<LayoutRoute><FoundationF1 /></LayoutRoute>} />
              <Route path="/learning/tier1" element={<LayoutRoute><Tier1Learning /></LayoutRoute>} />
              <Route path="/learning/tier1/:moduleId" element={<LayoutRoute><ModulePlaceholder /></LayoutRoute>} />
              <Route path="/learning/tier2" element={<LayoutRoute><Tier2Learning /></LayoutRoute>} />
              <Route path="/learning/tier2/:moduleId" element={<LayoutRoute><ModulePlaceholder /></LayoutRoute>} />
              <Route path="/learning/tier3" element={<LayoutRoute><Tier3Learning /></LayoutRoute>} />
              <Route path="/learning/tier3/:moduleId" element={<LayoutRoute><ModulePlaceholder /></LayoutRoute>} />
              <Route path="/coaching" element={<LayoutRoute><Coaching /></LayoutRoute>} />
              <Route path="/analytics" element={<LayoutRoute><Analytics /></LayoutRoute>} />
              <Route path="/profile" element={<LayoutRoute><Profile /></LayoutRoute>} />
              <Route path="/settings" element={<LayoutRoute><Settings /></LayoutRoute>} />
              <Route path="/guru/apply" element={<ProtectedRoute><GuruApplyPage /></ProtectedRoute>} />
              <Route path="/guru" element={<ProtectedRoute><GuruDashboardPage /></ProtectedRoute>} />
              <Route path="/guru/cohorts/new" element={<ProtectedRoute><GuruCohortFormPage /></ProtectedRoute>} />
              <Route path="/guru/cohorts/:id" element={<ProtectedRoute><GuruCohortFormPage /></ProtectedRoute>} />
              <Route path="/guru/cohorts" element={<ProtectedRoute><GuruCohortsPage /></ProtectedRoute>} />
              <Route path="/guru/students/:studentId" element={<ProtectedRoute><GuruStudentDetailPage /></ProtectedRoute>} />
              <Route path="/guru/students" element={<ProtectedRoute><GuruStudentsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
