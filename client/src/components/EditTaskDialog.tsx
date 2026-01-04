import { useEffect } from "react";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useWorkers } from "@/hooks/use-workers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { insertTaskSchema, type Task } from "@shared/schema";
import { z } from "zod";

const formSchema = insertTaskSchema.extend({
  workerId: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
});

type FormValues = z.input<typeof formSchema>;

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({ task, open, onOpenChange }: EditTaskDialogProps) {
  const updateTask = useUpdateTask();
  const { data: workers = [] } = useWorkers();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      workerId: task.workerId ? task.workerId.toString() : undefined,
    },
  });

  useEffect(() => {
    form.reset({
      title: task.title,
      workerId: task.workerId ? task.workerId.toString() : undefined,
    });
  }, [task, form]);

  const onSubmit = (values: FormValues) => {
    updateTask.mutate(
      { id: task.id, ...values as any },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-card">
        <DialogHeader>
          <DialogTitle className="font-display text-slate-900">Редактирование задачи</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-medium">Название задачи</FormLabel>
                  <FormControl>
                    <Input 
                      className="premium-input" 
                      data-testid="input-edit-task-title"
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
                  <FormLabel className="text-slate-700 font-medium">Исполнитель</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="premium-input w-full" data-testid="select-edit-worker">
                        <SelectValue placeholder="Выберите сотрудника..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker.id} value={worker.id.toString()}>
                          {worker.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={updateTask.isPending}
                className="w-full bg-slate-900 hover:bg-black text-white"
                data-testid="button-save-task"
              >
                {updateTask.isPending ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
