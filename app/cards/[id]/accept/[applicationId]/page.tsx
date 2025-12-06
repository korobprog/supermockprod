"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";

export default function AcceptApplicationPage({
  params,
}: {
  params: Promise<{ id: string; applicationId: string }>;
}) {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<any>(null);

  useEffect(() => {
    params.then((p) => {
      setApplicationId(p.applicationId);
      fetchApplication(p.applicationId);
    });
  }, [params]);

  const fetchApplication = async (id: string) => {
    try {
      const response = await fetch(`/api/applications?cardId=${id}`);
      if (response.ok) {
        const data = await response.json();
        const app = data.find((a: any) => a.id === id);
        if (app) {
          setApplication(app);
        }
      }
    } catch (error) {
      console.error("Error fetching application:", error);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ACCEPTED",
        }),
      });

      if (response.ok) {
        router.push(`/cards/${application?.cardId}`);
      } else {
        alert("Ошибка при принятии отклика");
      }
    } catch (error) {
      alert("Ошибка при принятии отклика");
    } finally {
      setLoading(false);
    }
  };

  if (!application) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <Navbar />
        <div className="max-w-2xl mx-auto">
          <div className="glass rounded-2xl border border-white/10 p-8 text-center">
            <p className="text-slate-400">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <Navbar />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Принять отклик
          </span>
        </h1>

        <div className="glass rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            От: {application.applicant.name || application.applicant.email}
          </h2>
          {application.scheduledAt && (
            <p className="text-sm text-slate-400 mb-2">
              Время ответного собеседования:{" "}
              <span className="text-slate-300">{new Date(application.scheduledAt).toLocaleString("ru-RU")}</span>
            </p>
          )}
          <p className="text-sm text-slate-400">
            Статус:{" "}
            <span
              className={`font-medium ${application.status === "PENDING"
                  ? "text-amber-400"
                  : application.status === "ACCEPTED"
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
            >
              {application.status === "PENDING"
                ? "Ожидает подтверждения"
                : application.status === "ACCEPTED"
                  ? "Принят"
                  : "Отменен"}
            </span>
          </p>
        </div>

        <div className="glass rounded-2xl border border-white/10 p-6">
          <p className="text-slate-300 mb-6">
            Приняв этот отклик, вы подтверждаете, что готовы провести собеседование.
          </p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => router.back()}
              className="px-6 py-2.5 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleAccept}
              disabled={loading || application.status === "ACCEPTED"}
              className="px-6 py-2.5 text-sm font-medium text-white bg-emerald-500 rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? "Принятие..." : "Принять отклик"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

