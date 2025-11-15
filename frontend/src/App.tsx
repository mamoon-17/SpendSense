import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import { Login } from "@/pages/auth/Login";
import { Register } from "@/pages/auth/Register";
import { VerifyEmail } from "@/pages/auth/VerifyEmail";
import { Dashboard } from "@/pages/Dashboard";
import { Budgets } from "@/pages/Budgets";
import { Expenses } from "@/pages/Expenses";
import { SavingsGoals } from "@/pages/SavingsGoals";
import { Reports } from "@/pages/Reports";
import { Connections } from "@/pages/Connections";
import { Bills } from "@/pages/Bills";
import { Settings } from "@/pages/Settings";
import { Notifications } from "@/pages/Notifications";
import NotFound from "./pages/NotFound";
import { Messages } from "./pages/Messages";

// Export queryClient so it can be used to clear cache on logout
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected Routes - Use Layout with Outlet */}
          <Route
            path="/app"
            element={<Navigate to="/app/dashboard" replace />}
          />
          <Route
            path="/app/*"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="budgets" element={<Budgets />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="savings" element={<SavingsGoals />} />
            <Route path="messages" element={<Messages />} />
            <Route path="bills" element={<Bills />} />
            <Route path="reports" element={<Reports />} />
            <Route path="connections" element={<Connections />} />
            <Route path="settings" element={<Settings />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
