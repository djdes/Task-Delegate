import { useState, useEffect } from "react";
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

  // Reset form when worker changes
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
      <DialogContent className="sm:max-w-[425px] glass-card">
        <DialogHeader>
          <DialogTitle className="font-display text-indigo-950">Edit Worker</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-indigo-900 font-medium">Full Name</FormLabel>
                  <FormControl>
                    <Input className="premium-input" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={updateWorker.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {updateWorker.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
