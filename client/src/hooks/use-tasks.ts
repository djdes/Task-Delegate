import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertTask } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useTasks() {
  return useQuery({
    queryKey: [api.tasks.list.path],
    queryFn: async () => {
      const res = await fetch(api.tasks.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return api.tasks.list.responses[200].parse(await res.json());
    },
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: [api.tasks.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      const url = buildUrl(api.tasks.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch task");
      // Не используем parse чтобы сохранить weekDays как массив
      return await res.json();
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertTask) => {
      // Coerce workerId to number if it comes from a string select value
      const payload = {
        ...data,
        workerId: data.workerId ? Number(data.workerId) : undefined,
        requiresPhoto: data.requiresPhoto !== undefined ? Boolean(data.requiresPhoto) : false,
        weekDays: data.weekDays || null,
      };

      console.log("useCreateTask - payload:", payload);
      const validated = api.tasks.create.input.parse(payload);
      console.log("useCreateTask - validated:", validated);
      
      const res = await fetch(api.tasks.create.path, {
        method: api.tasks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.tasks.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create task");
      }
      return api.tasks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      toast({ title: "Success", description: "Task created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertTask>) => {
      // Coerce workerId if present
      const payload = {
        ...updates,
        workerId: updates.workerId ? Number(updates.workerId) : updates.workerId,
        weekDays: updates.weekDays !== undefined ? updates.weekDays : undefined,
      };

      console.log("useUpdateTask - payload:", payload);
      const validated = api.tasks.update.input.parse(payload);
      console.log("useUpdateTask - validated:", validated);
      const url = buildUrl(api.tasks.update.path, { id });
      
      const res = await fetch(url, {
        method: api.tasks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update task");
      return api.tasks.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      toast({ title: "Success", description: "Task updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.tasks.delete.path, { id });
      const res = await fetch(url, { 
        method: api.tasks.delete.method, 
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to delete task");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      toast({ title: "Success", description: "Task deleted successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.tasks.complete.path, { id }), {
        method: api.tasks.complete.method,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Не удалось завершить задачу");
      }
      return api.tasks.complete.responses[200].parse(await res.json());
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, task.id] });
      toast({ title: "Готово", description: "Задача отмечена выполненной" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message || "Не удалось завершить задачу", variant: "destructive" });
    },
  });
}

export function useUncompleteTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/tasks/${id}/uncomplete`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Accept": "application/json",
        },
      });

      const text = await res.text();
      let data: any = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          // Если не JSON, игнорируем
        }
      }

      if (!res.ok) {
        throw new Error(data.message || "Не удалось вернуть задачу");
      }

      return data;
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      if (task?.id) {
        queryClient.invalidateQueries({ queryKey: [api.tasks.get.path, task.id] });
      }
      toast({ title: "Готово", description: "Задача возвращена в работу" });
    },
    onError: (error: any) => {
      toast({ title: "Ошибка", description: error.message || "Не удалось вернуть задачу", variant: "destructive" });
    },
  });
}
