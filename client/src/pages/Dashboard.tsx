import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useUsers } from "@/hooks/use-users";
import { useTasks, useDeleteTask, useCompleteTask, useUncompleteTask } from "@/hooks/use-tasks";
import { useAuth } from "@/contexts/AuthContext";
import { TaskViewDialog } from "@/components/TaskViewDialog";
import { DuplicateTaskDialog } from "@/components/DuplicateTaskDialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  User,
  Plus,
  Inbox,
  Filter,
  Calendar,
  CalendarDays,
  Copy,
  Coins,
  Tag,
  Home,
  ListTodo,
  Settings,
  LogOut,
  ChevronRight,
  Camera,
  Check
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const WEEK_DAY_SHORT_NAMES: { [key: number]: string } = {
  0: "Вс",
  1: "Пн",
  2: "Вт",
  3: "Ср",
  4: "Чт",
  5: "Пт",
  6: "Сб",
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { data: users = [] } = useUsers();
  const { data: tasks = [], isLoading: loadingTasks } = useTasks();
  const { toast } = useToast();

  const [selectedTask, setSelectedTask] = useState<typeof tasks[0] | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [filterByUserId, setFilterByUserId] = useState<string>("all");
  const [filterByCategory, setFilterByCategory] = useState<string>("all");
  const [duplicateTask, setDuplicateTask] = useState<typeof tasks[0] | null>(null);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);

  const categories = Array.from(new Set(
    tasks
      .map(task => (task as any).category)
      .filter((c): c is string => c !== null && c !== undefined && c.trim() !== "")
  )).sort();

  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated) {
        setSelectedTask(updated);
      }
    }
  }, [tasks, selectedTask]);

  const deleteTask = useDeleteTask();
  const completeTask = useCompleteTask();
  const uncompleteTask = useUncompleteTask();

  const getUserName = (userId: number | null) => {
    if (!userId) return "Не назначен";
    const foundUser = users.find(u => u.id === userId);
    return foundUser ? (foundUser.name || foundUser.phone) : "Неизвестный";
  };

  const getUserInitials = (userId: number | null) => {
    if (!userId) return "?";
    const foundUser = users.find(u => u.id === userId);
    if (!foundUser) return "?";
    const name = foundUser.name || foundUser.phone;
    return name.slice(0, 2).toUpperCase();
  };

  const currentDayOfWeek = new Date().getDay();
  const currentDayOfMonth = new Date().getDate();

  const isTaskVisibleToday = (task: typeof tasks[0]) => {
    const weekDays = (task as any).weekDays;
    const monthDay = (task as any).monthDay;

    if (monthDay !== null && monthDay !== undefined) {
      if (monthDay !== currentDayOfMonth) {
        return false;
      }
    }

    if (weekDays && Array.isArray(weekDays) && weekDays.length > 0) {
      if (!weekDays.includes(currentDayOfWeek)) {
        return false;
      }
    }

    return true;
  };

  const filteredTasks = user?.isAdmin
    ? tasks
        .filter(task => {
          if (filterByUserId === "all") return true;
          if (filterByUserId === "unassigned") return !task.workerId;
          return task.workerId === parseInt(filterByUserId);
        })
        .filter(task => {
          if (filterByCategory === "all") return true;
          if (filterByCategory === "uncategorized") return !(task as any).category;
          return (task as any).category === filterByCategory;
        })
    : tasks
        .filter(task => task.workerId === user?.id && isTaskVisibleToday(task))
        .filter(task => {
          if (filterByCategory === "all") return true;
          if (filterByCategory === "uncategorized") return !(task as any).category;
          return (task as any).category === filterByCategory;
        });

  const completedCount = filteredTasks.filter(t => t.isCompleted).length;
  const totalCount = filteredTasks.length;

  const handleTaskClick = (task: typeof tasks[0]) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(true);
  };

  const toggleTaskComplete = (taskId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    if (task.isCompleted) {
      uncompleteTask.mutate(taskId);
      return;
    }

    if (task.requiresPhoto && !task.photoUrl) {
      handleTaskClick(task);
      return;
    }

    completeTask.mutate(taskId);
  };

  const handleTaskComplete = () => {
    if (selectedTask) {
      toggleTaskComplete(selectedTask.id);
      setIsTaskDialogOpen(false);
      setSelectedTask(null);
    }
  };

  const handleTaskUpdate = (updatedTask: typeof tasks[0]) => {
    queryClient.setQueryData(["tasks"], (oldTasks: typeof tasks | undefined) => {
      if (!oldTasks) return [];
      return oldTasks.map(task => task.id === updatedTask.id ? updatedTask : task);
    });
    setSelectedTask(updatedTask);
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-base text-muted-foreground">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (loadingTasks) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-base text-muted-foreground">Загрузка задач...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - Ozon style */}
      <header className="ozon-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ListTodo className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Задачи</h1>
              <p className="text-sm text-white/80">
                {user.name || user.phone}
                {user.isAdmin && " (Админ)"}
              </p>
            </div>
          </div>

          {/* Bonus balance for workers */}
          {!user.isAdmin && (user as any).bonusBalance > 0 && (
            <div className="bg-white/20 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-300" />
                <span className="font-bold">{(user as any).bonusBalance} ₽</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="px-4 py-3 bg-card border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Выполнено {completedCount} из {totalCount}
            </span>
            <span className="text-sm font-bold text-primary">
              {Math.round((completedCount / totalCount) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      {(categories.length > 0 || user?.isAdmin) && (
        <div className="px-4 py-3 bg-card border-b border-border">
          <div className="flex flex-wrap gap-2">
            {categories.length > 0 && (
              <Select value={filterByCategory} onValueChange={setFilterByCategory}>
                <SelectTrigger className="h-10 w-auto min-w-[140px] rounded-xl">
                  <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Категория" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  <SelectItem value="uncategorized">Без категории</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {user?.isAdmin && (
              <Select value={filterByUserId} onValueChange={setFilterByUserId}>
                <SelectTrigger className="h-10 w-auto min-w-[160px] rounded-xl">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Исполнитель" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все задачи</SelectItem>
                  <SelectItem value="unassigned">Не назначенные</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name || u.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      )}

      {/* Task List */}
      <main className="px-4 py-4">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Inbox className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Нет задач</h3>
            <p className="text-base text-muted-foreground mb-6 max-w-xs">
              {user?.isAdmin
                ? "Создайте первую задачу для начала работы"
                : "Вам пока не назначили задач"}
            </p>
            {user?.isAdmin && (
              <button
                onClick={() => setLocation("/tasks/new")}
                className="ozon-btn ozon-btn-primary flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Создать задачу
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => {
              const isCompleted = Boolean((task as any).isCompleted);
              const hasPrice = (task as any).price > 0;
              const hasCategory = (task as any).category;
              const requiresPhoto = task.requiresPhoto && !task.photoUrl;

              return (
                <div
                  key={task.id}
                  className={`task-card ${isCompleted ? 'task-card-completed' : ''}`}
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-start gap-4">
                    {/* Large checkbox */}
                    <button
                      onClick={(e) => toggleTaskComplete(task.id, e)}
                      className={`ozon-checkbox mt-0.5 ${isCompleted ? 'checked' : ''}`}
                    >
                      {isCompleted && (
                        <Check className="w-5 h-5 text-primary-foreground" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base font-semibold mb-1 ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </h3>

                      {/* Task meta info */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {/* Worker badge */}
                        {task.workerId && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <div className="user-avatar-sm">
                              {getUserInitials(task.workerId)}
                            </div>
                            <span>{getUserName(task.workerId)}</span>
                          </div>
                        )}

                        {/* Photo required indicator */}
                        {requiresPhoto && !isCompleted && (
                          <div className="flex items-center gap-1 text-sm text-orange-500">
                            <Camera className="w-4 h-4" />
                            <span>Нужно фото</span>
                          </div>
                        )}
                      </div>

                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {hasPrice && (
                          <div className="price-badge">
                            <Coins className="w-4 h-4" />
                            <span>+{(task as any).price} ₽</span>
                          </div>
                        )}

                        {hasCategory && (
                          <div className="category-badge">
                            <Tag className="w-3.5 h-3.5" />
                            <span>{(task as any).category}</span>
                          </div>
                        )}

                        {/* Schedule info for admin */}
                        {user?.isAdmin && (task as any).weekDays && (task as any).weekDays.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {((task as any).weekDays as number[])
                                .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                                .map(d => WEEK_DAY_SHORT_NAMES[d])
                                .join(", ")}
                            </span>
                          </div>
                        )}

                        {user?.isAdmin && (task as any).monthDay && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>{(task as any).monthDay} число</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Arrow / Actions */}
                    <div className="flex items-center">
                      {user?.isAdmin ? (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/tasks/${task.id}/edit`);
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDuplicateTask(task);
                              setIsDuplicateDialogOpen(true);
                            }}
                          >
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Удалить задачу?")) {
                                deleteTask.mutate(task.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FAB for admin */}
      {user?.isAdmin && filteredTasks.length > 0 && (
        <button
          onClick={() => setLocation("/tasks/new")}
          className="things-fab"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Bottom Navigation - Ozon style */}
      <nav className="ozon-bottom-nav">
        <div className="flex items-center justify-around">
          <button className="ozon-bottom-nav-item active">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Главная</span>
          </button>

          <button
            className="ozon-bottom-nav-item"
            onClick={() => toast({ title: "Скоро", description: "Раздел в разработке" })}
          >
            <ListTodo className="w-6 h-6" />
            <span className="text-xs font-medium">История</span>
          </button>

          {user?.isAdmin && (
            <button
              className="ozon-bottom-nav-item"
              onClick={() => setLocation("/admin/users")}
            >
              <Settings className="w-6 h-6" />
              <span className="text-xs font-medium">Настройки</span>
            </button>
          )}

          <button
            className="ozon-bottom-nav-item"
            onClick={() => logout()}
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xs font-medium">Выход</span>
          </button>
        </div>
      </nav>

      {/* Dialogs */}
      {user && (
        <TaskViewDialog
          task={selectedTask}
          open={isTaskDialogOpen}
          onOpenChange={setIsTaskDialogOpen}
          onComplete={handleTaskComplete}
          canComplete={true}
          onTaskUpdate={handleTaskUpdate}
        />
      )}

      {user?.isAdmin && (
        <DuplicateTaskDialog
          task={duplicateTask}
          open={isDuplicateDialogOpen}
          onOpenChange={setIsDuplicateDialogOpen}
        />
      )}
    </div>
  );
}
