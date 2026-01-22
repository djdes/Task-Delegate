import { Link, useSearch } from "wouter";
import { ArrowLeft, Building2, UserPlus, ChevronRight } from "lucide-react";

export default function Register() {
  // Получаем номер телефона из URL параметра
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const phone = params.get("phone") || "";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary via-primary to-primary/90">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
      </div>

      {/* Header */}
      <div className="relative pt-12 pb-10 px-6">
        <div className="max-w-md mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-8">
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </Link>

          <h1 className="text-3xl font-bold text-white mb-3">
            Регистрация
          </h1>
          <p className="text-white/70">
            Выберите тип регистрации
          </p>
        </div>
      </div>

      {/* Options Card */}
      <div className="relative flex-1 bg-background rounded-t-[40px] px-6 pt-10 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="max-w-md mx-auto flex flex-col gap-6">
          {/* Create Company */}
          <Link href={phone ? `/register/company?phone=${encodeURIComponent(phone)}` : "/register/company"}>
            <div className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground mb-1">
                    Создание компании
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Зарегистрируйте новую компанию и станьте её администратором
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
              </div>
            </div>
          </Link>

          {/* Join Company */}
          <Link href={phone ? `/register/user?phone=${encodeURIComponent(phone)}` : "/register/user"}>
            <div className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center group-hover:from-emerald-500/30 group-hover:to-emerald-500/20 transition-all duration-300">
                  <UserPlus className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground mb-1">
                    Присоединиться к компании
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Зарегистрируйтесь как сотрудник существующей компании
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
              </div>
            </div>
          </Link>

          {/* Divider with text */}
          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">или</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Back to login link */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Уже есть аккаунт?{" "}
              <Link href="/" className="text-primary font-medium hover:underline">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
