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
import { Upload, X, CheckCircle2, Trash2, RotateCcw, Camera, Check, Coins, ImageIcon, MessageSquare } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import type { Task } from "@shared/schema";

interface TaskViewDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (comment?: string) => void;
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
  const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState(0);
  const [isExamplePhotoFullscreen, setIsExamplePhotoFullscreen] = useState(false);
  const [userComment, setUserComment] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Получаем массив фотографий из задачи
  const getPhotoUrls = (t: Task | null): string[] => {
    if (!t) return [];
    const urls = (t as any).photoUrls;
    if (Array.isArray(urls) && urls.length > 0) return urls;
    // Обратная совместимость со старым полем photoUrl
    if (t.photoUrl) return [t.photoUrl];
    return [];
  };

  const photoUrls = getPhotoUrls(currentTask);
  const canAddMorePhotos = photoUrls.length < 10;

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
    onSuccess: async (data: { photoUrl: string; photoUrls: string[] }) => {
      if (currentTask) {
        const updatedTask = {
          ...currentTask,
          photoUrl: data.photoUrl,
          photoUrls: data.photoUrls,
        } as Task;
        setCurrentTask(updatedTask);
        if (onTaskUpdate) {
          onTaskUpdate(updatedTask);
        }
      }
      await queryClient.invalidateQueries({ queryKey: ["tasks"] });
      await queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      toast({
        title: "Успешно",
        description: `Фотография загружена (${data.photoUrls.length}/10)`,
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
    mutationFn: async (photoUrl: string) => {
      if (!currentTask) throw new Error("Задача не выбрана");

      const response = await fetch(`/api/tasks/${currentTask.id}/photo?url=${encodeURIComponent(photoUrl)}`, {
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
    onSuccess: async (data: { success: boolean; photoUrls: string[] }) => {
      if (currentTask) {
        const lastPhotoUrl = data.photoUrls.length > 0 ? data.photoUrls[data.photoUrls.length - 1] : null;
        const updatedTask = {
          ...currentTask,
          photoUrl: lastPhotoUrl,
          photoUrls: data.photoUrls,
        } as Task;
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

  const handleDeletePhoto = (photoUrl: string) => {
    if (confirm("Удалить фотографию?")) {
      deletePhotoMutation.mutate(photoUrl);
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
    if (currentTask?.requiresPhoto && photoUrls.length === 0) {
      toast({
        title: "Ошибка",
        description: "Сначала загрузите фотографию",
        variant: "destructive",
      });
      return;
    }
    onComplete(userComment || undefined);
    setUserComment("");
  };

  if (!currentTask) return null;

  const hasPrice = (currentTask as any).price > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 border-0">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary to-primary/90 text-white px-5 py-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white pr-8">
              {currentTask.title}
            </DialogTitle>
            {(currentTask as any).description && (
              <DialogDescription className="text-white/80 text-sm mt-1">
                {(currentTask as any).description}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Price badge in header */}
          {hasPrice && (
            <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
              <Coins className="w-4 h-4 text-yellow-300" />
              <span>+{(currentTask as any).price} ₽</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Example photo button - shown if examplePhotoUrl exists */}
          {(currentTask as any).examplePhotoUrl && (
            <button
              type="button"
              onClick={() => setIsExamplePhotoFullscreen(true)}
              className="flex items-center gap-2 w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Посмотреть пример фото</span>
            </button>
          )}

          {/* Photo upload section */}
          {(currentTask.requiresPhoto === true || (currentTask.requiresPhoto as any) === 1) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Фото результата</span>
                {photoUrls.length === 0 && (
                  <span className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-0.5 rounded-full">обязательно</span>
                )}
                {photoUrls.length > 0 && (
                  <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">{photoUrls.length}/10</span>
                )}
              </div>

              {/* Uploaded photos grid */}
              {photoUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photoUrls.map((url, index) => (
                    <div key={url} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`Фото ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border-2 border-green-500 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => {
                          setFullscreenPhotoIndex(index);
                          setIsPhotoFullscreen(true);
                        }}
                      />
                      <button
                        onClick={() => handleDeletePhoto(url)}
                        disabled={deletePhotoMutation.isPending}
                        className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add more photos button */}
              {canAddMorePhotos && (
                <div>
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
                    className={`flex flex-col items-center justify-center w-full ${photoUrls.length > 0 ? 'h-20' : 'h-32'} border-2 border-dashed border-primary/40 bg-primary/5 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/10 transition-all active:scale-[0.99]`}
                  >
                    {preview ? (
                      <div className="relative w-full h-full">
                        <img
                          src={preview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-xl"
                        />
                        {uploadPhotoMutation.isPending && (
                          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className={`${photoUrls.length > 0 ? 'w-8 h-8' : 'w-12 h-12'} rounded-full bg-primary/10 flex items-center justify-center mb-1`}>
                          <Camera className={`${photoUrls.length > 0 ? 'w-4 h-4' : 'w-6 h-6'} text-primary`} />
                        </div>
                        <p className="text-sm font-semibold text-foreground">
                          {photoUrls.length > 0 ? 'Добавить ещё фото' : 'Добавить фото'}
                        </p>
                        {photoUrls.length === 0 && (
                          <p className="text-xs text-muted-foreground">камера или галерея</p>
                        )}
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          )}

          {/* User comment field */}
          {canComplete && !currentTask.isCompleted && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Комментарий</span>
                <span className="text-xs text-muted-foreground">(необязательно)</span>
              </div>
              <Textarea
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Добавьте комментарий к выполненной задаче..."
                className="min-h-[80px] resize-none"
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 pt-1">
            {canComplete && (
              currentTask.isCompleted ? (
                <button
                  onClick={onComplete}
                  className="flex items-center justify-center gap-2 w-full h-12 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-semibold transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Вернуть в работу
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={currentTask.requiresPhoto && photoUrls.length === 0}
                  className="flex items-center justify-center gap-2 w-full h-12 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-500/20"
                >
                  <Check className="w-5 h-5" />
                  {currentTask.requiresPhoto && photoUrls.length === 0
                    ? "Сначала загрузите фото"
                    : "Завершить задачу"
                  }
                </button>
              )
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="w-full h-11 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl font-medium transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </DialogContent>

      {/* Fullscreen photo modal with navigation */}
      {isPhotoFullscreen && photoUrls.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center cursor-pointer"
          onClick={() => setIsPhotoFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            onClick={() => setIsPhotoFullscreen(false)}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation arrows */}
          {photoUrls.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenPhotoIndex(prev => prev > 0 ? prev - 1 : photoUrls.length - 1);
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenPhotoIndex(prev => prev < photoUrls.length - 1 ? prev + 1 : 0);
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Photo counter */}
          {photoUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {fullscreenPhotoIndex + 1} / {photoUrls.length}
            </div>
          )}

          <img
            src={photoUrls[fullscreenPhotoIndex]}
            alt={`Фото ${fullscreenPhotoIndex + 1}`}
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Fullscreen example photo modal */}
      {isExamplePhotoFullscreen && (currentTask as any)?.examplePhotoUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center cursor-pointer"
          onClick={() => setIsExamplePhotoFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setIsExamplePhotoFullscreen(false)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="text-center">
            <p className="text-white/80 text-sm mb-4">Пример выполненной задачи</p>
            <img
              src={(currentTask as any).examplePhotoUrl}
              alt="Пример фото"
              className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
}
