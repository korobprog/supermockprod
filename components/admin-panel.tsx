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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">
                      {payment.user.name || payment.user.email}
                    </div>
                    <div className="text-sm text-slate-500">{payment.user.email}</div>
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

