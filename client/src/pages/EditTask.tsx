import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useUpdateTask, useTask } from "@/hooks/use-tasks";
import { useUsers } from "@/hooks/use-users";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Edit, Calendar, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const formSchema = insertTaskSchema.extend({
  workerId: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  requiresPhoto: z.boolean().optional().default(false),
  weekDays: z.array(z.number()).nullable().optional(),
  isRecurring: z.boolean().optional().default(true),
});

type FormValues = z.input<typeof formSchema>;

const WEEK_DAYS = [
  { value: 1, label: "Пн" },
  { value: 2, label: "Вт" },
  { value: 3, label: "Ср" },
  { value: 4, label: "Чт" },
  { value: 5, label: "Пт" },
  { value: 6, label: "Сб" },
  { value: 0, label: "Вс" },
];

export default function EditTask() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { data: task, isLoading } = useTask(Number(id));
  const updateTask = useUpdateTask();
  const { data: users = [] } = useUsers();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      workerId: undefined,
      requiresPhoto: false,
      weekDays: null,
      isRecurring: true,
    },
  });

  // Обновляем форму когда задача загружена
  useEffect(() => {
    if (task) {
      // Получаем weekDays и преобразуем в массив если нужно
      const taskWeekDays = (task as any).weekDays;
      let weekDaysArray: number[] | null = null;
      if (taskWeekDays) {
        if (Array.isArray(taskWeekDays)) {
          weekDaysArray = taskWeekDays;
        } else if (typeof taskWeekDays === 'string') {
          try {
            weekDaysArray = JSON.parse(taskWeekDays);
          } catch {
            weekDaysArray = null;
          }
        }
      }

      form.reset({
        title: task.title,
        workerId: task.workerId ? task.workerId.toString() : undefined,
        requiresPhoto: task.requiresPhoto ?? false,
        weekDays: weekDaysArray,
        isRecurring: (task as any).isRecurring ?? true,
      });
    }
  }, [task, form]);

  // Проверка прав администратора (после всех хуков)
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Доступ запрещен</h1>
          <p className="text-muted-foreground mb-4">Только администратор может редактировать задачи</p>
          <button
            onClick={() => setLocation("/")}
            className="text-primary hover:underline"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const onSubmit = (values: FormValues) => {
    if (!id) return;
    const taskData = {
      id: Number(id),
      title: values.title,
      workerId: values.workerId,
      requiresPhoto: values.requiresPhoto ?? false,
      weekDays: values.weekDays && values.weekDays.length > 0 ? values.weekDays : null,
      isRecurring: values.isRecurring ?? true,
    };
    updateTask.mutate(
      taskData as any,
      {
        onSuccess: () => {
          toast({
            title: "Успешно",
            description: "Задача обновлена",
          });
          setLocation("/");
        },
        onError: (error: any) => {
          toast({
            title: "Ошибка",
            description: error.message || "Не удалось обновить задачу",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Задача не найдена</h1>
          <button
            onClick={() => setLocation("/")}
            className="text-primary hover:underline"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="max-w-2xl mx-auto p-8">
        <div className="mb-8">
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Назад
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
              <Edit className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Редактировать задачу</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[60px]">Измените информацию о задаче</p>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input 
                      className="things-input" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="workerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Исполнитель</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="things-input w-full">
                        <SelectValue placeholder="Выберите сотрудника" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          <p>Нет пользователей</p>
                        </div>
                      ) : (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name || user.phone}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requiresPhoto"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/50 p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Добавить фото результатов
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Пользователь должен будет загрузить фотографию перед завершением задачи
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weekDays"
              render={({ field }) => (
                <FormItem className="rounded-md border border-border/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <FormLabel className="text-sm font-medium">Дни недели</FormLabel>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Выберите дни, когда задача будет показываться пользователю. Если ничего не выбрано - задача видна всегда.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => {
                      const isSelected = field.value?.includes(day.value) ?? false;
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            const currentDays = field.value ?? [];
                            if (isSelected) {
                              field.onChange(currentDays.filter((d: number) => d !== day.value));
                            } else {
                              field.onChange([...currentDays, day.value]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/50 p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Повторяющаяся задача
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Задача будет автоматически сбрасываться каждый день. Фотографии удаляются, статус выполнения сбрасывается.
                    </p>
                  </div>
                </FormItem>
              )}
            />

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => setLocation("/")}
                  className="flex-1 border border-border/50"
                >
                  Отмена
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateTask.isPending}
                  className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
                >
                  {updateTask.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
