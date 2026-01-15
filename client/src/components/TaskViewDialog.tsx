import { useState, useRef, useEffect } from "react";
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, CheckCircle2, Trash2, RotateCcw } from "lucide-react";
import type { Task } from "@shared/schema";

interface TaskViewDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  canComplete: boolean;
  onTaskUpdate?: (updatedTask: Task) => void;
}

export function TaskViewDialog({
  task,
  open,
  onOpenChange,
  onComplete,
  canComplete,
  onTaskUpdate,
}: TaskViewDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentTask, setCurrentTask] = useState<Task | null>(task);
  const [isPhotoFullscreen, setIsPhotoFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Обновляем текущую задачу когда task меняется
  React.useEffect(() => {
    if (task) {
      // Убеждаемся, что requiresPhoto и photoUrl есть в задаче
      // Если поля отсутствуют, проверяем их наличие в объекте
      // Нормализуем задачу - проверяем все возможные варианты названий полей
      const taskWithDefaults: Task = {
        ...task,
        requiresPhoto: (task as any).requiresPhoto !== undefined 
          ? Boolean((task as any).requiresPhoto) 
          : (task as any).requires_photo !== undefined 
            ? Boolean((task as any).requires_photo)
            : false,
        photoUrl: (task as any).photoUrl !== undefined 
          ? (task as any).photoUrl 
          : (task as any).photo_url ?? null,
      };
      console.log("TaskViewDialog - Original task:", task);
      console.log("TaskViewDialog - Normalized task:", taskWithDefaults);
      console.log("TaskViewDialog - requiresPhoto value:", taskWithDefaults.requiresPhoto, typeof taskWithDefaults.requiresPhoto);
      setCurrentTask(taskWithDefaults);
    } else {
      setCurrentTask(null);
    }
  }, [task]);

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!currentTask) throw new Error("Задача не выбрана");
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("taskId", String(currentTask.id));

      const response = await fetch(`/api/tasks/${currentTask.id}/photo`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        // Пытаемся прочитать json, если нет — текст
        let message = "Ошибка загрузки фото";
        try {
          const error = await response.json();
          message = error.message || message;
        } catch {
          const text = await response.text().catch(() => "");
          if (text) {
            message = text;
          }
        }
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: async (data: { photoUrl: string }) => {
      // Обновляем текущую задачу с новым photoUrl
      if (currentTask) {
        const updatedTask = { ...currentTask, photoUrl: data.photoUrl };
        setCurrentTask(updatedTask);
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask);
        }
      }
      // Инвалидируем кэш задач для обновления списка
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      // Также обновляем кэш конкретной задачи
      if (currentTask) {
        const updatedTask = { ...currentTask, photoUrl: data.photoUrl };
        queryClient.setQueryData([api.tasks.get.path, currentTask.id], updatedTask);
      }
      toast({
        title: "Успешно",
        description: "Фотография загружена",
      });
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось загрузить фотографию",
        variant: "destructive",
      });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async () => {
      if (!currentTask) throw new Error("Задача не выбрана");

      const response = await fetch(`/api/tasks/${currentTask.id}/photo`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Accept": "application/json",
        },
      });

      const text = await response.text();
      let data: any = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          // Если не JSON, игнорируем
        }
      }

      if (!response.ok) {
        throw new Error(data.message || "Ошибка удаления фото");
      }

      return data;
    },
    onSuccess: async () => {
      if (currentTask) {
        const updatedTask = { ...currentTask, photoUrl: null };
        setCurrentTask(updatedTask);
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      toast({
        title: "Успешно",
        description: "Фотография удалена",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить фотографию",
        variant: "destructive",
      });
    },
  });

  const handleDeletePhoto = () => {
    if (confirm("Вы уверены, что хотите удалить фотографию?")) {
      deletePhotoMutation.mutate();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Ошибка",
          description: "Выберите изображение",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      // Автоматически загружаем файл после выбора
      setTimeout(() => {
        uploadPhotoMutation.mutate(file);
      }, 100);
    }
  };

  const handleUpload = () => {
    if (selectedFile && currentTask) {
      uploadPhotoMutation.mutate(selectedFile);
    }
  };

  const handleComplete = () => {
    if (currentTask?.requiresPhoto && !currentTask.photoUrl) {
      toast({
        title: "Ошибка",
        description: "Необходимо загрузить фотографию перед завершением задачи",
        variant: "destructive",
      });
      return;
    }
    onComplete();
  };

  if (!currentTask) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{currentTask.title}</DialogTitle>
          <DialogDescription>
            {currentTask.requiresPhoto
              ? "Для завершения задачи необходимо загрузить фотографию результатов"
              : "Просмотр задачи"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Показываем поле загрузки фото ТОЛЬКО если для задачи включён requiresPhoto */}
          {(currentTask.requiresPhoto === true || (currentTask.requiresPhoto as any) === 1) && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Фотография результатов
                </label>
                {currentTask.photoUrl ? (
                  <div className="relative">
                    <div className="relative inline-block">
                      <img
                        src={currentTask.photoUrl}
                        alt="Фото результатов"
                        className="w-32 h-32 object-cover rounded-lg border border-border/50 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setIsPhotoFullscreen(true)}
                      />
                      <button
                        onClick={handleDeletePhoto}
                        disabled={deletePhotoMutation.isPending}
                        className="absolute -top-2 -right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-md"
                        title="Удалить фото"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Фотография загружена (нажмите для просмотра)</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      {preview ? (
                        <div className="relative w-full h-full">
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              setPreview(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                            className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Нажмите для выбора фотографии
                          </p>
                        </>
                      )}
                    </label>
                    {selectedFile && (
                      <Button
                        onClick={handleUpload}
                        disabled={uploadPhotoMutation.isPending}
                        className="w-full"
                      >
                        {uploadPhotoMutation.isPending ? "Загрузка..." : "Загрузить фотографию"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
            {canComplete && (
              currentTask.isCompleted ? (
                <Button
                  variant="secondary"
                  onClick={onComplete}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Вернуть в работу
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={currentTask.requiresPhoto && !currentTask.photoUrl}
                >
                  Завершить задачу
                </Button>
              )
            )}
          </div>
        </div>
      </DialogContent>

      {/* Fullscreen photo modal */}
      {isPhotoFullscreen && currentTask?.photoUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center cursor-pointer"
          onClick={() => setIsPhotoFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setIsPhotoFullscreen(false)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={currentTask.photoUrl}
            alt="Фото результатов"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Dialog>
  );
}
