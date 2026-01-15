import { useLocation } from "wouter";
import { useCreateWorker } from "@/hooks/use-workers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, UserPlus } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

export default function CreateWorker() {
  const [, setLocation] = useLocation();
  const createWorker = useCreateWorker();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof insertWorkerSchema>>({
    resolver: zodResolver(insertWorkerSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof insertWorkerSchema>) => {
    createWorker.mutate(values, {
      onSuccess: () => {
        toast({
          title: "Успешно",
          description: "Сотрудник создан",
        });
        setLocation("/");
      },
      onError: (error: any) => {
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось создать сотрудника",
          variant: "destructive",
        });
      },
    });
  };

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
              <UserPlus className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Новый сотрудник</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[60px]">Добавьте нового сотрудника в систему</p>
        </div>

        <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Имя</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Введите имя сотрудника" 
                      className="things-input"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
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
                  disabled={createWorker.isPending}
                  className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
                >
                  {createWorker.isPending ? "Создание..." : "Создать"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
