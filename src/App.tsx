import { Suspense, lazy } from "react";
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
import PendingAccess from "./pages/PendingAccess";
import NotFound from "./pages/NotFound";
import SpGuard from "./components/SpGuard";
import { Loader2 } from "lucide-react";

const Settings = lazy(() => import("./pages/Settings"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Accounts = lazy(() => import("./pages/Accounts"));
const Interventions = lazy(() => import("./pages/Interventions"));
const Providers = lazy(() => import("./pages/Providers"));
const FleetManagers = lazy(() => import("./pages/FleetManagers"));
const Map = lazy(() => import("./pages/Map"));
const Dispatch = lazy(() => import("./pages/Dispatch"));
const Technicians = lazy(() => import("./pages/Technicians"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const Billing = lazy(() => import("./pages/Billing"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Documentation = lazy(() => import("./pages/Documentation"));
const UserGuide = lazy(() => import("./pages/UserGuide"));
const AdminOnboarding = lazy(() => import("./pages/AdminOnboarding"));
const SpDashboard = lazy(() => import("./pages/sp/SpDashboard"));
const SpTechnicians = lazy(() => import("./pages/sp/SpTechnicians"));
const SpServices = lazy(() => import("./pages/sp/SpServices"));
const SpInvoices = lazy(() => import("./pages/sp/SpInvoices"));
const SpOnboarding = lazy(() => import("./pages/sp/SpOnboarding"));
const SpSettings = lazy(() => import("./pages/sp/SpSettings"));
const SpInterventions = lazy(() => import("./pages/sp/SpInterventions"));
const SpMap = lazy(() => import("./pages/sp/SpMap"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminRoles = lazy(() => import("./pages/AdminRoles"));

const queryClient = new QueryClient();

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="space-y-4 animate-fade-in">
    <h1 className="text-2xl font-bold text-foreground">{title}</h1>
    <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
      <p className="text-muted-foreground">This section is under construction.</p>
    </div>
  </div>
);

const RouteFallback = () => (
  <div className="min-h-[320px] flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              <Suspense fallback={<RouteFallback />}>
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
                  <Route path="/sp" element={<ProtectedRoute><SpGuard><SpLayout /></SpGuard></ProtectedRoute>}>
                    <Route index element={<Navigate to="/sp/dashboard" replace />} />
                    <Route path="dashboard" element={<SpDashboard />} />
                    <Route path="technicians" element={<SpTechnicians />} />
                    <Route path="services" element={<SpServices />} />
                    <Route path="interventions" element={<SpInterventions />} />
                    <Route path="map" element={<SpMap />} />
                    <Route path="invoices" element={<SpInvoices />} />
                    <Route path="onboarding" element={<SpOnboarding />} />
                    <Route path="settings" element={<SpSettings />} />
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
