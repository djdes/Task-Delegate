import { Link } from "wouter";
import { ArrowLeft, Building2, UserPlus } from "lucide-react";

export default function Register() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary via-primary to-primary/90">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative pt-12 pb-8 px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Назад</span>
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2">
          Регистрация
        </h1>
        <p className="text-white/70 text-sm">
          Выберите тип регистрации
        </p>
      </div>

      {/* Options Card */}
      <div className="relative flex-1 bg-background rounded-t-[40px] px-6 pt-8 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="max-w-md mx-auto space-y-4">
          {/* Create Company */}
          <Link href="/register/company">
            <div className="p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Building2 className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    Создание компании
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Зарегистрируйте новую компанию и станьте её администратором
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* Join Company */}
          <Link href="/register/user">
            <div className="p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <UserPlus className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    Присоединиться к компании
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Зарегистрируйтесь как сотрудник существующей компании
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
