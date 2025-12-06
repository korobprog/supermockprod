"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Payment {
  id: string;
  amount: number;
  status: string;
  adminNote: string | null;
  createdAt: string | Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    telegram: string | null;
    discord: string | null;
    whatsapp: string | null;
  };
}

interface AdminPanelProps {
  payments: Payment[];
}

export function AdminPanel({ payments: initialPayments }: AdminPanelProps) {
  const router = useRouter();
  const [payments, setPayments] = useState(initialPayments);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredPayments =
    selectedStatus === "all"
      ? payments
      : payments.filter((p) => p.status === selectedStatus);

  const handleUpdatePayment = async (
    paymentId: string,
    status: "APPROVED" | "REJECTED",
    note?: string
  ) => {
    setProcessing(paymentId);
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNote: note || undefined,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setPayments((prev) =>
          prev.map((p) => (p.id === paymentId ? updated : p))
        );
        router.refresh();
      } else {
        alert("Ошибка при обновлении платежа");
      }
    } catch (error) {
      alert("Ошибка при обновлении платежа");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Платежи</h2>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          >
            <option value="all">Все</option>
            <option value="PENDING">Ожидают</option>
            <option value="APPROVED">Одобрены</option>
            <option value="REJECTED">Отклонены</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Пользователь
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Сумма
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Статус
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Дата
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  Платежи не найдены
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">
                      {payment.user.name || payment.user.email}
                    </div>
                    <div className="text-sm text-slate-500">{payment.user.email}</div>
                    {(payment.user.telegram || payment.user.discord || payment.user.whatsapp) && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {payment.user.telegram && (
                          <a
                            href={`https://t.me/${payment.user.telegram.replace(/^@/, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors group"
                            title={`Telegram: ${payment.user.telegram}`}
                          >
                            <svg
                              className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.053 5.56-5.023c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                            </svg>
                            <span className="text-xs text-cyan-300">{payment.user.telegram.replace(/^@/, "")}</span>
                          </a>
                        )}
                        {payment.user.discord && (
                          <div
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30"
                            title={`Discord: ${payment.user.discord}`}
                          >
                            <svg
                              className="w-3.5 h-3.5 text-indigo-400"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                            <span className="text-xs text-indigo-300">{payment.user.discord}</span>
                          </div>
                        )}
                        {payment.user.whatsapp && (
                          <a
                            href={`https://wa.me/${payment.user.whatsapp.replace(/[^\d+]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors group"
                            title={`WhatsApp: ${payment.user.whatsapp}`}
                          >
                            <svg
                              className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-300"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <span className="text-xs text-emerald-300">WhatsApp</span>
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-300">{payment.amount} баллов</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-lg border ${payment.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : payment.status === "APPROVED"
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                            : "bg-red-500/20 text-red-300 border-red-500/30"
                        }`}
                    >
                      {payment.status === "PENDING"
                        ? "Ожидает"
                        : payment.status === "APPROVED"
                          ? "Одобрен"
                          : "Отклонен"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {new Date(payment.createdAt).toLocaleString("ru-RU")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {payment.status === "PENDING" && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleUpdatePayment(payment.id, "APPROVED")}
                          disabled={processing === payment.id}
                          className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50 transition-colors"
                        >
                          {processing === payment.id ? "Обработка..." : "Одобрить"}
                        </button>
                        <button
                          onClick={() => {
                            const note = prompt("Причина отклонения (необязательно):");
                            handleUpdatePayment(payment.id, "REJECTED", note || undefined);
                          }}
                          disabled={processing === payment.id}
                          className="text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                        >
                          {processing === payment.id ? "Обработка..." : "Отклонить"}
                        </button>
                      </div>
                    )}
                    {payment.adminNote && (
                      <div className="text-xs text-slate-500 mt-1">
                        Примечание: {payment.adminNote}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

