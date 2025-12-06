import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Sparkles, Zap, Users, BookOpen, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-20 right-1/4 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-500" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full glass border border-indigo-500/30">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium text-indigo-300">Подготовка к IT-собеседованиям</span>
              </div>

              {/* Main Title */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Готовься к
                </span>
                <br />
                <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  собеседованиям
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto lg:mx-0 mb-10">
                Платформа для взаимной подготовки к техническим интервью.
                Практикуйся с реальными вопросами и получай обратную связь.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4">
                <Link
                  href="/cards"
                  className="group flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl hover:from-indigo-400 hover:to-cyan-400 transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                >
                  <Zap className="w-5 h-5" />
                  Посмотреть карточки
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/register"
                  className="flex items-center gap-2 px-8 py-4 text-lg font-semibold text-slate-300 glass rounded-xl hover:bg-white/10 transition-all border border-white/20"
                >
                  Начать бесплатно
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
              <div className="relative w-full aspect-square animate-float">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -z-10" />
                <Image
                  src="/hero-image.png"
                  alt="SuperMock Interview Process"
                  fill
                  className="object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={BookOpen}
              title="Карточки заявок"
              description="Удобный матчинг собеседований, с фильтрами профессий и технологий."
            />
            <FeatureCard
              icon={Users}
              title="Взаимная практика"
              description="Практикуйся с другими разработчиками в формате mock-интервью."
            />
            <FeatureCard
              icon={Zap}
              title="Быстрый результат"
              description="Отслеживай прогресс и улучшай навыки с каждым занятием."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="group p-6 glass rounded-2xl hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-indigo-500/50">
      <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 mb-4 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-indigo-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </div>
  );
}

