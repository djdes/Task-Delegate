import { useState } from "react";
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
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "+7",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      await login(values.phone);
      toast({
        title: "Успешно",
        description: "Вы успешно авторизовались",
      });
      setLocation("/");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Вход</h1>
            <p className="text-muted-foreground text-sm">
              Введите номер телефона для входа
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер телефона</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="xxxxxxxxx"
                      className="things-input"
                      value={field.value}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Убеждаемся, что начинается с +7
                        if (!value.startsWith("+7")) {
                          value = "+7" + value.replace(/^\+?7?/, "");
                        }
                        // Удаляем все кроме цифр после +7
                        const digits = value.slice(2).replace(/\D/g, "");
                        // Ограничиваем до 10 цифр
                        const limitedDigits = digits.slice(0, 10);
                        field.onChange("+7" + limitedDigits);
                      }}
                      onKeyDown={(e) => {
                        // Запрещаем удаление +7
                        if (e.key === "Backspace") {
                          const cursorPos = (e.target as HTMLInputElement).selectionStart || 0;
                          if (cursorPos <= 2) {
                            e.preventDefault();
                            return;
                          }
                        }
                        // Запрещаем удаление через Delete если курсор перед +7
                        if (e.key === "Delete") {
                          const cursorPos = (e.target as HTMLInputElement).selectionStart || 0;
                          if (cursorPos < 2) {
                            e.preventDefault();
                            return;
                          }
                        }
                      }}
                      onFocus={(e) => {
                        // Если поле пустое или только +7, устанавливаем курсор после +7
                        if (field.value === "+7" || field.value === "") {
                          setTimeout(() => {
                            e.target.setSelectionRange(2, 2);
                          }, 0);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Вход..." : "Войти"}
              </Button>
            </form>
          </Form>

          <div className="text-center pt-4 border-t border-border/50">
            <button
              onClick={() => setLocation("/")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Продолжить без авторизации
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
