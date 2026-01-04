import { useState } from "react";
import { useCreateWorker } from "@/hooks/use-workers";
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
import { Plus, UserPlus } from "lucide-react";
import { z } from "zod";
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
import { insertWorkerSchema } from "@shared/schema";

export function CreateWorkerDialog() {
  const [open, setOpen] = useState(false);
  const createWorker = useCreateWorker();

  const form = useForm<z.infer<typeof insertWorkerSchema>>({
    resolver: zodResolver(insertWorkerSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof insertWorkerSchema>) => {
    createWorker.mutate(values, {
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
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-200"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Add New Worker
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-card border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display text-indigo-950">Add Worker</DialogTitle>
          <DialogDescription>
            Create a new team member profile to assign tasks to.
          </DialogDescription>
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
                    <Input 
                      placeholder="e.g. Sarah Miller" 
                      className="premium-input"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={createWorker.isPending}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-xl"
              >
                {createWorker.isPending ? "Creating..." : "Create Worker Profile"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
