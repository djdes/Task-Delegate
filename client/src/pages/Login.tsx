import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
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
import { z } from "zod";
import { loginSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const formSchema = loginSchema;

type FormValues = z.infer<typeof formSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, authLoading, setLocation]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "+7",
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-base text-white/80">Загрузка...</span>
        </div>
      </div>
    );
  }

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await login(values.phone);
      toast({
        title: "Успешно",
        description: "Вы успешно авторизовались",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Пользователь с таким номером не найден",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-primary">
      {/* Header */}
      <div className="pt-16 pb-10 px-6 text-center">
        {/* Premium Icon */}
        <div className="relative w-28 h-28 mx-auto mb-6">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 to-white/10 blur-xl" />
          {/* Main container */}
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-white/30 to-white/5 backdrop-blur-sm border border-white/30 shadow-2xl flex items-center justify-center overflow-hidden">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
            {/* Task list visual */}
            <div className="relative flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-white drop-shadow-lg" />
                <div className="w-10 h-2 rounded-full bg-white/60" />
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-white drop-shadow-lg" />
                <div className="w-8 h-2 rounded-full bg-white/60" />
              </div>
              <div className="flex items-center gap-2">
                <Circle className="w-6 h-6 text-white/70 drop-shadow-lg" />
                <div className="w-12 h-2 rounded-full bg-white/40" />
              </div>
            </div>
            {/* Sparkle accent */}
            <Sparkles className="absolute top-2 right-2 w-5 h-5 text-yellow-300 drop-shadow-lg" />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-white">Ежедневные платные задачи</h1>
      </div>

      {/* Form Card */}
      <div className="flex-1 bg-background rounded-t-[32px] px-6 pt-10 pb-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-foreground mb-2 block">
                    Номер телефона
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="xxx xxx xx xx"
                      className="h-14 text-xl font-medium tracking-wide border-2 border-border rounded-2xl px-5 focus:border-primary focus:ring-primary transition-colors bg-card"
                      value={field.value}
                      onChange={(e) => {
                        let value = e.target.value;
                        if (!value.startsWith("+7")) {
                          value = "+7" + value.replace(/^\+?7?/, "");
                        }
                        const digits = value.slice(2).replace(/\D/g, "");
                        const limitedDigits = digits.slice(0, 10);
                        field.onChange("+7" + limitedDigits);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          const cursorPos = (e.target as HTMLInputElement).selectionStart || 0;
                          if (cursorPos <= 2) {
                            e.preventDefault();
                            return;
                          }
                        }
                        if (e.key === "Delete") {
                          const cursorPos = (e.target as HTMLInputElement).selectionStart || 0;
                          if (cursorPos < 2) {
                            e.preventDefault();
                            return;
                          }
                        }
                      }}
                      onFocus={(e) => {
                        if (field.value === "+7" || field.value === "") {
                          setTimeout(() => {
                            e.target.setSelectionRange(2, 2);
                          }, 0);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-sm mt-2" />
                </FormItem>
              )}
            />

            <button
              type="submit"
              className="ozon-btn ozon-btn-primary w-full text-lg"
              disabled={isLoading}
            >
              {isLoading ? "Вход..." : "Войти"}
            </button>
          </form>
        </Form>

      </div>
    </div>
  );
}
