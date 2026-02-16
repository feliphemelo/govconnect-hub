import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import Contacts from "./pages/Contacts";
import Chatbot from "./pages/Chatbot";
import Groups from "./pages/Groups";
import Broadcasts from "./pages/Broadcasts";
import Signatures from "./pages/Signatures";
import Reports from "./pages/Reports";
import Credits from "./pages/Credits";
import Webhooks from "./pages/Webhooks";
import Polls from "./pages/Polls";
import SuperAdmin from "./pages/SuperAdmin";
import SettingsPage from "./pages/SettingsPage";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/chatbot" element={<Chatbot />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/broadcasts" element={<Broadcasts />} />
                <Route path="/signatures" element={<Signatures />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/credits" element={<Credits />} />
                <Route path="/webhooks" element={<Webhooks />} />
                <Route path="/polls" element={<Polls />} />
                <Route path="/superadmin" element={<SuperAdmin />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
