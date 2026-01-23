import { Switch, Route, useLocation } from "wouter";
import { useEffect, useRef } from "react";
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
  const prevLocation = useRef(location);

  useEffect(() => {
    // Skip if location hasn't changed
    if (prevLocation.current === location) return;
    prevLocation.current = location;

    // Force scroll to top using multiple methods
    const scrollToTop = () => {
      // Method 1: Standard window scroll
      window.scrollTo(0, 0);

      // Method 2: Direct property assignment
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      // Method 3: Scroll with options (for modern browsers)
      try {
        window.scroll({ top: 0, left: 0, behavior: 'instant' });
      } catch (e) {
        window.scroll(0, 0);
      }
    };

    // Execute immediately
    scrollToTop();

    // Execute after DOM updates
    requestAnimationFrame(scrollToTop);

    // Execute after a short delay (for mobile browsers)
    setTimeout(scrollToTop, 0);
    setTimeout(scrollToTop, 50);
    setTimeout(scrollToTop, 100);
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
