import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle } from "lucide-react";
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
      <div className="login-page">
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
    <div className="login-page">
      {/* Header with logo */}
      <div className="login-header">
        {/* Compact Icon */}
        <div className="login-icon">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              <div className="w-8 h-1.5 rounded-full bg-white/70" />
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-white" strokeWidth={2.5} />
              <div className="w-6 h-1.5 rounded-full bg-white/60" />
            </div>
            <div className="flex items-center gap-2">
              <Circle className="w-5 h-5 text-white/60" strokeWidth={2} />
              <div className="w-10 h-1.5 rounded-full bg-white/40" />
            </div>
          </div>
        </div>
        <h1 className="login-title">Ежедневные задачи</h1>
      </div>

      {/* Form Card */}
      <div className="login-form-card">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold text-foreground">
                    Номер телефона
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="xxx xxx xx xx"
                      className="h-14 text-xl font-semibold tracking-wider border-2 border-border rounded-xl px-4 focus:border-primary focus:ring-primary focus:ring-2 transition-all bg-card"
                      value={field.value}
                      onChange={(e) => {
                        let value = e.target.value;
                        let cleaned = value.replace(/^\+?7?/, "");
                        let digits = cleaned.replace(/\D/g, "");
                        if (digits.startsWith("7") && digits.length > 1) {
                          digits = digits.slice(1);
                        }
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
                  <FormMessage className="text-sm mt-1" />
                </FormItem>
              )}
            />

            <button
              type="submit"
              className="ozon-btn ozon-btn-primary w-full text-lg font-bold h-14 rounded-xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-200 active:scale-[0.98]"
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
