"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, User, LogOut, Settings, CreditCard, LayoutDashboard } from "lucide-react";

export function Navbar() {
  const { data: session, status, update } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      // Выходим из сессии
      await signOut({ 
        redirect: false 
      });
      
      // Принудительно обновляем сессию
      await update();
      
      // Перезагружаем страницу для гарантированного обновления
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      window.location.href = "/";
    }
  };

  // Проверяем не только status, но и наличие пользователя в сессии
  // status может быть: "loading" | "authenticated" | "unauthenticated"
  // Важно: после выхода status может быть "authenticated", но session.user будет null
  const isAuthenticated = status === "authenticated" && session?.user !== null && session?.user !== undefined;
  const isLoading = status === "loading";

  const navLinks = [
    { href: "/cards", label: "Карточки" },
    ...(isAuthenticated ? [
      { href: "/dashboard", label: "Личный кабинет", icon: LayoutDashboard },
      { href: "/payments", label: "Пополнение", icon: CreditCard },
    ] : []),
    ...((isAuthenticated && (session?.user as any)?.role === "ADMIN") ? [
      { href: "/admin", label: "Админ панель", icon: Settings },
    ] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent hover:from-indigo-300 hover:to-cyan-300 transition-all"
            >
              <span className="text-2xl">⚡</span>
              SuperMock
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex md:items-center md:gap-3">
            {isLoading ? (
              <div className="px-4 py-2 text-sm text-slate-400">Загрузка...</div>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm text-slate-300">{session.user?.name || session.user?.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg hover:from-indigo-400 hover:to-cyan-400 transition-all shadow-lg shadow-indigo-500/25"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass border-t border-white/10">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {link.icon && <link.icon className="w-5 h-5" />}
                {link.label}
              </Link>
            ))}

            <div className="border-t border-white/10 pt-4 mt-4">
              {isLoading ? (
                <div className="px-4 py-2 text-sm text-slate-400">Загрузка...</div>
              ) : isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400">
                    <User className="w-4 h-4" />
                    {session.user?.name || session.user?.email}
                  </div>
                  <button
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await handleSignOut();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Выйти
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    Войти
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg hover:from-indigo-400 hover:to-cyan-400 transition-all"
                  >
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

