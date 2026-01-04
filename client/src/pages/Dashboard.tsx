import { useState } from "react";
import { useWorkers, useDeleteWorker } from "@/hooks/use-workers";
import { useTasks, useDeleteTask } from "@/hooks/use-tasks";
import { CreateWorkerDialog } from "@/components/CreateWorkerDialog";
import { EditWorkerDialog } from "@/components/EditWorkerDialog";
import { CreateTaskDialog } from "@/components/CreateTaskDialog";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  CheckSquare, 
  Edit2, 
  Trash2, 
  MoreHorizontal, 
  UserCircle,
  Briefcase
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Worker, Task } from "@shared/schema";

export default function Dashboard() {
  const { data: workers = [], isLoading: loadingWorkers } = useWorkers();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const deleteWorker = useDeleteWorker();
  const deleteTask = useDeleteTask();

  // Helper to get worker name for a task
  const getWorkerName = (workerId: number | null) => {
    if (!workerId) return "Unassigned";
    const worker = workers.find(w => w.id === workerId);
    return worker ? worker.name : "Unknown Worker";
  };

  const getWorkerInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loadingWorkers || loadingTasks) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-4xl font-display font-bold text-slate-900">
              Task Delegation
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Manage your team and assign responsibilities efficiently.
            </p>
          </div>
          <div className="flex gap-3">
             {/* Stats could go here */}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Workers */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-indigo-950 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Team Members
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 ml-2">
                  {workers.length}
                </Badge>
              </h2>
            </div>

            <CreateWorkerDialog />

            <div className="space-y-4">
              {workers.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-slate-300">
                  <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No team members yet</p>
                  <p className="text-sm text-slate-400">Add your first worker above</p>
                </div>
              ) : (
                workers.map(worker => (
                  <Card 
                    key={worker.id}
                    className="p-4 flex items-center justify-between group hover:shadow-lg transition-all duration-300 border-l-4 border-l-transparent hover:border-l-indigo-500 bg-white"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-indigo-100">
                        <AvatarFallback className="bg-indigo-50 text-indigo-600 font-semibold">
                          {getWorkerInitials(worker.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">
                          {worker.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {tasks.filter(t => t.workerId === worker.id).length} active tasks
                        </p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingWorker(worker)}>
                          <Edit2 className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => deleteWorker.mutate(worker.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Tasks */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-semibold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-slate-700" />
                Active Tasks
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 ml-2">
                  {tasks.length}
                </Badge>
              </h2>
            </div>

            <CreateTaskDialog />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.length === 0 ? (
                <div className="col-span-full text-center p-12 bg-white rounded-2xl border border-dashed border-slate-300">
                  <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No tasks assigned</p>
                  <p className="text-sm text-slate-400">Create a task to get started</p>
                </div>
              ) : (
                tasks.map(task => (
                  <Card 
                    key={task.id}
                    className="p-5 flex flex-col justify-between h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-t-4 border-t-transparent hover:border-t-slate-800 bg-white"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 rounded-lg bg-slate-50 text-slate-500">
                          <CheckSquare className="w-5 h-5" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-slate-300 hover:text-slate-600">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingTask(task)}>
                              <Edit2 className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600 focus:text-red-600"
                              onClick={() => deleteTask.mutate(task.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">
                        {task.title}
                      </h3>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                        Assigned To
                      </span>
                      <div className="flex items-center gap-2">
                        {task.workerId ? (
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-medium pl-1 pr-2 py-0.5 h-6">
                            <Avatar className="h-4 w-4 mr-1.5">
                              <AvatarFallback className="text-[9px] bg-indigo-200 text-indigo-700">
                                {getWorkerInitials(getWorkerName(task.workerId))}
                              </AvatarFallback>
                            </Avatar>
                            {getWorkerName(task.workerId)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">
                            Unassigned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialogs */}
      {editingWorker && (
        <EditWorkerDialog 
          worker={editingWorker} 
          open={!!editingWorker} 
          onOpenChange={(open) => !open && setEditingWorker(null)} 
        />
      )}

      {editingTask && (
        <EditTaskDialog 
          task={editingTask} 
          open={!!editingTask} 
          onOpenChange={(open) => !open && setEditingTask(null)} 
        />
      )}
    </div>
  );
}
