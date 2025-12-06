"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import Link from "next/link";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    amount: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/payments");
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amount = parseInt(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Введите корректную сумму");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ошибка при создании заявки");
        return;
      }

      setFormData({ amount: "" });
      fetchPayments();
      alert("Заявка на пополнение создана. Администратор обработает её после перевода.");
    } catch (err) {
      setError("Произошла ошибка при создании заявки");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <Navbar />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Пополнение баланса
          </span>
        </h1>

        <div className="glass rounded-2xl border border-white/10 p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Создать заявку на пополнение</h2>
          <p className="text-sm text-slate-400 mb-6">
            После перевода средств администратор зачислит баллы на ваш счет.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">
                Сумма (баллы)
              </label>
              <input
                id="amount"
                type="number"
                required
                min="1"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600"
                placeholder="100"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl hover:from-indigo-400 hover:to-cyan-400 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            >
              {submitting ? "Создание..." : "Создать заявку"}
            </button>
          </form>
        </div>

        <div className="glass rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white">Мои заявки</h2>
          </div>
          {loading ? (
            <div className="p-6 text-center text-slate-400">Загрузка...</div>
          ) : payments.length === 0 ? (
            <div className="p-6 text-center text-slate-400">У вас пока нет заявок</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
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
                      Примечание
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                        {payment.amount} баллов
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
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {payment.adminNote || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

