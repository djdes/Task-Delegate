import { useState } from "react";
import { useCreateTask } from "@/hooks/use-tasks";
import { useWorkers } from "@/hooks/use-workers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList } from "lucide-react";
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

const formSchema = insertTaskSchema.extend({
  workerId: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
});

type FormValues = z.input<typeof formSchema>;

export function CreateTaskDialog() {
  const [open, setOpen] = useState(false);
  const createTask = useCreateTask();
  const { data: workers = [] } = useWorkers();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      workerId: undefined,
    },
  });

  const onSubmit = (values: FormValues) => {
    createTask.mutate(values as any, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="lg"
          className="w-full bg-slate-800 hover:bg-slate-900 text-white shadow-lg shadow-slate-200"
          data-testid="button-add-task"
        >
          <ClipboardList className="w-5 h-5 mr-2" />
          Создать задачу
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-card border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-slate-900">Новая задача</DialogTitle>
          <DialogDescription>
            Создайте задачу и назначьте исполнителя.
          </DialogDescription>
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
                      placeholder="Например: Подготовить отчёт" 
                      className="premium-input"
                      data-testid="input-task-title"
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
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="premium-input w-full" data-testid="select-worker">
                        <SelectValue placeholder="Выберите сотрудника..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {workers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          Сотрудников нет. Сначала создайте сотрудника!
                        </div>
                      ) : (
                        workers.map((worker) => (
                          <SelectItem key={worker.id} value={worker.id.toString()}>
                            {worker.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createTask.isPending}
                className="w-full bg-slate-900 hover:bg-black text-white font-medium py-2 rounded-xl"
                data-testid="button-submit-task"
              >
                {createTask.isPending ? "Создание..." : "Создать задачу"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
