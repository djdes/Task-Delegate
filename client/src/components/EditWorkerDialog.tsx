import { useEffect } from "react";
import { useUpdateWorker } from "@/hooks/use-workers";
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
import { insertWorkerSchema, type Worker } from "@shared/schema";
import { z } from "zod";

interface EditWorkerDialogProps {
  worker: Worker;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWorkerDialog({ worker, open, onOpenChange }: EditWorkerDialogProps) {
  const updateWorker = useUpdateWorker();

  const form = useForm<z.infer<typeof insertWorkerSchema>>({
    resolver: zodResolver(insertWorkerSchema),
    defaultValues: {
      name: worker.name,
    },
  });

  useEffect(() => {
    form.reset({ name: worker.name });
  }, [worker, form]);

  const onSubmit = (values: z.infer<typeof insertWorkerSchema>) => {
    updateWorker.mutate(
      { id: worker.id, ...values },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Редактировать сотрудника</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input 
                      className="things-input" 
                      data-testid="input-edit-worker-name"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button 
                type="submit" 
                disabled={updateWorker.isPending}
                data-testid="button-save-worker"
              >
                {updateWorker.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
