import { Switch, Route, useLocation } from "wouter";
import { useLayoutEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import RegisterCompany from "@/pages/RegisterCompany";
import RegisterUser from "@/pages/RegisterUser";
import Instructions from "@/pages/Instructions";
import CreateTask from "@/pages/CreateTask";
import EditTask from "@/pages/EditTask";
import CreateWorker from "@/pages/CreateWorker";
import EditWorker from "@/pages/EditWorker";
import AdminUsers from "@/pages/AdminUsers";
import CompanySettings from "@/pages/CompanySettings";
import NotFound from "@/pages/not-found";

// Disable browser's automatic scroll restoration
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// Component to reset scroll on route change
function ScrollToTop() {
  const [location] = useLocation();

  // useLayoutEffect runs synchronously before browser paint
  useLayoutEffect(() => {
    // Reset scroll on all possible scrollable elements
    const resetScroll = () => {
      // Standard scroll reset
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Reset any scrollable containers (for mobile)
      const scrollableElements = document.querySelectorAll('[class*="overflow"], [class*="scroll"]');
      scrollableElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.scrollTop = 0;
        }
      });

      // iOS Safari specific - scroll the visual viewport
      if ('visualViewport' in window && window.visualViewport) {
        window.scrollTo(0, 0);
      }
    };

    // Immediate reset
    resetScroll();

    // After React render
    requestAnimationFrame(() => {
      resetScroll();
    });

    // Delayed reset for mobile browsers that delay scroll
    setTimeout(() => {
      resetScroll();
    }, 50);
  }, [location]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/register/company" component={RegisterCompany} />
        <Route path="/register/user" component={RegisterUser} />
        <Route path="/instructions" component={Instructions} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/settings" component={CompanySettings} />
        <Route path="/tasks/new" component={CreateTask} />
        <Route path="/tasks/:id/edit" component={EditTask} />
        <Route path="/workers/new" component={CreateWorker} />
        <Route path="/workers/:id/edit" component={EditWorker} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
