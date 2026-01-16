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
  Check,
  RefreshCw
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    await queryClient.invalidateQueries({ queryKey: ["users"] });
    setTimeout(() => setIsRefreshing(false), 600);
  };

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
    <div className="desktop-layout">
      {/* Header - Ozon style */}
      <header className="ozon-header">
        <div className="flex items-center justify-between max-w-6xl mx-auto lg:px-0">
          <div className="flex items-center gap-2.5">
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="refresh-btn"
              aria-label="Обновить"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-bold text-white drop-shadow-sm whitespace-nowrap truncate">Ежедневные задачи</h1>
              <p className="text-sm text-white/80 font-medium truncate">
                {user.name || user.phone}
                {user.isAdmin && " (Админ)"}
              </p>
            </div>
          </div>

          {/* Bonus balance for workers */}
          {!user.isAdmin && (user as any).bonusBalance > 0 && (
            <div className="relative bg-gradient-to-r from-yellow-400/30 to-yellow-500/20 backdrop-blur-sm rounded-xl px-3 py-2 border border-yellow-300/30 shadow-lg shadow-yellow-500/10 overflow-hidden">
              {/* Shimmer animation */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="flex items-center gap-1.5 whitespace-nowrap relative z-10">
                <Coins className="w-5 h-5 text-yellow-300 animate-pulse" />
                <span className="text-base font-bold text-white drop-shadow-sm">{(user as any).bonusBalance} ₽</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="progress-section">
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
              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      {(categories.length > 0 || user?.isAdmin) && (
        <div className="filters-section">
          <div className="flex flex-wrap gap-3 max-w-6xl mx-auto lg:px-0">
            {categories.length > 0 && (
              <Select value={filterByCategory} onValueChange={setFilterByCategory}>
                <SelectTrigger className="h-10 w-auto min-w-[140px] rounded-xl text-sm font-medium">
                  <Tag className="w-4 h-4 mr-1.5 text-muted-foreground" />
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
                <SelectTrigger className="h-10 w-auto min-w-[150px] rounded-xl text-sm font-medium">
                  <Filter className="w-4 h-4 mr-1.5 text-muted-foreground" />
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
      <main className="desktop-content">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Inbox className="w-16 h-16 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-3">Нет задач</h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-sm">
              {user?.isAdmin
                ? "Создайте первую задачу для начала работы"
                : "Вам пока не назначили задач"}
            </p>
            {user?.isAdmin && (
              <button
                onClick={() => setLocation("/tasks/new")}
                className="ozon-btn ozon-btn-primary flex items-center gap-3"
              >
                <Plus className="w-6 h-6" />
                Создать задачу
              </button>
            )}
          </div>
        ) : (
          <div className="task-grid">
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
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => toggleTaskComplete(task.id, e)}
                      className={`ozon-checkbox mt-0.5 ${isCompleted ? 'checked' : ''}`}
                    >
                      {isCompleted && (
                        <Check className="w-4 h-4 text-primary-foreground" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-base font-semibold ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </h3>

                      {/* Task meta info */}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {/* Worker badge */}
                        {task.workerId && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <div className="user-avatar-sm">
                              {getUserInitials(task.workerId)}
                            </div>
                            <span className="font-medium">{getUserName(task.workerId)}</span>
                          </div>
                        )}

                        {/* Photo required indicator */}
                        {requiresPhoto && !isCompleted && (
                          <div className="flex items-center gap-1 text-sm text-orange-500 font-medium">
                            <Camera className="w-4 h-4" />
                            <span>Фото</span>
                          </div>
                        )}
                      </div>

                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
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
                          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-xl">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {((task as any).weekDays as number[])
                                .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                                .map(d => WEEK_DAY_SHORT_NAMES[d])
                                .join(", ")}
                            </span>
                          </div>
                        )}

                        {user?.isAdmin && (task as any).monthDay && (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted px-3 py-1.5 rounded-xl">
                            <CalendarDays className="w-4 h-4" />
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
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Bottom Navigation - compact for mobile */}
      <nav className="ozon-bottom-nav">
        <div className="flex items-center justify-around lg:flex-col lg:items-stretch lg:gap-1">
          <button className="ozon-bottom-nav-item active">
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Главная</span>
          </button>

          {user?.isAdmin && (
            <button
              className="ozon-bottom-nav-item"
              onClick={() => setLocation("/admin/users")}
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs font-medium">Настройки</span>
            </button>
          )}

          <button
            className="ozon-bottom-nav-item"
            onClick={() => logout()}
          >
            <LogOut className="w-5 h-5" />
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
