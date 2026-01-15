import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import CreateTask from "@/pages/CreateTask";
import EditTask from "@/pages/EditTask";
import CreateWorker from "@/pages/CreateWorker";
import EditWorker from "@/pages/EditWorker";
import AdminUsers from "@/pages/AdminUsers";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/tasks/new" component={CreateTask} />
      <Route path="/tasks/:id/edit" component={EditTask} />
      <Route path="/workers/new" component={CreateWorker} />
      <Route path="/workers/:id/edit" component={EditWorker} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
