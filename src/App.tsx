import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminGuard from "./components/AdminGuard";
import RoleGuard from "./components/RoleGuard";
import AppLayout from "./components/AppLayout";
import SpLayout from "./components/SpLayout";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Settings from "./pages/Settings";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Interventions from "./pages/Interventions";
import Providers from "./pages/Providers";
import FleetManagers from "./pages/FleetManagers";
import Map from "./pages/Map";
import Dispatch from "./pages/Dispatch";
import Technicians from "./pages/Technicians";
import AuditLogs from "./pages/AuditLogs";
import Billing from "./pages/Billing";
import Analytics from "./pages/Analytics";
import Documentation from "./pages/Documentation";
import UserGuide from "./pages/UserGuide";
import AdminOnboarding from "./pages/AdminOnboarding";
import SpDashboard from "./pages/sp/SpDashboard";
import SpTechnicians from "./pages/sp/SpTechnicians";
import SpServices from "./pages/sp/SpServices";
import SpInvoices from "./pages/sp/SpInvoices";
import SpOnboarding from "./pages/sp/SpOnboarding";
import SpSettings from "./pages/sp/SpSettings";
import Profile from "./pages/Profile";
import AdminRoles from "./pages/AdminRoles";
import PendingAccess from "./pages/PendingAccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="space-y-4 animate-fade-in">
    <h1 className="text-2xl font-bold text-foreground">{title}</h1>
    <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
      <p className="text-muted-foreground">This section is under construction.</p>
    </div>
  </div>
);

const App = () => (
  <ThemeProvider>
    <LanguageProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/pending-access" element={<ProtectedRoute><PendingAccess /></ProtectedRoute>} />
                <Route path="/" element={<ProtectedRoute><AdminGuard><AppLayout /></AdminGuard></ProtectedRoute>}>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="accounts" element={<RoleGuard allowedRoles={["admin"]}><Accounts /></RoleGuard>} />
                  <Route path="onboarding" element={<RoleGuard allowedRoles={["admin"]}><AdminOnboarding /></RoleGuard>} />
                  <Route path="providers" element={<Providers />} />
                  <Route path="fleet-managers" element={<FleetManagers />} />
                  <Route path="interventions" element={<Interventions />} />
                  <Route path="map" element={<Map />} />
                  <Route path="dispatch" element={<RoleGuard allowedRoles={["admin", "moderator"]}><Dispatch /></RoleGuard>} />
                  <Route path="technicians" element={<Technicians />} />
                  <Route path="audit-logs" element={<RoleGuard allowedRoles={["admin"]}><AuditLogs /></RoleGuard>} />
                  <Route path="billing" element={<RoleGuard allowedRoles={["admin", "moderator"]}><Billing /></RoleGuard>} />
                  <Route path="analytics" element={<RoleGuard allowedRoles={["admin", "moderator"]}><Analytics /></RoleGuard>} />
                  <Route path="documentation" element={<Documentation />} />
                  <Route path="user-guide" element={<UserGuide />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="admin-roles" element={<RoleGuard allowedRoles={["admin"]}><AdminRoles /></RoleGuard>} />
                  <Route path="settings" element={<RoleGuard allowedRoles={["admin", "moderator"]}><Settings /></RoleGuard>} />
                </Route>
                <Route path="/sp" element={<ProtectedRoute><SpLayout /></ProtectedRoute>}>
                  <Route index element={<Navigate to="/sp/dashboard" replace />} />
                  <Route path="dashboard" element={<SpDashboard />} />
                  <Route path="technicians" element={<SpTechnicians />} />
                  <Route path="services" element={<SpServices />} />
                  <Route path="interventions" element={<PlaceholderPage title="Interventions" />} />
                  <Route path="map" element={<PlaceholderPage title="Map View" />} />
                  <Route path="invoices" element={<SpInvoices />} />
                  <Route path="onboarding" element={<SpOnboarding />} />
                  <Route path="settings" element={<SpSettings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
