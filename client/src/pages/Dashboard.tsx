import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useUsers } from "@/hooks/use-users";
import { useTasks, useDeleteTask, useCompleteTask, useUncompleteTask } from "@/hooks/use-tasks";
import { useAuth } from "@/contexts/AuthContext";
import { TaskViewDialog } from "@/components/TaskViewDialog";
import { DuplicateTaskDialog } from "@/components/DuplicateTaskDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  MoreHorizontal,
  User,
  Plus,
  Inbox,
  Filter,
  Calendar,
  CalendarDays,
  Copy,
  Coins,
  Tag
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  // Получаем уникальные категории из всех задач
  const categories = Array.from(new Set(
    tasks
      .map(task => (task as any).category)
      .filter((c): c is string => c !== null && c !== undefined && c.trim() !== "")
  )).sort();

  // Обновляем выбранную задачу когда задачи обновляются
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

  // Получаем текущий день недели (0 = воскресенье, 1 = понедельник, ...)
  const currentDayOfWeek = new Date().getDay();
  // Получаем текущий день месяца (1-31)
  const currentDayOfMonth = new Date().getDate();

  // Функция проверки, должна ли задача показываться сегодня
  const isTaskVisibleToday = (task: typeof tasks[0]) => {
    const weekDays = (task as any).weekDays;
    const monthDay = (task as any).monthDay;

    // Проверяем день месяца (если указан)
    if (monthDay !== null && monthDay !== undefined) {
      if (monthDay !== currentDayOfMonth) {
        return false;
      }
    }

    // Проверяем день недели (если указан)
    if (weekDays && Array.isArray(weekDays) && weekDays.length > 0) {
      if (!weekDays.includes(currentDayOfWeek)) {
        return false;
      }
    }

    return true;
  };

  // Фильтруем задачи: для обычных пользователей показываем только их задачи
  // Для админа - применяем фильтр по выбранному пользователю
  // Для обычных пользователей - также фильтруем по текущему дню недели
  const filteredTasks = user?.isAdmin
    ? tasks
        .filter(task => {
          // Фильтр по пользователю
          if (filterByUserId === "all") return true;
          if (filterByUserId === "unassigned") return !task.workerId;
          return task.workerId === parseInt(filterByUserId);
        })
        .filter(task => {
          // Фильтр по категории
          if (filterByCategory === "all") return true;
          if (filterByCategory === "uncategorized") return !(task as any).category;
          return (task as any).category === filterByCategory;
        })
    : tasks
        .filter(task => task.workerId === user?.id && isTaskVisibleToday(task))
        .filter(task => {
          // Фильтр по категории для обычного пользователя
          if (filterByCategory === "all") return true;
          if (filterByCategory === "uncategorized") return !(task as any).category;
          return (task as any).category === filterByCategory;
        });

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

    // Если задача завершена - возвращаем в работу
    if (task.isCompleted) {
      uncompleteTask.mutate(taskId);
      return;
    }

    // Если требуется фото и его нет - открываем диалог
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
    // Обновляем задачу в списке задач
    queryClient.setQueryData(["tasks"], (oldTasks: typeof tasks | undefined) => {
      if (!oldTasks) return [];
      return oldTasks.map(task => task.id === updatedTask.id ? updatedTask : task);
    });
    setSelectedTask(updatedTask); // Обновляем выбранную задачу в диалоге
    // Инвалидируем кэш для обновления списка задач
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };

  // Если пользователь не авторизован - перенаправляем на страницу входа
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  // Показываем загрузку пока проверяем авторизацию
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground">Проверка авторизации...</span>
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
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 h-auto md:h-screen border-b md:border-b-0 md:border-r border-border/50 bg-card/80 backdrop-blur-sm p-4 flex flex-col shadow-sm">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/20">
                <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
              </div>
              Задачи
            </h1>
            {user && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-sm font-medium text-foreground truncate">{user.phone}</p>
                {user.isAdmin && (
                  <>
                    <p className="text-xs text-primary mt-1">Администратор</p>
                    <button
                      onClick={() => setLocation("/admin/users")}
                      className="w-full mt-2 text-xs px-2 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium"
                    >
                      Управление пользователями
                    </button>
                  </>
                )}
                {!user.isAdmin && (user as any).bonusBalance > 0 && (
                  <div className="mt-2 p-2 rounded bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-green-600" />
                      <p className="text-xs text-green-600 font-medium">Доп. премия к ЗП</p>
                    </div>
                    <p className="text-lg font-bold text-green-600 mt-0.5">{(user as any).bonusBalance} ₽</p>
                  </div>
                )}
                <button
                  onClick={() => logout()}
                  className="text-xs text-muted-foreground hover:text-primary mt-1.5 transition-colors"
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-auto md:h-screen overflow-y-auto bg-gradient-to-b from-transparent to-muted/10">
          <div className="max-w-3xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Входящие</h2>
                  <p className="text-muted-foreground text-sm">
                    {filteredTasks.length === 0
                      ? "Нет активных задач"
                      : `${filteredTasks.length} ${filteredTasks.length === 1 ? 'задача' : filteredTasks.length < 5 ? 'задачи' : 'задач'}`
                    }
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Фильтр по категории - для всех пользователей */}
                  {categories.length > 0 && (
                    <>
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <Select value={filterByCategory} onValueChange={setFilterByCategory}>
                        <SelectTrigger className="w-[160px]">
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
                    </>
                  )}
                  {/* Фильтр по исполнителю - только для админа */}
                  {user?.isAdmin && (
                    <>
                      <Filter className="w-4 h-4 text-muted-foreground" />
                      <Select value={filterByUserId} onValueChange={setFilterByUserId}>
                        <SelectTrigger className="w-[180px]">
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
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-2 mb-8 animate-fade-in">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mx-auto mb-6 flex items-center justify-center border border-primary/20 shadow-lg">
                    <Inbox className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Нет задач</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {user?.isAdmin 
                      ? "Создайте первую задачу, чтобы начать работу"
                      : "Вам еще не назначили задач"}
                  </p>
                  {user?.isAdmin && (
                    <button
                      onClick={() => setLocation("/tasks/new")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      Создать задачу
                    </button>
                  )}
                </div>
              ) : (
                filteredTasks.map(task => {
        const isCompleted = Boolean((task as any).isCompleted);
                  return (
                    <div
                      key={task.id}
                      className={`things-list-item group/item ${isCompleted ? 'opacity-60' : ''} hover:bg-muted/70 hover:shadow-sm transition-all rounded-xl border border-transparent hover:border-border/50 cursor-pointer`}
                      onClick={() => handleTaskClick(task)}
                    >
                      <button
                        onClick={(e) => toggleTaskComplete(task.id, e)}
                        className="things-checkbox flex-shrink-0 hover:scale-110 transition-transform"
                        data-testid={`checkbox-task-${task.id}`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-primary drop-shadow-sm" />
                        ) : (
                          <Circle className="w-5 h-5 text-border hover:text-primary/70 transition-colors" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </p>
                        {task.workerId && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
                              <User className="w-2.5 h-2.5 text-primary" />
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                              {getUserName(task.workerId)}
                            </p>
                          </div>
                        )}
                        {user?.isAdmin && (task as any).weekDays && (task as any).weekDays.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {((task as any).weekDays as number[])
                                .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                                .map(d => WEEK_DAY_SHORT_NAMES[d])
                                .join(", ")}
                            </p>
                          </div>
                        )}
                        {user?.isAdmin && (task as any).monthDay && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <CalendarDays className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {(task as any).monthDay} день месяца
                            </p>
                          </div>
                        )}
                        {(task as any).price > 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Coins className="w-3 h-3 text-green-600" />
                            <p className="text-xs text-green-600 font-medium">
                              +{(task as any).price} ₽
                            </p>
                          </div>
                        )}
                        {(task as any).category && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Tag className="w-3 h-3 text-blue-500" />
                            <p className="text-xs text-blue-500 font-medium">
                              {(task as any).category}
                            </p>
                          </div>
                        )}
                      </div>

                      {user?.isAdmin && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLocation(`/tasks/${task.id}/edit`);
                            }}
                            title="Редактировать"
                          >
                            <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDuplicateTask(task);
                              setIsDuplicateDialogOpen(true);
                            }}
                            title="Дублировать"
                          >
                            <Copy className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Вы уверены, что хотите удалить эту задачу?")) {
                                deleteTask.mutate(task.id);
                              }
                            }}
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Task - только для админа */}
            {user?.isAdmin && (
              <button
                onClick={() => setLocation("/tasks/new")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:text-primary border border-border/50 hover:border-primary/30 transition-all duration-200 text-left group/add"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 group-hover/add:bg-primary/20 flex items-center justify-center transition-colors">
                  <Plus className="w-4 h-4 group-hover/add:scale-110 transition-transform" />
                </div>
                <span className="text-sm font-medium">Новая задача</span>
              </button>
            )}
          </div>
        </main>
      </div>

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
