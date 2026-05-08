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
import ResetPassword from "./pages/ResetPassword";
import Landing from "./pages/Landing";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import Simulator from "./pages/Simulator";
import Dashboard from "./pages/Dashboard";
import Strategies from "./pages/Strategies";
import StrategyDetailPage from "./pages/StrategyDetailPage";
import StrategyExtractPage from "./pages/StrategyExtractPage";
import Backtesting from "./pages/Backtesting";
import Resources from "./pages/Resources";
import Learning from "./pages/Learning";
import ClassesPage from "./pages/ClassesPage";
import CoachingPage from "./pages/CoachingPage";
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
import GuruLessonFormPage from "./pages/guru/GuruLessonFormPage";
import StudentLessonPage from "./pages/StudentLessonPage";
import ClassDetailPage from "./pages/ClassDetailPage";
import GurusDirectoryPage from "./pages/GurusDirectoryPage";
import GuruPublicProfileExternalPage from "./pages/GuruPublicProfilePage";
import ClassContentPage from "./pages/ClassContentPage";
import ClassSessionPage from "./pages/ClassSessionPage";
import EnrollmentSuccessPage from "./pages/EnrollmentSuccessPage";
import PricingPage from "./pages/PricingPage";
import FoundationF1 from "./pages/learning/FoundationF1";
import FoundationLessonPage from "./pages/learning/FoundationLesson";
import Tier1Learning from "./pages/learning/Tier1";
import Tier2Learning from "./pages/learning/Tier2";
import Tier3Learning from "./pages/learning/Tier3";
import TierLessonPage from "./pages/learning/TierLessonPage";
import NotFound from "./pages/NotFound";
import { ChecklistFab } from "@/components/checklist/ChecklistFab";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminGuruApplicationsPage from "./pages/admin/AdminGuruApplicationsPage";
import AdminInviteCodesPage from "./pages/admin/AdminInviteCodesPage";
import AdminConfigPage from "./pages/admin/AdminConfigPage";
import AdminContentPage from "./pages/admin/AdminContentPage";
import AdminCourseDetailPage from "./pages/admin/AdminCourseDetailPage";
import AdminCourseFormPage from "./pages/admin/AdminCourseFormPage";
import AdminLessonFormPage from "./pages/admin/AdminLessonFormPage";
import AdminQuizFormPage from "./pages/admin/AdminQuizFormPage";
import InvestorLayout from "./layouts/InvestorLayout";
import InvestorKpisPage from "./pages/investor/InvestorKpisPage";
import InvestorDataRoomPage from "./pages/investor/InvestorDataRoomPage";
import InvestorRoadmapPage from "./pages/investor/InvestorRoadmapPage";
import InvestorNotesPage from "./pages/investor/InvestorNotesPage";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

function LayoutRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardLayout>{children}</DashboardLayout>
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
            <TierProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/simulator" element={<ProtectedRoute><><Simulator /><DevTierSwitcher /></></ProtectedRoute>} />
              <Route path="/dashboard" element={<LayoutRoute><Dashboard /></LayoutRoute>} />
              <Route path="/strategies/extract" element={<LayoutRoute><StrategyExtractPage /></LayoutRoute>} />
              <Route path="/strategies/:id" element={<LayoutRoute><StrategyDetailPage /></LayoutRoute>} />
              <Route path="/strategies" element={<LayoutRoute><Strategies /></LayoutRoute>} />
              <Route path="/backtesting" element={<LayoutRoute><Backtesting /></LayoutRoute>} />
              <Route path="/resources" element={<LayoutRoute><Resources /></LayoutRoute>} />
              <Route path="/learning" element={<LayoutRoute><Learning /></LayoutRoute>} />
              <Route path="/learning/foundation" element={<LayoutRoute><FoundationLearning /></LayoutRoute>} />
              <Route path="/learning/foundation/f1" element={<LayoutRoute><FoundationF1 /></LayoutRoute>} />
              <Route path="/learning/foundation/:lessonId" element={<LayoutRoute><FoundationLessonPage /></LayoutRoute>} />
              <Route path="/learning/tier1" element={<LayoutRoute><Tier1Learning /></LayoutRoute>} />
              <Route path="/learning/tier1/:lessonId" element={<LayoutRoute><TierLessonPage tier="tier1" modulePrefix="tier1_" backPath="/learning/tier1" backLabel="Tier 1" /></LayoutRoute>} />
              <Route path="/learning/tier2" element={<LayoutRoute><Tier2Learning /></LayoutRoute>} />
              <Route path="/learning/tier2/:lessonId" element={<LayoutRoute><TierLessonPage tier="tier2" modulePrefix="tier2_" backPath="/learning/tier2" backLabel="Tier 2" /></LayoutRoute>} />
              <Route path="/learning/tier3" element={<LayoutRoute><Tier3Learning /></LayoutRoute>} />
              <Route path="/learning/tier3/:lessonId" element={<LayoutRoute><TierLessonPage tier="tier3" modulePrefix="tier3_" backPath="/learning/tier3" backLabel="Tier 3" /></LayoutRoute>} />
              <Route path="/classes" element={<LayoutRoute><ClassesPage /></LayoutRoute>} />
              <Route path="/classes/:classId/content/:contentId" element={<LayoutRoute><ClassContentPage /></LayoutRoute>} />
              <Route path="/classes/:classId/lessons/:lessonId" element={<LayoutRoute><StudentLessonPage /></LayoutRoute>} />
              <Route path="/classes/:classId/session/:sessionId" element={<ProtectedRoute><ClassSessionPage /></ProtectedRoute>} />
              <Route path="/classes/:classId" element={<LayoutRoute><ClassDetailPage /></LayoutRoute>} />
              <Route path="/coaching" element={<LayoutRoute><CoachingPage /></LayoutRoute>} />
              <Route path="/gurus" element={<LayoutRoute><GurusDirectoryPage /></LayoutRoute>} />
              <Route path="/gurus/:guruId" element={<LayoutRoute><GuruPublicProfileExternalPage /></LayoutRoute>} />
              <Route path="/checkout/success" element={<ProtectedRoute><EnrollmentSuccessPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<LayoutRoute><Analytics /></LayoutRoute>} />
              <Route path="/profile" element={<LayoutRoute><Profile /></LayoutRoute>} />
              <Route path="/settings" element={<LayoutRoute><Settings /></LayoutRoute>} />
              <Route path="/pricing" element={<LayoutRoute><PricingPage /></LayoutRoute>} />
              <Route path="/guru/apply" element={<ProtectedRoute><GuruApplyPage /></ProtectedRoute>} />
              <Route path="/guru" element={<ProtectedRoute><GuruDashboardPage /></ProtectedRoute>} />
              <Route path="/guru/profile" element={<ProtectedRoute><GuruPublicProfilePage /></ProtectedRoute>} />
              <Route path="/guru/classes/new" element={<ProtectedRoute><GuruClassFormPage /></ProtectedRoute>} />
              <Route path="/guru/classes/:id" element={<ProtectedRoute><GuruClassFormPage /></ProtectedRoute>} />
              <Route path="/guru/classes" element={<ProtectedRoute><GuruClassesPage /></ProtectedRoute>} />
              <Route path="/guru/students/:studentId" element={<ProtectedRoute><GuruStudentDetailPage /></ProtectedRoute>} />
              <Route path="/guru/students" element={<ProtectedRoute><GuruStudentsPage /></ProtectedRoute>} />
              <Route path="/guru/content/lessons/new" element={<ProtectedRoute><GuruLessonFormPage /></ProtectedRoute>} />
              <Route path="/guru/content/lessons/:lessonId" element={<ProtectedRoute><GuruLessonFormPage /></ProtectedRoute>} />
              <Route path="/guru/content/new" element={<ProtectedRoute><GuruContentFormPage /></ProtectedRoute>} />
              <Route path="/guru/content/:id" element={<ProtectedRoute><GuruContentFormPage /></ProtectedRoute>} />
              <Route path="/guru/content" element={<ProtectedRoute><GuruContentPage /></ProtectedRoute>} />
              <Route path="/guru/sessions/:id/live" element={<ProtectedRoute><GuruSessionLivePage /></ProtectedRoute>} />
              <Route path="/guru/sessions/new" element={<ProtectedRoute><GuruSessionFormPage /></ProtectedRoute>} />
              <Route path="/guru/sessions/:id" element={<ProtectedRoute><GuruSessionFormPage /></ProtectedRoute>} />
              <Route path="/guru/sessions" element={<ProtectedRoute><GuruSessionsPage /></ProtectedRoute>} />
              <Route path="/guru/payouts" element={<ProtectedRoute><GuruPayoutsPage /></ProtectedRoute>} />
              
              <Route path="/admin" element={<LayoutRoute><AdminOverviewPage /></LayoutRoute>} />
              <Route path="/admin/users" element={<LayoutRoute><AdminUsersPage /></LayoutRoute>} />
              <Route path="/admin/gurus" element={<LayoutRoute><AdminGuruApplicationsPage /></LayoutRoute>} />
              <Route path="/admin/invites" element={<LayoutRoute><AdminInviteCodesPage /></LayoutRoute>} />
              <Route path="/admin/config" element={<LayoutRoute><AdminConfigPage /></LayoutRoute>} />
              <Route path="/admin/content/lesson/new" element={<LayoutRoute><AdminLessonFormPage /></LayoutRoute>} />
              <Route path="/admin/content/lesson/:lessonId" element={<LayoutRoute><AdminLessonFormPage /></LayoutRoute>} />
              <Route path="/admin/content/quiz/new" element={<LayoutRoute><AdminQuizFormPage /></LayoutRoute>} />
              <Route path="/admin/content/quiz/:quizId" element={<LayoutRoute><AdminQuizFormPage /></LayoutRoute>} />
              <Route path="/admin/content" element={<LayoutRoute><AdminContentPage /></LayoutRoute>} />
              <Route path="/admin/content/course/new" element={<LayoutRoute><AdminCourseFormPage /></LayoutRoute>} />
              <Route path="/admin/content/course/:courseId/edit" element={<LayoutRoute><AdminCourseFormPage /></LayoutRoute>} />
              <Route path="/admin/content/course/:courseId" element={<LayoutRoute><AdminCourseDetailPage /></LayoutRoute>} />
              <Route path="/investor" element={<InvestorLayout><Navigate to="/investor/kpis" replace /></InvestorLayout>} />
              <Route path="/investor/kpis" element={<InvestorLayout><InvestorKpisPage /></InvestorLayout>} />
              <Route path="/investor/data-room" element={<InvestorLayout><InvestorDataRoomPage /></InvestorLayout>} />
              <Route path="/investor/roadmap" element={<InvestorLayout><InvestorRoadmapPage /></InvestorLayout>} />
              <Route path="/investor/notes" element={<InvestorLayout><InvestorNotesPage /></InvestorLayout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ChecklistFab />
            </TierProvider>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
