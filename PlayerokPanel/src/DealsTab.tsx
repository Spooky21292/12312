import React, { useState, useEffect } from 'react';
import { ShoppingCart, ExternalLink, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { PlayerokDealFull } from './types';
import { fetchDeals } from './api';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  COMPLETED: { label: 'Завершена', color: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  PAID: { label: 'Оплачена', color: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300', icon: <Clock className="w-3.5 h-3.5" /> },
  CANCELLED: { label: 'Отменена', color: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300', icon: <XCircle className="w-3.5 h-3.5" /> },
  DISPUTE: { label: 'Спор', color: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  CREATED: { label: 'Создана', color: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400', icon: <Clock className="w-3.5 h-3.5" /> },
};

export default function DealsTab() {
  const [deals, setDeals] = useState<PlayerokDealFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    const data = await fetchDeals(50);
    setDeals(data);
    setLoading(false);
  };

  const filteredDeals = filterStatus === 'all' 
    ? deals 
    : deals.filter(d => d.status === filterStatus);

  const completedCount = deals.filter(d => d.status === 'COMPLETED').length;
  const paidCount = deals.filter(d => d.status === 'PAID').length;
  const cancelledCount = deals.filter(d => d.status === 'CANCELLED').length;
  const totalRevenue = deals
    .filter(d => d.status === 'COMPLETED')
    .reduce((sum, d) => sum + (d.totalPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1e1e1a] rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">ВСЕГО СДЕЛОК</p>
          <h3 className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">{deals.length}</h3>
        </div>
        <div className="bg-white dark:bg-[#1e1e1a] rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">ЗАВЕРШЁННЫХ</p>
          <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</h3>
        </div>
        <div className="bg-white dark:bg-[#1e1e1a] rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-[10px] font-bold tracking-wider text-blue-500 uppercase">ОЖИДАЮТ ПОДТВЕРЖДЕНИЯ</p>
          <h3 className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">{paidCount}</h3>
        </div>
        <div className="bg-white dark:bg-[#1e1e1a] rounded-xl p-4 border border-zinc-200/60 dark:border-zinc-800/60">
          <p className="text-[10px] font-bold tracking-wider text-amber-500 uppercase">ВЫРУЧКА (ЗАВЕРШЁННЫЕ)</p>
          <h3 className="text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1">{totalRevenue.toLocaleString('ru-RU')} <span className="text-zinc-400 text-lg">₽</span></h3>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white dark:bg-[#1e1e1a] rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200/70 dark:border-zinc-800/75 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4.5 h-4.5 text-amber-500" />
            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Сделки (Заказы покупателей)</span>
            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-mono">{filteredDeals.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="h-8 px-3 text-xs bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300 cursor-pointer focus:outline-none"
            >
              <option value="all">Все статусы</option>
              <option value="COMPLETED">Завершённые</option>
              <option value="PAID">Оплаченные</option>
              <option value="CANCELLED">Отменённые</option>
              <option value="DISPUTE">Споры</option>
            </select>
            <button
              onClick={loadDeals}
              className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
              title="Обновить"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-zinc-400 text-sm">Загрузка сделок...</div>
        ) : filteredDeals.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">
            <ShoppingCart className="w-12 h-12 mx-auto stroke-1 text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-sm font-medium">Сделки не найдены</p>
            <p className="text-xs text-zinc-500/80 mt-1">Убедитесь, что токен авторизации указан в настройках</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-[#252520] text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-200/70 dark:border-zinc-800/70">
                  <th className="px-4 py-3">Товар</th>
                  <th className="px-3 py-3 text-center">Статус</th>
                  <th className="px-3 py-3 text-center">Покупатель</th>
                  <th className="px-3 py-3 text-center">Сумма</th>
                  <th className="px-3 py-3 text-center">Дата создания</th>
                  <th className="px-3 py-3 text-center">Дата завершения</th>
                  <th className="px-3 py-3 text-center">Ссылка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
                {filteredDeals.map(deal => {
                  const statusInfo = STATUS_MAP[deal.status] || STATUS_MAP.CREATED;
                  return (
                    <tr key={deal.id} className="hover:bg-zinc-50/55 dark:hover:bg-[#1f1f1b]/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          {deal.product?.images?.[0]?.url && (
                            <img src={deal.product.images[0].url} className="w-10 h-10 rounded-lg object-cover" alt="" />
                          )}
                          <div>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">{deal.product?.name || 'Без названия'}</span>
                            <span className="text-[10px] text-zinc-400 font-mono block">ID: {deal.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {deal.buyer?.avatar?.url && (
                            <img src={deal.buyer.avatar.url} className="w-6 h-6 rounded-full" alt="" />
                          )}
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{deal.buyer?.username || '—'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-center font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {deal.totalPrice ? `${deal.totalPrice.toLocaleString('ru-RU')} ₽` : '—'}
                      </td>
                      <td className="px-3 py-3.5 text-center text-xs text-zinc-500 font-mono">
                        {deal.createdAt ? new Date(deal.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-3 py-3.5 text-center text-xs text-zinc-500 font-mono">
                        {deal.completedAt ? new Date(deal.completedAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {deal.product?.slug && (
                          <a
                            href={`https://playerok.com/products/${deal.product.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Открыть
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
