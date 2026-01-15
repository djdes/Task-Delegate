import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCreateTask } from "@/hooks/use-tasks";
import { useUsers } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, RefreshCw, Copy } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface Task {
  id: number;
  title: string;
  workerId: number | null;
  requiresPhoto: boolean;
  weekDays?: number[] | null;
  isRecurring?: boolean;
}

interface DuplicateTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DuplicateTaskDialog({ task, open, onOpenChange }: DuplicateTaskDialogProps) {
  const [, setLocation] = useLocation();
  const createTask = useCreateTask();
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

  // Заполняем форму данными задачи при открытии
  useEffect(() => {
    if (task && open) {
      // Получаем weekDays и преобразуем в массив если нужно
      let weekDaysArray: number[] | null = null;
      if (task.weekDays) {
        if (Array.isArray(task.weekDays)) {
          weekDaysArray = task.weekDays;
        }
      }

      form.reset({
        title: task.title,
        workerId: task.workerId ? task.workerId.toString() : undefined,
        requiresPhoto: task.requiresPhoto ?? false,
        weekDays: weekDaysArray,
        isRecurring: task.isRecurring ?? true,
      });
    }
  }, [task, open, form]);

  const onSubmit = (values: FormValues) => {
    const taskData = {
      title: values.title,
      workerId: values.workerId,
      requiresPhoto: values.requiresPhoto ?? false,
      weekDays: values.weekDays && values.weekDays.length > 0 ? values.weekDays : null,
      isRecurring: values.isRecurring ?? true,
    };
    createTask.mutate(taskData as any, {
      onSuccess: () => {
        toast({
          title: "Успешно",
          description: "Задача создана",
        });
        onOpenChange(false);
      },
      onError: (error: any) => {
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось создать задачу",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Дублировать задачу
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Что нужно сделать?"
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
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name || user.phone}
                        </SelectItem>
                      ))}
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/50 p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer text-sm">
                      Добавить фото результатов
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="weekDays"
              render={({ field }) => (
                <FormItem className="rounded-md border border-border/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <FormLabel className="text-sm font-medium">Дни недели</FormLabel>
                  </div>
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border/50 p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer flex items-center gap-2 text-sm">
                      <RefreshCw className="w-4 h-4" />
                      Повторяющаяся задача
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="flex-1 border border-border/50"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={createTask.isPending}
                className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
              >
                {createTask.isPending ? "Создание..." : "Создать"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
