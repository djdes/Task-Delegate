import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";
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

  // Если пользователь уже авторизован - перенаправляем на dashboard
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

  // Показываем загрузку пока проверяем авторизацию
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#005bff]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-white/80">Загрузка...</span>
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
    <div className="min-h-screen flex flex-col bg-[#005bff]">
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle2 className="w-10 h-10 text-[#005bff]" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Вход в аккаунт</h1>
        <p className="text-white/80 text-lg">
          Введите номер телефона
        </p>
      </div>

      {/* Form Card */}
      <div className="flex-1 bg-white rounded-t-[32px] px-6 pt-10 pb-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-medium text-gray-700 mb-3 block">
                    Номер телефона
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="xxx xxx xx xx"
                      className="h-16 text-2xl font-medium tracking-wide border-2 border-gray-200 rounded-2xl px-5 focus:border-[#005bff] focus:ring-[#005bff] transition-colors"
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
                  <FormMessage className="text-base mt-2" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-16 text-xl font-semibold bg-[#005bff] hover:bg-[#004de6] rounded-2xl shadow-lg transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? "Вход..." : "Продолжить"}
            </Button>
          </form>
        </Form>

        <p className="mt-8 text-center text-sm text-gray-400 leading-relaxed">
          Нажимая «Продолжить», вы соглашаетесь с условиями использования сервиса
        </p>
      </div>
    </div>
  );
}
