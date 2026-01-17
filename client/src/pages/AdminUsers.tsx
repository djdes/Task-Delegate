import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, UserPlus, Users, Coins, RotateCcw, Pencil, X, Check } from "lucide-react";
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
import { insertUserSchema, updateUserSchema } from "@shared/schema";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

const formSchema = insertUserSchema.pick({ phone: true, name: true });
const editFormSchema = updateUserSchema;

type FormValues = z.infer<typeof formSchema>;
type EditFormValues = z.infer<typeof editFormSchema>;

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editPhone, setEditPhone] = useState("");
  const [editName, setEditName] = useState("");

  // Проверка прав администратора
  if (!user || !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Доступ запрещен</h1>
          <p className="text-muted-foreground mb-4">Требуются права администратора</p>
          <Button onClick={() => setLocation("/")}>На главную</Button>
        </div>
      </div>
    );
  }

  // Получаем список пользователей
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch(api.users.list.path, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });

  // Мутация для создания пользователя
  const createUserMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await fetch(api.users.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  // Мутация для обновления пользователя
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EditFormValues }) => {
      const response = await fetch(buildUrl(api.users.update.path, { id }), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUserId(null);
    },
  });

  // Мутация для сброса баланса
  const resetBalanceMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}/reset-balance`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset balance");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      name: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    createUserMutation.mutate(values, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  const startEditing = (u: any) => {
    setEditingUserId(u.id);
    setEditPhone(u.phone);
    setEditName(u.name || "");
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditPhone("");
    setEditName("");
  };

  const saveEditing = () => {
    if (editingUserId === null) return;
    updateUserMutation.mutate({
      id: editingUserId,
      data: { phone: editPhone, name: editName || null },
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="max-w-4xl mx-auto p-8">
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
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Управление пользователями</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-[60px]">Добавьте новых пользователей в систему</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Форма добавления пользователя */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl p-8">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Добавить пользователя
            </h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер телефона</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+79263740794"
                          className="things-input"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя (необязательно)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Имя пользователя"
                          className="things-input"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
                >
                  {createUserMutation.isPending ? "Создание..." : "Создать пользователя"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Список пользователей */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-xl p-8">
            <h2 className="text-xl font-semibold mb-6">Список пользователей</h2>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : users.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Нет пользователей</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {users.map((u: any) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {editingUserId === u.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Телефон</label>
                          <Input
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="+79263740794"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Имя</label>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Имя пользователя"
                            className="mt-1"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                            disabled={updateUserMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Отмена
                          </Button>
                          <Button
                            size="sm"
                            onClick={saveEditing}
                            disabled={updateUserMutation.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            {updateUserMutation.isPending ? "Сохранение..." : "Сохранить"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{u.phone}</p>
                          {u.name && (
                            <p className="text-sm text-muted-foreground">{u.name}</p>
                          )}
                          {!u.isAdmin && u.bonusBalance > 0 && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <Coins className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-sm font-medium text-green-600">
                                {u.bonusBalance} ₽
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!u.isAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditing(u)}
                              className="text-xs"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {!u.isAdmin && u.bonusBalance > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Сбросить баланс ${u.bonusBalance} ₽ для ${u.name || u.phone}?`)) {
                                  resetBalanceMutation.mutate(u.id);
                                }
                              }}
                              disabled={resetBalanceMutation.isPending}
                              className="text-xs"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" />
                              Сброс
                            </Button>
                          )}
                          {u.isAdmin && (
                            <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded">
                              Админ
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
