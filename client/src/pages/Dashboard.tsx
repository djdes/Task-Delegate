import { useState } from "react";
import { useLocation } from "wouter";
import { useWorkers, useDeleteWorker } from "@/hooks/use-workers";
import { useTasks, useDeleteTask } from "@/hooks/use-tasks";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  CheckCircle2,
  Circle,
  Edit2, 
  Trash2, 
  MoreHorizontal, 
  User,
  Plus,
  Calendar,
  Star,
  Inbox
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { data: workers = [], isLoading: loadingWorkers } = useWorkers();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  
  const [completedTasks, setCompletedTasks] = useState<Set<number>>(new Set());

  const deleteWorker = useDeleteWorker();
  const deleteTask = useDeleteTask();

  const getWorkerName = (workerId: number | null) => {
    if (!workerId) return "Не назначен";
    const worker = workers.find(w => w.id === workerId);
    return worker ? worker.name : "Неизвестный";
  };

  const toggleTaskComplete = (taskId: number) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  if (loadingWorkers || loadingTasks) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 h-screen border-r border-border bg-card/50 p-4 flex flex-col">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
              </div>
              Задачи
            </h1>
            {user && (
              <div className="mt-4 text-sm text-muted-foreground">
                <p>{user.email}</p>
                <button
                  onClick={() => logout()}
                  className="text-primary hover:underline mt-1"
                >
                  Выйти
                </button>
              </div>
            )}
            {!user && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setLocation("/login")}
                  className="text-sm text-primary hover:underline block"
                >
                  Войти
                </button>
                <button
                  onClick={() => setLocation("/register")}
                  className="text-sm text-muted-foreground hover:text-foreground block"
                >
                  Регистрация
                </button>
              </div>
            )}
          </div>

          <nav className="space-y-1 mb-8">
            <a href="#" className="things-sidebar-item active">
              <Inbox className="w-5 h-5" />
              <span>Входящие</span>
              <span className="ml-auto text-xs text-muted-foreground">{tasks.length}</span>
            </a>
            <a href="#" className="things-sidebar-item">
              <Calendar className="w-5 h-5" />
              <span>Сегодня</span>
            </a>
            <a href="#" className="things-sidebar-item">
              <Star className="w-5 h-5" />
              <span>Избранное</span>
            </a>
          </nav>

          <div className="mb-4">
            <h3 className="things-section-header flex items-center gap-2">
              <Users className="w-4 h-4" />
              Сотрудники
            </h3>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto">
            {workers.length === 0 ? (
              <p className="text-sm text-muted-foreground px-3 py-2">
                Нет сотрудников
              </p>
            ) : (
              workers.map(worker => (
                <div
                  key={worker.id}
                  className="things-sidebar-item group"
                >
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="flex-1 truncate">{worker.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {tasks.filter(t => t.workerId === worker.id).length}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setLocation(`/workers/${worker.id}/edit`)}>
                        <Edit2 className="w-4 h-4 mr-2" /> Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => deleteWorker.mutate(worker.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-border mt-4">
            <Button 
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={() => setLocation("/workers/new")}
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить сотрудника
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-screen overflow-y-auto">
          <div className="max-w-3xl mx-auto p-8">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-1">Входящие</h2>
              <p className="text-muted-foreground">
                {tasks.length === 0 
                  ? "Нет активных задач" 
                  : `${tasks.length} ${tasks.length === 1 ? 'задача' : tasks.length < 5 ? 'задачи' : 'задач'}`
                }
              </p>
            </div>

            {/* Task List */}
            <div className="space-y-1 mb-8">
              {tasks.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <Inbox className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">Нет задач</h3>
                  <p className="text-sm text-muted-foreground">
                    Создайте первую задачу, чтобы начать работу
                  </p>
                </div>
              ) : (
                tasks.map(task => {
                  const isCompleted = completedTasks.has(task.id);
                  return (
                    <div
                      key={task.id}
                      className={`things-list-item group ${isCompleted ? 'opacity-50' : ''}`}
                    >
                      <button
                        onClick={() => toggleTaskComplete(task.id)}
                        className="things-checkbox flex-shrink-0"
                        data-testid={`checkbox-task-${task.id}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <Circle className="w-5 h-5 text-border hover:text-primary/50 transition-colors" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </p>
                        {task.workerId && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" />
                            {getWorkerName(task.workerId)}
                          </p>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setLocation(`/tasks/${task.id}/edit`)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteTask.mutate(task.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Task */}
            <button
              onClick={() => setLocation("/tasks/new")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors text-left"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm">Новая задача</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
