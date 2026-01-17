import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useUsers } from "@/hooks/use-users";
import { useTasks, useDeleteTask, useCompleteTask, useUncompleteTask } from "@/hooks/use-tasks";
import { useAuth } from "@/contexts/AuthContext";
import { TaskViewDialog } from "@/components/TaskViewDialog";
import { DuplicateTaskDialog } from "@/components/DuplicateTaskDialog";
import type { Task } from "@shared/schema";
import {
  CheckCircle2,
  Edit2,
  Trash2,
  Plus,
  Inbox,
  Calendar,
  CalendarDays,
  Copy,
  Coins,
  Tag,
  Home,
  Settings,
  LogOut,
  ChevronRight,
  Camera,
  Check,
  RefreshCw,
  Menu,
  X,
  User
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

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [filterByUserId, setFilterByUserId] = useState<string>("all");
  const [filterByCategory, setFilterByCategory] = useState<string>("all");
  const [duplicateTask, setDuplicateTask] = useState<Task | null>(null);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllCompleted = completedCount === totalCount && totalCount > 0;

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

  // Loading state
  if (authLoading || loadingTasks) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-base text-muted-foreground">
            {authLoading ? "Загрузка..." : "Загрузка задач..."}
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="app-layout">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-content">
          <div className="flex items-center gap-3">
            {/* Menu button for mobile (non-admin) */}
            {!user.isAdmin && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden header-button"
                aria-label="Меню"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="header-button"
              aria-label="Обновить"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Title */}
            <div className="min-w-0">
              <h1 className="header-title">Задачи</h1>
              <p className="header-subtitle truncate">
                {user.name || user.phone}
                {user.isAdmin && " (Админ)"}
              </p>
            </div>
          </div>

          {/* Bonus balance for workers */}
          {!user.isAdmin && (user as any).bonusBalance > 0 && (
            <div className="bonus-badge">
              <Coins className="w-5 h-5 text-yellow-300" />
              <span className="bonus-badge-text">{(user as any).bonusBalance} ₽</span>
            </div>
          )}
        </div>
      </header>

      {/* Mobile dropdown menu for non-admin */}
      {!user.isAdmin && isMenuOpen && (
        <div className="dropdown-menu animate-fade-in">
          <button
            className="dropdown-item w-full"
            onClick={() => setIsMenuOpen(false)}
          >
            <Home className="w-5 h-5 text-primary" />
            <span className="font-medium">Главная</span>
          </button>
          <div className="dropdown-divider" />
          <button
            className="dropdown-item danger w-full"
            onClick={() => {
              setIsMenuOpen(false);
              logout();
            }}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Выход</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="app-content">
        {/* Progress Card */}
        {totalCount > 0 && (
          <div className="progress-card animate-slide-up">
            <div className="progress-header">
              <div className="progress-stats">
                <div className={`progress-stats-icon ${isAllCompleted ? 'bg-green-100' : 'bg-blue-100'}`}>
                  <CheckCircle2 className={`w-5 h-5 ${isAllCompleted ? 'text-green-600' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className="progress-stats-text">Выполнено</p>
                  <p className="text-xs text-gray-500">{completedCount} из {totalCount} задач</p>
                </div>
              </div>
              <span className={`progress-percentage ${isAllCompleted ? 'text-green-600' : 'text-primary'}`}>
                {progressPercent}%
              </span>
            </div>
            <div className="progress-bar-container">
              <div
                className={`progress-bar-fill ${isAllCompleted ? 'completed' : 'in-progress'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Filters - only for admin */}
        {user?.isAdmin && (
          <div className="filters-bar">
            {categories.length > 0 && (
              <Select value={filterByCategory} onValueChange={setFilterByCategory}>
                <SelectTrigger className="h-10 w-auto min-w-[140px] rounded-xl text-sm font-medium bg-white border-gray-200">
                  <Tag className="w-4 h-4 mr-1.5 text-gray-400" />
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

            <Select value={filterByUserId} onValueChange={setFilterByUserId}>
              <SelectTrigger className="h-10 w-auto min-w-[150px] rounded-xl text-sm font-medium bg-white border-gray-200">
                <User className="w-4 h-4 mr-1.5 text-gray-400" />
                <SelectValue placeholder="Исполнитель" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все сотрудники</SelectItem>
                <SelectItem value="unassigned">Не назначенные</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id.toString()}>
                    {u.name || u.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Inbox className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="empty-state-title">
              {user?.isAdmin ? "Нет задач" : "Задач на сегодня нет"}
            </h3>
            <p className="empty-state-text">
              {user?.isAdmin
                ? "Создайте первую задачу для начала работы"
                : "Отдохните или проверьте расписание позже"}
            </p>
            {user?.isAdmin && (
              <button
                onClick={() => setLocation("/tasks/new")}
                className="empty-state-button"
              >
                <Plus className="w-5 h-5" />
                Создать задачу
              </button>
            )}
          </div>
        ) : (
          <div className="task-list">
            {filteredTasks.map(task => {
              const isCompleted = Boolean(task.isCompleted);
              const hasPrice = (task as any).price > 0;
              const hasCategory = (task as any).category;
              const requiresPhoto = task.requiresPhoto && !task.photoUrl;
              const weekDays = (task as any).weekDays;
              const monthDay = (task as any).monthDay;

              return (
                <div
                  key={task.id}
                  className={`task-card ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleTaskClick(task)}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => toggleTaskComplete(task.id, e)}
                      className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
                    >
                      {isCompleted && <Check className="w-4 h-4 text-white" />}
                    </button>

                    {/* Content */}
                    <div className="task-content">
                      <h3 className="task-title">{task.title}</h3>

                      {/* Task meta */}
                      <div className="task-meta">
                        {/* Worker - only for admin */}
                        {user?.isAdmin && task.workerId && (
                          <div className="worker-info">
                            <div className="worker-avatar">
                              {getUserInitials(task.workerId)}
                            </div>
                            <span>{getUserName(task.workerId)}</span>
                          </div>
                        )}

                        {/* Photo required */}
                        {requiresPhoto && !isCompleted && (
                          <div className="task-badge photo">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Фото</span>
                          </div>
                        )}

                        {/* Price */}
                        {hasPrice && (
                          <div className="task-badge price">
                            <Coins className="w-3.5 h-3.5" />
                            <span>+{(task as any).price} ₽</span>
                          </div>
                        )}

                        {/* Category */}
                        {hasCategory && (
                          <div className="task-badge category">
                            <Tag className="w-3.5 h-3.5" />
                            <span>{(task as any).category}</span>
                          </div>
                        )}

                        {/* Schedule - only for admin */}
                        {user?.isAdmin && weekDays && weekDays.length > 0 && (
                          <div className="task-badge schedule">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {(weekDays as number[])
                                .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                                .map(d => WEEK_DAY_SHORT_NAMES[d])
                                .join(", ")}
                            </span>
                          </div>
                        )}

                        {user?.isAdmin && monthDay && (
                          <div className="task-badge schedule">
                            <CalendarDays className="w-3.5 h-3.5" />
                            <span>{monthDay} число</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center">
                      {user?.isAdmin ? (
                        <div className="task-actions">
                          <button
                            className="task-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/tasks/${task.id}/edit`);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="task-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDuplicateTask(task);
                              setIsDuplicateDialogOpen(true);
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            className="task-action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Удалить задачу?")) {
                                deleteTask.mutate(task.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="task-arrow">
                          <ChevronRight className="w-5 h-5" />
                        </div>
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
          className="fab-button"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Bottom Navigation */}
      {user?.isAdmin && (
        <nav className="bottom-nav">
          <div className="bottom-nav-content">
            <button className="bottom-nav-item active">
              <Home className="w-5 h-5" />
              <span>Главная</span>
            </button>

            <button
              className="bottom-nav-item"
              onClick={() => setLocation("/admin/users")}
            >
              <Settings className="w-5 h-5" />
              <span>Настройки</span>
            </button>

            <button
              className="bottom-nav-item"
              onClick={() => logout()}
            >
              <LogOut className="w-5 h-5" />
              <span>Выход</span>
            </button>
          </div>
        </nav>
      )}

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
