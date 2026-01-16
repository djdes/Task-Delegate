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
import { Upload, X, CheckCircle2, Trash2, RotateCcw, Camera, Check, Coins } from "lucide-react";
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

  React.useEffect(() => {
    if (task) {
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
      if (currentTask) {
        const updatedTask = { ...currentTask, photoUrl: data.photoUrl };
        setCurrentTask(updatedTask);
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
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
    if (confirm("Удалить фотографию?")) {
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
        description: "Сначала загрузите фотографию",
        variant: "destructive",
      });
      return;
    }
    onComplete();
  };

  if (!currentTask) return null;

  const hasPrice = (currentTask as any).price > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg mx-4 rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-primary text-primary-foreground p-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">
              {currentTask.title}
            </DialogTitle>
            {(currentTask as any).description && (
              <DialogDescription className="text-white/80 text-base mt-1">
                {(currentTask as any).description}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        <div className="p-4 space-y-4">
          {/* Price badge */}
          {hasPrice && (
            <div className="price-badge inline-flex">
              <Coins className="w-4 h-4" />
              <span>+{(currentTask as any).price} ₽ за выполнение</span>
            </div>
          )}

          {/* Photo upload section */}
          {(currentTask.requiresPhoto === true || (currentTask.requiresPhoto as any) === 1) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                <span className="text-base font-semibold">Фото результата</span>
                {!currentTask.photoUrl && (
                  <span className="text-xs text-orange-500 font-medium">(обязательно)</span>
                )}
              </div>

              {currentTask.photoUrl ? (
                <div className="relative">
                  <div className="relative inline-block">
                    <img
                      src={currentTask.photoUrl}
                      alt="Фото результатов"
                      className="w-full max-w-xs h-48 object-cover rounded-2xl border-2 border-green-500 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setIsPhotoFullscreen(true)}
                    />
                    <button
                      onClick={handleDeletePhoto}
                      disabled={deletePhotoMutation.isPending}
                      className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-xl hover:bg-destructive/90 transition-colors shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Загружено
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-primary/30 bg-primary/5 rounded-2xl cursor-pointer hover:border-primary hover:bg-primary/10 transition-all active:scale-[0.98]"
                  >
                    {preview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-2xl"
                        />
                        {uploadPhotoMutation.isPending && (
                          <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                          <Camera className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-base font-semibold text-foreground">
                          Сделать фото
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          или выбрать из галереи
                        </p>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-2">
            {canComplete && (
              currentTask.isCompleted ? (
                <button
                  onClick={onComplete}
                  className="ozon-btn ozon-btn-secondary flex items-center justify-center gap-2 w-full"
                >
                  <RotateCcw className="w-5 h-5" />
                  Вернуть в работу
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={currentTask.requiresPhoto && !currentTask.photoUrl}
                  className="ozon-btn ozon-btn-primary flex items-center justify-center gap-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-5 h-5" />
                  {currentTask.requiresPhoto && !currentTask.photoUrl
                    ? "Сначала загрузите фото"
                    : "Завершить задачу"
                  }
                </button>
              )
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="ozon-btn ozon-btn-secondary w-full"
            >
              Закрыть
            </button>
          </div>
        </div>
      </DialogContent>

      {/* Fullscreen photo modal */}
      {isPhotoFullscreen && currentTask?.photoUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center cursor-pointer"
          onClick={() => setIsPhotoFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setIsPhotoFullscreen(false)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={currentTask.photoUrl}
            alt="Фото результатов"
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Dialog>
  );
}
