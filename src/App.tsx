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
import ClassesPage from "./pages/ClassesPage";
import Analytics from "./pages/Analytics";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import FoundationLearning from "./pages/learning/Foundation";
import GuruApplyPage from "./pages/guru/GuruApplyPage";
import GuruDashboardPage from "./pages/guru/GuruDashboardPage";
import GuruPublicProfilePage from "./pages/guru/GuruPublicProfilePage";
import GuruClassesPage from "./pages/guru/GuruClassesPage";
import GuruClassFormPage from "./pages/guru/GuruClassFormPage";
import GuruStudentsPage from "./pages/guru/GuruStudentsPage";
import GuruStudentDetailPage from "./pages/guru/GuruStudentDetailPage";
import GuruContentPage from "./pages/guru/GuruContentPage";
import GuruContentFormPage from "./pages/guru/GuruContentFormPage";
import GuruSessionsPage from "./pages/guru/GuruSessionsPage";
import GuruSessionFormPage from "./pages/guru/GuruSessionFormPage";
import GuruSessionLivePage from "./pages/guru/GuruSessionLivePage";
import GuruPayoutsPage from "./pages/guru/GuruPayoutsPage";
import ClassDetailPage from "./pages/ClassDetailPage";
import GurusDirectoryPage from "./pages/GurusDirectoryPage";
import GuruPublicProfileExternalPage from "./pages/GuruPublicProfilePage";
import ClassContentPage from "./pages/ClassContentPage";
import ClassSessionPage from "./pages/ClassSessionPage";
import EnrollmentSuccessPage from "./pages/EnrollmentSuccessPage";
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
              <Route path="/classes" element={<LayoutRoute><ClassesPage /></LayoutRoute>} />
              <Route path="/classes/:classId/content/:contentId" element={<LayoutRoute><ClassContentPage /></LayoutRoute>} />
              <Route path="/classes/:classId/session/:sessionId" element={<ProtectedRoute><ClassSessionPage /></ProtectedRoute>} />
              <Route path="/classes/:classId" element={<LayoutRoute><ClassDetailPage /></LayoutRoute>} />
              <Route path="/gurus" element={<LayoutRoute><GurusDirectoryPage /></LayoutRoute>} />
              <Route path="/gurus/:guruId" element={<LayoutRoute><GuruPublicProfileExternalPage /></LayoutRoute>} />
              <Route path="/checkout/success" element={<ProtectedRoute><EnrollmentSuccessPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<LayoutRoute><Analytics /></LayoutRoute>} />
              <Route path="/profile" element={<LayoutRoute><Profile /></LayoutRoute>} />
              <Route path="/settings" element={<LayoutRoute><Settings /></LayoutRoute>} />
              <Route path="/guru/apply" element={<ProtectedRoute><GuruApplyPage /></ProtectedRoute>} />
              <Route path="/guru" element={<ProtectedRoute><GuruDashboardPage /></ProtectedRoute>} />
              <Route path="/guru/profile" element={<ProtectedRoute><GuruPublicProfilePage /></ProtectedRoute>} />
              <Route path="/guru/classes/new" element={<ProtectedRoute><GuruClassFormPage /></ProtectedRoute>} />
              <Route path="/guru/classes/:id" element={<ProtectedRoute><GuruClassFormPage /></ProtectedRoute>} />
              <Route path="/guru/classes" element={<ProtectedRoute><GuruClassesPage /></ProtectedRoute>} />
              <Route path="/guru/students/:studentId" element={<ProtectedRoute><GuruStudentDetailPage /></ProtectedRoute>} />
              <Route path="/guru/students" element={<ProtectedRoute><GuruStudentsPage /></ProtectedRoute>} />
              <Route path="/guru/content/new" element={<ProtectedRoute><GuruContentFormPage /></ProtectedRoute>} />
              <Route path="/guru/content/:id" element={<ProtectedRoute><GuruContentFormPage /></ProtectedRoute>} />
              <Route path="/guru/content" element={<ProtectedRoute><GuruContentPage /></ProtectedRoute>} />
              <Route path="/guru/sessions/:id/live" element={<ProtectedRoute><GuruSessionLivePage /></ProtectedRoute>} />
              <Route path="/guru/sessions/new" element={<ProtectedRoute><GuruSessionFormPage /></ProtectedRoute>} />
              <Route path="/guru/sessions/:id" element={<ProtectedRoute><GuruSessionFormPage /></ProtectedRoute>} />
              <Route path="/guru/sessions" element={<ProtectedRoute><GuruSessionsPage /></ProtectedRoute>} />
              <Route path="/guru/payouts" element={<ProtectedRoute><GuruPayoutsPage /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
