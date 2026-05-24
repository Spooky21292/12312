import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  ShoppingBag, 
  CircleDollarSign, 
  LineChart, 
  Plus, 
  Minus, 
  Edit, 
  Trash2, 
  Search, 
  X, 
  ChevronDown, 
  Check, 
  Pause, 
  Play, 
  Download, 
  RotateCcw, 
  Info, 
  Calendar, 
  BadgePercent, 
  ShoppingCart, 
  History, 
  Undo2, 
  TrendingUp,
  SlidersHorizontal,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductItem, ItemStatus, SaleRecord } from './types';

const STORAGE_KEY = 'playerok_products_v4';
const LOGS_STORAGE_KEY = 'playerok_sales_logs_v4';

const DEFAULT_PRODUCTS: ProductItem[] = [];

            <div>
              <h1 className="text-base font-bold tracking-tight font-display text-zinc-900 dark:text-zinc-50 leading-tight">Playerok Panel</h1>
  const [items, setItems] = useState<ProductItem[]>([]);
  const [salesLogs, setSalesLogs] = useState<SaleRecord[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'status' | 'cat'>('status');
  const [filterVal, setFilterVal] = useState<string>('all');
  const [sortKey, setSortKey] = useState<keyof ProductItem | 'margin' | 'spent'>('date');
  const [sortDir, setSortDir] = useState<-1 | 1>(-1);
  
  // Form input states
  const [fName, setFName] = useState('');
  const [fCat, setFCat] = useState('Игровые товары');
  const [fBuy, setFBuy] = useState<number | ''>('');
  const [fSell, setFSell] = useState<number | ''>('');
  const [fComm, setFComm] = useState<number>(20);
  const [fQuantity, setFQuantity] = useState<number>(10);
  const [fStatus, setFStatus] = useState<ItemStatus>('active');
  const [isFormOpen, setIsFormOpen] = useState(true);

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);

  // Custom Confirm Dialog State
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Toasts state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' }[]>([]);

  // Initial load
  useEffect(() => {
    let loadedItems: ProductItem[] = [];
    let loadedLogs: SaleRecord[] = [];
    
    try {
      const itemsRaw = localStorage.getItem(STORAGE_KEY);
      if (itemsRaw) {
        loadedItems = JSON.parse(itemsRaw);
      } else {
        loadedItems = DEFAULT_PRODUCTS;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      }
    } catch (e) {
      loadedItems = DEFAULT_PRODUCTS;
    }

    try {
      const logsRaw = localStorage.getItem(LOGS_STORAGE_KEY);
      if (logsRaw) {
        loadedLogs = JSON.parse(logsRaw);
      }
    } catch (e) {
      loadedLogs = [];
    }

    setItems(loadedItems);
    setSalesLogs(loadedLogs);
  }, []);

  // Save changes helper
  const saveItems = (newItems: ProductItem[]) => {
    setItems(newItems);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  };

  const saveLogs = (newLogs: SaleRecord[]) => {
    setSalesLogs(newLogs);
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(newLogs));
  };

  // Toast notifier helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Human date helper
  const getTodayDateString = () => {
    return new Date().toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTodayTimeString = () => {
    return new Date().toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Math helpers
  const getItemMargin = (it: ProductItem): number => {
    // Чистая маржа с 1 шт = Продажа * (1 - Комиссия/100) - Закупка
    const sell = Number(it.sell) || 0;
    const buy = Number(it.buy) || 0;
    const comm = Number(it.comm) || 0;
    return sell * (1 - comm / 100) - buy;
  };

  const getItemSpent = (it: ProductItem): number => {
    // Сколько я потратил всего на этот товар = Закупка * (Количество в наличии + Проданные штуки)
    const buy = Number(it.buy) || 0;
    const totalUnitsBought = (it.quantity || 0) + (it.soldCount || 0);
    return buy * totalUnitsBought;
  };

  // Categories list based on current items
  const uniqueCategories = useMemo(() => {
    const defaultCats = ['Игровые товары', 'Telegram', 'Steam', 'SMM', 'FunPay', 'Другое'];
    const storedCats = items.map(i => i.cat);
    return Array.from(new Set([...defaultCats, ...storedCats]));
  }, [items]);

  // Sidebar counters
  const counters = useMemo(() => {
    const allCount = items.length;
    const activeCount = items.filter(i => i.status === 'active').length;
    const pauseCount = items.filter(i => i.status === 'pause').length;
    
    const catCounts = items.reduce((acc, it) => {
      acc[it.cat] = (acc[it.cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { allCount, activeCount, pauseCount, catCounts };
  }, [items]);

  // Global Financial Statistics
  const globalStats = useMemo(() => {
    let totalInvested = 0; // Общие затраты (Сколько я потратил)
    let totalNetRevenue = 0; // Чистая выручка с проданного (после комиссии Playerok)
    let totalRealizedProfit = 0; // Реальная чистая прибыль (с продаж)
    let warehouseValue = 0; // Оценка стоимости оставшихся товаров на складе (по цене продажи)
    let warehousePotentialProfit = 0; // Потенциальная прибыль с остатков на складе

    items.forEach(it => {
      const margin = getItemMargin(it);
      const spentOnItem = getItemSpent(it);
      
      totalInvested += spentOnItem;
      
      const revenueFromItem = it.soldCount * it.sell * (1 - it.comm / 100);
      totalNetRevenue += revenueFromItem;
      
      const profitFromItem = it.soldCount * margin;
      totalRealizedProfit += profitFromItem;

      const inStockValue = it.quantity * it.sell;
      warehouseValue += inStockValue;

      const potentialProfit = it.quantity * margin;
      warehousePotentialProfit += potentialProfit;
    });

    return {
      totalInvested,
      totalNetRevenue,
      totalRealizedProfit,
      warehouseValue,
      warehousePotentialProfit,
      totalStockUnits: items.reduce((acc, i) => acc + i.quantity, 0),
      totalSoldUnits: items.reduce((acc, i) => acc + i.soldCount, 0),
    };
  }, [items]);

  // --- ACTIONS ---

  // Add Item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) {
      showToast('Введите название товара!', 'error');
      return;
    }

    const buyPrice = fBuy === '' ? 0 : Number(fBuy);
    const sellPrice = fSell === '' ? 0 : Number(fSell);
    const newId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;

    const newItem: ProductItem = {
      id: newId,
      name: fName.trim(),
      cat: fCat,
      status: fStatus,
      buy: buyPrice,
      sell: sellPrice,
      comm: Number(fComm) || 0,
      quantity: Number(fQuantity) || 0,
      soldCount: 0,
      date: getTodayDateString()
    };

    const updated = [...items, newItem];
    saveItems(updated);
    
    // Clear form
    setFName('');
    setFBuy('');
    setFSell('');
    setFQuantity(10);
    
    showToast(`Товар "${newItem.name.substring(0, 20)}..." успешно добавлен!`, 'success');
  };

  // Delete Item
  const handleDeleteItem = (id: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setConfirmModal({
      title: 'Удалить этот товар?',
      message: `Вы действительно хотите безвозвратно удалить товар "${item.name}"? Все накопленные показатели продаж по этой позиции будут потеряны.`,
      confirmText: 'Удалить',
      isDanger: true,
      onConfirm: () => {
        const updated = items.filter(i => i.id !== id);
        saveItems(updated);
        showToast('Товар удален', 'info');
        setConfirmModal(null);
      }
    });
  };

  // Change Status Pill click
  const toggleItemStatus = (id: number) => {
    const updated = items.map(it => {
      if (it.id === id) {
        const nextStatus: ItemStatus = it.status === 'active' ? 'pause' : 'active';
        showToast(`Товар "${it.name.substring(0, 15)}" установлен на статус: ${nextStatus === 'active' ? 'Активен' : 'На паузе'}`, 'info');
        return { ...it, status: nextStatus };
      }
      return it;
    });
    saveItems(updated);
  };

  // Increment and Decrement Stock directly in the row
  const adjustItemQuantity = (id: number, delta: number) => {
    const updated = items.map(it => {
      if (it.id === id) {
        const newQty = Math.max(0, it.quantity + delta);
        return { ...it, quantity: newQty };
      }
      return it;
    });
    saveItems(updated);
  };

  // QUICK SALE BUTTON ACTION: "Я продал данный товар!"
  const handleRecordSale = (id: number) => {
    const targetItem = items.find(i => i.id === id);
    if (!targetItem) return;

    if (targetItem.quantity <= 0) {
      showToast(`Ошибка: "${targetItem.name}" закончился в наличии! Пополните количество.`, 'error');
      return;
    }

    // Deduct 1 from quantity, increment soldCount by 1
    const updatedItems = items.map(it => {
      if (it.id === id) {
        return {
          ...it,
          quantity: it.quantity - 1,
          soldCount: it.soldCount + 1
        };
      }
      return it;
    });

    saveItems(updatedItems);

    // Record Log Entry
    const margin = getItemMargin(targetItem);
    const revenue = targetItem.sell * (1 - targetItem.comm / 100);
    const profit = revenue - targetItem.buy;

    const newLog: SaleRecord = {
      id: Math.random().toString(36).substring(2, 9),
      itemId: targetItem.id,
      itemName: targetItem.name,
      sellPrice: targetItem.sell,
      buyPrice: targetItem.buy,
      commission: targetItem.comm,
      revenue: parseFloat(revenue.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      date: `${getTodayDateString()} в ${getTodayTimeString()}`
    };

    const updatedLogs = [newLog, ...salesLogs].slice(0, 100); // keep last 100 logs
    saveLogs(updatedLogs);

    showToast(`Продан 1 шт. товара: "${targetItem.name.substring(0, 20)}". Чистая прибыль: +${profit.toFixed(1)} ₽! 💸`, 'success');
  };

  // Cancel/Undo Last Sale Log Entry
  const handleUndoSale = (logId: string) => {
    const log = salesLogs.find(l => l.id === logId);
    if (!log) return;

    // Restore item quantity & decrease sold count
    const updatedItems = items.map(it => {
      if (it.id === log.itemId) {
        return {
          ...it,
          quantity: it.quantity + 1,
          soldCount: Math.max(0, it.soldCount - 1)
        };
      }
      return it;
    });

    saveItems(updatedItems);
    saveLogs(salesLogs.filter(l => l.id !== logId));
    showToast(`Продажа за отменена. Товар вернулся в наличие.`, 'info');
  };

  // Edit Modal Saves
  const handleOpenEditModal = (it: ProductItem) => {
    setEditingItem({ ...it });
  };

  const handleSaveEditedItem = () => {
    if (!editingItem) return;
    if (!editingItem.name.trim()) {
      showToast('Название не должно быть пустым!', 'error');
      return;
    }

    const updated = items.map(it => {
      if (it.id === editingItem.id) {
        return editingItem;
      }
      return it;
    });

    saveItems(updated);
    setEditingItem(null);
    showToast('Параметры товара сохранены', 'success');
  };

  // Reset or clear utilities
  const handleClearAll = () => {
    setConfirmModal({
      title: 'Сбросить все товары?',
      message: 'Вы действительно хотите удалить абсолютно все товары со склада и очистить всю зафиксированную статистику продаж текущего сеанса? Это действие необратимо.',
      confirmText: 'Да, сбросить всё',
      isDanger: true,
      onConfirm: () => {
        saveItems([]);
        saveLogs([]);
        showToast('Таблица товаров и отчетность сброшены', 'info');
        setConfirmModal(null);
      }
    });
  };

  // Export CSV Action configured with Russian excel compatibility (semicolon and UTF8-BOM)
  const handleExportCSV = () => {
    const headers = ['ID', 'Название', 'Категория', 'Статус', 'В наличии (шт)', 'Продано (шт)', 'Закупка за 1 шт (руб)', 'Продажа за 1 шт (руб)', 'Сумма закупки (Потрачено всего)', 'Комиссия Playerok (%)', 'Чистая маржа с 1 шт', 'Общая чистая прибыль', 'Добавлен'];
    const rows = [headers];

    items.forEach(it => {
      const margin = getItemMargin(it);
      const spentTotal = getItemSpent(it);
      const totalProfit = it.soldCount * margin;
      
      rows.push([
        it.id.toString(),
        it.name,
        it.cat,
        it.status === 'active' ? 'Активный' : 'На паузе',
        it.quantity.toString(),
        it.soldCount.toString(),
        it.buy.toString(),
        it.sell.toString(),
        spentTotal.toString(),
        it.comm.toString(),
        margin.toFixed(2),
        totalProfit.toFixed(2),
        it.date
      ]);
    });

    const csvContent = rows.map(r => r.map(v => {
      const s = String(v).replace(/"/g, '""');
      return /[;\n"]/.test(s) ? `"${s}"` : s;
    }).join(';')).join('\r\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `playerok-moj-sklad-${getTodayDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV успешно экспортирован для Excel!', 'success');
  };

  // Search & Filtering processing
  const processedItems = useMemo(() => {
    const filtered = items.filter(it => {
      // Search Box filter
      const q = searchQuery.toLowerCase();
      const matchesSearch = it.name.toLowerCase().includes(q) || it.cat.toLowerCase().includes(q);
      
      if (!matchesSearch) return false;

      // Sidebar Filter
      if (filterType === 'status') {
        if (filterVal === 'all') return true;
        return it.status === filterVal;
      } else if (filterType === 'cat') {
        return it.cat === filterVal;
      }
      return true;
    });

    // Sorting
    return [...filtered].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortKey === 'margin') {
        valA = getItemMargin(a);
        valB = getItemMargin(b);
      } else if (sortKey === 'spent') {
        valA = getItemSpent(a);
        valB = getItemSpent(b);
      } else {
        valA = a[sortKey];
        valB = b[sortKey];
      }

      if (typeof valA === 'string') {
        return valA.localeCompare(valB) * sortDir;
      }
      return ((valA || 0) - (valB || 0)) * sortDir;
    });
  }, [items, searchQuery, filterType, filterVal, sortKey, sortDir]);

  const handleSortClick = (key: keyof ProductItem | 'margin' | 'spent') => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  // Dynamic preview computation for adding form
  const formMarginPreview = useMemo(() => {
    const buyValue = fBuy === '' ? 0 : Number(fBuy);
    const sellValue = fSell === '' ? 0 : Number(fSell);
    const margin = sellValue * (1 - fComm / 100) - buyValue;
    const spentNewBatch = buyValue * fQuantity;
    return {
      margin,
      spentNewBatch,
      revenue: sellValue * (1 - fComm / 100)
    };
  }, [fBuy, fSell, fComm, fQuantity]);

  // Sidebar dynamic filter activation helper
  const handleSbClick = (type: 'status' | 'cat', value: string) => {
    setFilterType(type);
    setFilterVal(value);
  };

  return (
    <div className="shell min-h-screen bg-[#f5f5f1] dark:bg-[#12120f] font-sans antialiased text-[#151511] dark:text-[#f3efe8] transition-colors duration-300">
      
      {/* APP TOAST NOTIFICATIONS DRAWER */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
              className={`flex items-center gap-3 p-4 rounded-xl shadow-lg border text-sm pointer-events-auto ${
                t.type === 'success' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800' 
                  : t.type === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100 border-rose-200 dark:border-rose-800'
                  : 'bg-zinc-100 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700'
              }`}
            >
              {t.type === 'success' ? (
                <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300">
                  <Check className="w-4 height-4" />
                </div>
              ) : t.type === 'error' ? (
                <div className="p-1 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300">
                  <X className="w-4 height-4" />
                </div>
              ) : (
                <div className="p-1 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                  <Info className="w-4 height-4" />
                </div>
              )}
              <div className="flex-1 font-medium">{t.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen">
        
        {/* --- SIDEBAR --- */}
        <aside className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-[#1a1a16] border-b lg:border-b-0 lg:border-r border-zinc-200/80 dark:border-zinc-800/80 p-5 flex flex-col justify-between">
          <div>
            {/* Header / Logo */}
            <div className="flex items-center gap-3 pb-5 mb-5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/20">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight font-display text-zinc-900 dark:text-zinc-50 leading-tight">Playerok</h1>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-widest leading-none mt-0.5">Личный Склад</p>
              </div>
            </div>

            {/* Filter Status Section */}
            <div className="space-y-1 mb-6">
              <span className="px-3 text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase block mb-2">Фильтр по статусу</span>
              
              <button
                onClick={() => handleSbClick('status', 'all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  filterType === 'status' && filterVal === 'all'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-medium shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  <span>Все товары</span>
                </div>
                <span className="text-xs bg-zinc-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-mono text-zinc-500 dark:text-zinc-400">{counters.allCount}</span>
              </button>

              <button
                onClick={() => handleSbClick('status', 'active')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  filterType === 'status' && filterVal === 'active'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-medium border border-emerald-100/50 dark:border-emerald-950/20'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Продаются (Активны)</span>
                </div>
                <span className="text-xs bg-emerald-100/30 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-mono text-emerald-600 dark:text-emerald-400">{counters.activeCount}</span>
              </button>

              <button
                onClick={() => handleSbClick('status', 'pause')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  filterType === 'status' && filterVal === 'pause'
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 font-medium'
                    : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-zinc-400" />
                  <span>Сняты (На паузе)</span>
                </div>
                <span className="text-xs bg-zinc-200/50 dark:bg-zinc-800/80 px-2 py-0.5 rounded-full font-mono text-zinc-500 dark:text-zinc-400">{counters.pauseCount}</span>
              </button>
            </div>

            {/* Filter Categories Section */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase block mb-2">Категории товара</span>
              <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
                {uniqueCategories.map(cat => {
                  const isActive = filterType === 'cat' && filterVal === cat;
                  const count = counters.catCounts[cat] || 0;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleSbClick('cat', cat)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                        isActive
                          ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-semibold border border-amber-100/50 dark:border-amber-900/40'
                          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className="opacity-70 font-mono">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* --- MAIN MAIN PANEL --- */}
        <main className="flex-1 p-4 lg:p-8 space-y-6 overflow-x-hidden">
          
          {/* HEADER BAR AND SEARCH */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/50 dark:border-zinc-800/50 pb-5">
            <div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                <span>Панель управления</span>
                <span>/</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {filterType === 'status' ? (filterVal === 'all' ? 'Все товары' : filterVal === 'active' ? 'Продажи' : 'Пауза') : filterVal}
                </span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
                Мои товары на продажу
              </h2>
            </div>

            {/* Global Actions Widget */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Поиск по названию..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9.5 pl-9 pr-4 text-sm bg-white dark:bg-[#1e1e1a] border border-zinc-200 dark:border-zinc-850 rounded-lg text-zinc-900 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder-zinc-400 dark:placeholder-zinc-500 transition-all font-medium"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')} 
                    className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center justify-center gap-2 px-4 h-9.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#1e1e1a] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>Экспорт CSV Excel</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC METRIC CARDS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            
            {/* BOX 1: SPENT TOTAL (Сколько я потратил) */}
            <div className="bg-white dark:bg-[#1e1e1a] rounded-xl p-5 border border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-xs transition-shadow relative overflow-hidden group">
              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-zinc-400/80 group-hover:text-zinc-500/100 transition-colors">
                <CircleDollarSign className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">ПОТРАЧЕНО ВСЕГО (ЗАКУПКА)</p>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
                {globalStats.totalInvested.toLocaleString('ru-RU')} <span className="text-zinc-400 text-lg">₽</span>
              </h3>
              <div className="flex items-center gap-1.5 mt-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-zinc-400 inline-block" />
                <span>Затраты на {globalStats.totalStockUnits + globalStats.totalSoldUnits} шт. продукции</span>
              </div>
              <div className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                Закупка * (Склад + Проданные)
              </div>
            </div>

            {/* BOX 2: CHISTAYA VYRUČKA */}
            <div className="bg-white dark:bg-[#1e1e1a] rounded-xl p-5 border border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-xs transition-shadow relative overflow-hidden group">
              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-400 group-hover:text-indigo-500 transition-colors">
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">ВЫРУЧКА С ПРОДАЖ</p>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
                {globalStats.totalNetRevenue.toLocaleString('ru-RU')} <span className="text-indigo-400 text-lg">₽</span>
              </h3>
              <div className="flex items-center gap-1.5 mt-2.5 text-xs text-indigo-600 dark:text-indigo-400">
                <span className="font-semibold bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.5 rounded-sm">
                  {globalStats.totalSoldUnits} ед.
                </span>
                <span>успешно продано на Playerok</span>
              </div>
              <div className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                Снято после уплаты комиссии
              </div>
            </div>

            {/* BOX 3: CHISTAYA PRIBYL (ПРИБЫЛЬ С ПРОДАННОГО) */}
            <div className="bg-white dark:bg-[#1e1e1a] rounded-xl p-5 border border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-xs transition-shadow relative overflow-hidden group">
              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-500 group-hover:text-emerald-600 transition-colors">
                <LineChart className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">ЧИСТАЯ ПРИБЫЛЬ</p>
              <h3 className={`text-2xl font-bold tracking-tight mt-2 font-mono ${
                globalStats.totalRealizedProfit > 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : globalStats.totalRealizedProfit < 0 
                  ? 'text-rose-600 dark:text-rose-400' 
                  : 'text-zinc-700 dark:text-zinc-300'
              }`}>
                {globalStats.totalRealizedProfit >= 0 ? '+' : ''}
                {globalStats.totalRealizedProfit.toLocaleString('ru-RU')} <span className="text-emerald-400 text-lg">₽</span>
              </h3>
              <div className="flex items-center gap-1.5 mt-2.5 text-xs text-emerald-700 dark:text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animation-pulse" />
                <span>Окупаемость затрат: {globalStats.totalInvested > 0 ? ((globalStats.totalNetRevenue / globalStats.totalInvested) * 100).toFixed(0) : '0'}%</span>
              </div>
              <div className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                Выручка чистыми минус закупка
              </div>
            </div>

            {/* BOX 4: WAREHOUSE STOCK (ЗАПАСЫ И ПОТЕНЦИАЛ) */}
            <div className="bg-white dark:bg-[#1e1e1a] rounded-xl p-5 border border-zinc-200/60 dark:border-zinc-800/60 hover:shadow-xs transition-shadow relative overflow-hidden group">
              <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 text-amber-500 group-hover:text-amber-600 transition-colors">
                <Package className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-bold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">ОСТАТОК НА СКЛАДЕ</p>
              <h3 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
                {globalStats.totalStockUnits} <span className="text-zinc-400 text-lg">шт.</span>
              </h3>
              <div className="flex items-center gap-1.5 mt-2.5 text-xs text-amber-600 dark:text-amber-400">
                <span>Потенциал прибыли: </span>
                <span className="font-bold">+{globalStats.warehousePotentialProfit.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase tracking-wider">
                Оценка остатка на сумму: {globalStats.warehouseValue.toLocaleString('ru-RU')} ₽
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* INVENTORY TABLE & MANAGEMENT AREA (2/3 width) */}
            <div className="xl:col-span-2 space-y-6">
              
              <div className="bg-white dark:bg-[#1e1e1a] rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 shadow-xs overflow-hidden">
                
                {/* TABLE CARD HEADER */}
                <div className="px-5 py-4 border-b border-zinc-200/70 dark:border-zinc-800/75 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 text-sm">Список складских позиций</span>
                    <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold px-2.5 py-0.5 rounded-full">
                      {processedItems.length} из {items.length} видов
                    </span>
                  </div>
                  
                  {/* Sorting feedback info */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Сортировка по нажатию на заголовки таблицы</span>
                  </div>
                </div>

                {/* THE INVENTORY GRID/TABLE */}
                <div className="overflow-x-auto">
                  {processedItems.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400">
                      <Package className="w-12 h-12 mx-auto stroke-1 text-zinc-300 dark:text-zinc-700 mb-3" />
                      <p className="text-sm font-medium">Товары не найдены</p>
                      <p className="text-xs text-zinc-500/80 mt-1 max-w-sm mx-auto">
                        Попробуйте расширить критерии поиска или добавьте новый товар заполнив форму справа.
                      </p>
                    </div>
                  ) : (
                    <table className="min-w-full text-left border-collapse table-auto md:table-fixed">
                      <thead>
                        <tr className="bg-zinc-50/50 dark:bg-[#252520] select-none text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-200/70 dark:border-zinc-800/70">
                          <th onClick={() => handleSortClick('name')} className="px-4 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#2e2e29] h-10 align-middle transition-colors w-72">
                            Товар <span className="text-[9px] text-zinc-300 dark:text-zinc-650">{sortKey === 'name' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                          </th>
                          <th onClick={() => handleSortClick('status')} className="px-3 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#2e2e29] h-10 align-middle text-center transition-colors w-24">
                            Статус <span className="text-[9px] text-zinc-300 dark:text-zinc-650">{sortKey === 'status' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                          </th>
                          <th onClick={() => handleSortClick('quantity')} className="px-3 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#2e2e29] h-10 align-middle text-center transition-colors w-32">
                            В наличии <span className="text-[9px] text-zinc-300 dark:text-zinc-650">{sortKey === 'quantity' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                          </th>
                          <th onClick={() => handleSortClick('soldCount')} className="px-3 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#2e2e29] h-10 align-middle text-center transition-colors w-28">
                            Продано / Прибыль <span className="text-[9px] text-zinc-300 dark:text-zinc-650">{sortKey === 'soldCount' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                          </th>
                          <th onClick={() => handleSortClick('buy')} className="px-3 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#2e2e29] h-10 align-middle text-center transition-colors w-24">
                            Закупка <span className="text-[9px] text-zinc-300 dark:text-zinc-650">{sortKey === 'buy' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                          </th>
                          <th onClick={() => handleSortClick('sell')} className="px-3 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#2e2e29] h-10 align-middle text-center transition-colors w-24">
                            Продажа <span className="text-[9px] text-zinc-300 dark:text-zinc-650">{sortKey === 'sell' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                          </th>
                          <th onClick={() => handleSortClick('spent')} className="px-3 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#2e2e29] h-10 align-middle text-center transition-colors w-32">
                            ПОТРАЧЕНО <span className="text-[9px] text-zinc-300 dark:text-zinc-650">{sortKey === 'spent' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                          </th>
                          <th onClick={() => handleSortClick('margin')} className="px-3 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-[#2e2e29] h-10 align-middle text-center transition-colors w-28">
                            Маржа с 1 шт <span className="text-[9px] text-zinc-300 dark:text-zinc-650">{sortKey === 'margin' ? (sortDir === 1 ? '▲' : '▼') : '⬍'}</span>
                          </th>
                          <th className="px-4 py-3 text-right h-10 align-middle w-36">Действие</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm">
                        {processedItems.map(it => {
                          const margin = getItemMargin(it);
                          const spendOnItem = getItemSpent(it);
                          const totalProfitRefunded = it.soldCount * margin;
                          const commFraction = (100 - it.comm) / 100;
                          const priceAfterComm = it.sell * commFraction;

                          return (
                            <tr key={it.id} className="hover:bg-zinc-50/55 dark:hover:bg-[#1f1f1b]/60 transition-colors group">
                              
                              {/* PRODUCT DETAILS */}
                              <td className="px-4 py-3.5 max-w-xs">
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">{it.name}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-500/10 dark:bg-amber-600/10 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                                    {it.cat}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 font-mono">ID: {it.id}</span>
                                </div>
                              </td>

                              {/* STATUS BADGE */}
                              <td className="px-3 py-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleItemStatus(it.id)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer border select-none transition-transform active:scale-95 ${
                                    it.status === 'active'
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-750 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/40'
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700'
                                  }`}
                                  title="Нажмите для смены статуса товара"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${it.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                                  <span>{it.status === 'active' ? 'Продаётся' : 'Пауза'}</span>
                                </button>
                              </td>

                              {/* STOCK QUANTITY + QUICK EDIT CONTROLS */}
                              <td className="px-3 py-3.5 text-center">
                                <div className="inline-flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 p-1.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                                  <button
                                    onClick={() => adjustItemQuantity(it.id, -1)}
                                    className="p-1 rounded-lg bg-white dark:bg-[#1a1a16] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 border border-zinc-200/50 dark:border-zinc-750 cursor-pointer text-xs"
                                    title="Уменьшить на 1"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className={`w-8 font-bold font-mono text-center text-sm ${it.quantity === 0 ? 'text-red-500 animate-pulse' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                    {it.quantity}
                                  </span>
                                  <button
                                    onClick={() => adjustItemQuantity(it.id, 1)}
                                    className="p-1 rounded-lg bg-white dark:bg-[#1a1a16] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 border border-zinc-200/50 dark:border-zinc-750 cursor-pointer text-xs"
                                    title="Увеличить на 1"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="text-[10px] text-zinc-400/80 mt-1">осталось на складе</div>
                              </td>

                              {/* SOLD COUNT & REVENUE */}
                              <td className="px-3 py-3.5 text-center font-mono">
                                <div className="text-zinc-900 dark:text-zinc-100 font-bold text-sm">
                                  {it.soldCount} шт.
                                </div>
                                <div className={`text-[10px] font-semibold ${totalProfitRefunded >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                  Прибыль: {totalProfitRefunded >= 0 ? '+' : ''}{totalProfitRefunded.toFixed(0)} ₽
                                </div>
                              </td>

                              {/* UNIT BUY PRICE */}
                              <td className="px-3 py-3.5 text-center font-mono font-medium text-zinc-900 dark:text-zinc-100">
                                {it.buy > 0 ? `${it.buy.toLocaleString('ru-RU')} ₽` : <span className="text-zinc-400">—</span>}
                              </td>

                              {/* UNIT RETAIL PRICE */}
                              <td className="px-3 py-3.5 text-center font-mono text-zinc-900 dark:text-zinc-100 font-bold">
                                <div>{it.sell.toLocaleString('ru-RU')} ₽</div>
                                <div className="text-[10px] text-zinc-400 font-normal">Чистыми: {priceAfterComm.toFixed(1)}</div>
                              </td>

                              {/* COMPUTE TOTAL CAPITAL SPENT ON THIS DIGITAL GOODS SET */}
                              <td className="px-3 py-3.5 text-center font-mono font-medium bg-amber-500/5 dark:bg-amber-500/2">
                                <div className="text-amber-900 dark:text-amber-200 font-bold">
                                  {spendOnItem.toLocaleString('ru-RU')} ₽
                                </div>
                                <div className="text-[9px] text-zinc-400 font-sans tracking-wide leading-none mt-0.5">
                                  ({it.quantity + it.soldCount} шт. всего)
                                </div>
                              </td>

                              {/* SELLING MARGIN POTENTIAL PER SINGLE PIECE */}
                              <td className="px-3 py-3.5 text-center font-mono font-bold">
                                <span className={margin > 0 ? 'text-emerald-600 dark:text-emerald-400' : margin < 0 ? 'text-rose-500' : 'text-zinc-400'}>
                                  {margin >= 0 ? '+' : ''}{margin.toFixed(0)} ₽
                                </span>
                                <div className="text-[9px] text-zinc-400 dark:text-zinc-500 font-sans font-normal mt-0.5 uppercase tracking-wider">
                                  {it.sell > 0 ? `${((margin / it.sell) * 100).toFixed(0)}% маржа` : '0%'}
                                </div>
                              </td>

                              {/* OPERATIONS ACTIONS ROW (SELL, EDIT, DELETE) */}
                              <td className="px-4 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  
                                  {/* CRITICAL GREEN BUTTON: "ПРОДАТЬ 1 ШТ." */}
                                  <button
                                    onClick={() => handleRecordSale(it.id)}
                                    disabled={it.quantity <= 0}
                                    className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 ${
                                      it.quantity > 0
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-650 cursor-not-allowed border border-transparent'
                                    }`}
                                    title="Продать 1 единицу этого товара"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    <span>ПРОДАТЬ</span>
                                  </button>

                                  <button
                                    onClick={() => handleOpenEditModal(it)}
                                    className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#1a1a16] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-150 transition-colors"
                                    title="Редактировать параметры"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteItem(it.id)}
                                    className="p-1.5 rounded-lg bg-zinc-50 dark:bg-[#1a1a16] text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                    title="Удалить"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* TABLE CARD FOOTER / SUMMARY INDICATOR */}
                <div className="px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/20 dark:bg-[#1b1b17]/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Для смены статуса товара "На паузе" / "Продаётся", кликните на его бейдж статуса.</span>
                  </div>
                  <div>
                    Потраченная сумма складывается из: <span className="font-mono text-zinc-500 dark:text-zinc-300">Закупка × (Наличие + Продано)</span>
                  </div>
                </div>

              </div>
              
              {/* HISTORICAL SALES LOG CARD */}
              <div className="bg-white dark:bg-[#1e1e1a] rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <History className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Журнал недавних продаж</h4>
                      <p className="text-[10px] text-zinc-400">Фиксирует точный подсчет чистой прибыли в реальном времени</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-sm">
                    Всего продаж: {salesLogs.length} шт.
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                  {salesLogs.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400">
                      <ShoppingBag className="w-8 h-8 mx-auto stroke-1 text-zinc-300 dark:text-zinc-700 mb-2" />
                      <p className="text-xs font-medium">Продажи ещё не зарегистрированы</p>
                      <p className="text-[10px] text-zinc-500/80 mt-0.5 max-w-xs mx-auto">
                        Нажмите кнопку <strong className="text-emerald-500">"ПРОДАТЬ"</strong> в таблице, когда совершите продажу товара на Playerok.
                      </p>
                    </div>
                  ) : (
                    salesLogs.map(log => (
                      <div 
                        key={log.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-50/50 dark:bg-[#252520]/50 border border-zinc-200/40 dark:border-zinc-800/40 hover:bg-zinc-50 dark:hover:bg-[#252520] transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mt-0.5">
                            <PlusCircle className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{log.itemName}</span>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-zinc-400 font-medium">
                              <span className="text-zinc-500 dark:text-zinc-400 font-mono">Выручка: {log.sellPrice} ₽</span>
                              <span>•</span>
                              <span className="font-mono">Закупка: {log.buyPrice} ₽</span>
                              <span>•</span>
                              <span className="text-[9px] font-mono text-amber-500 dark:text-amber-500 bg-amber-500/10 px-1 rounded-xs">Комиссия Playerok: {log.commission}%</span>
                            </div>
                            <span className="text-[9px] text-zinc-400 block mt-1 font-mono uppercase tracking-wide">{log.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 ml-4">
                          <div className="text-right font-mono">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              +{log.profit.toFixed(1)} ₽ прибыли
                            </span>
                            <span className="text-[8px] text-zinc-400 block">чистыми</span>
                          </div>
                          <button
                            onClick={() => handleUndoSale(log.id)}
                            className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer transition-colors"
                            title="Отменить регистрацию продажи (вернуть на склад)"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* PRODUCT ADD FORM (1/3 width) */}
            <div className="space-y-6">
              
              <div className="bg-white dark:bg-[#1e1e1a] rounded-xl border border-zinc-200/75 dark:border-zinc-800/75 shadow-xs p-5">
                
                {/* Expandable Form Header */}
                <div 
                  className="flex items-center justify-between cursor-pointer select-none pb-4 border-b border-zinc-100 dark:border-zinc-800"
                  onClick={() => setIsFormOpen(!isFormOpen)}
                >
                  <div className="flex items-center gap-2">
                    <PlusCircle className="w-4.5 h-4.5 text-amber-500" />
                    <h3 className="font-bold text-sm text-zinc-950 dark:text-zinc-50 font-display">Добавить новый товар</h3>
                  </div>
                  <button className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200">
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isFormOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <AnimatePresence>
                  {isFormOpen && (
                    <motion.form 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onSubmit={handleAddItem}
                      className="overflow-hidden space-y-4 pt-4 text-xs font-medium"
                    >
                      {/* Name */}
                      <div className="space-y-1">
                        <label className="text-zinc-500 dark:text-zinc-400 block font-semibold">Название товара *</label>
                        <input
                          type="text"
                          required
                          placeholder="Например, Подарочная карта Discord Nitro"
                          value={fName}
                          onChange={(e) => setFName(e.target.value)}
                          className="w-full h-9.5 px-3 bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-805 rounded-lg text-zinc-900 dark:text-zinc-200 placeholder-zinc-400 focus:ring-1 focus:ring-amber-500 focus:outline-hidden text-xs"
                        />
                      </div>

                      {/* Category Selector */}
                      <div className="space-y-1">
                        <label className="text-zinc-500 dark:text-zinc-400 block font-semibold">Полка / Категория</label>
                        <div className="relative">
                          <select
                            value={fCat}
                            onChange={(e) => setFCat(e.target.value)}
                            className="w-full h-9.5 pl-3 pr-8 bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-805 rounded-lg text-zinc-900 dark:text-zinc-200 focus:outline-hidden appearance-none cursor-pointer text-xs"
                          >
                            <option value="Игровые товары">Игровые товары</option>
                            <option value="Telegram">Telegram</option>
                            <option value="Steam">Steam</option>
                            <option value="SMM">SMM</option>
                            <option value="FunPay">FunPay</option>
                            <option value="Другое">Другое</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-3.5 w-3 h-3 text-zinc-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Buy (Закупка) */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <label className="text-zinc-500 dark:text-zinc-400 font-semibold">Закупка (₽/ед.)</label>
                            <span className="text-[10px] text-zinc-400" title="Сколько вы потратили на приобретение 1 единицы">(?)</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            value={fBuy}
                            onChange={(e) => setFBuy(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                            className="w-full h-9.5 px-3 bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-805 rounded-lg text-zinc-900 dark:text-zinc-200 focus:outline-hidden text-xs"
                          />
                        </div>

                        {/* Sell (Продажа) */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <label className="text-zinc-500 dark:text-zinc-400 font-semibold font-bold">Продажа (₽/ед.)</label>
                            <span className="text-[10px] text-zinc-400" title="По цене ценника на Playerok">(?)</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            value={fSell}
                            onChange={(e) => setFSell(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                            className="w-full h-9.5 px-3 bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-805 rounded-lg text-zinc-900 dark:text-zinc-200 focus:outline-hidden text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Custom Toggle Switch for Commission based on image schema */}
                        <div className="space-y-1">
                          <label className="text-zinc-500 dark:text-zinc-400 block font-semibold mb-1">Комиссия</label>
                          <div className="flex items-center justify-between h-9.5 px-2.5 bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-805 rounded-lg select-none">
                            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 leading-none">
                              {/* Price tag icon mockup styled as neon-cyan point */}
                              <span className={`w-2 h-2 rounded-full ${fComm === 10 ? 'bg-cyan-500 animate-pulse' : 'bg-zinc-400'}`} />
                              10%
                            </span>
                            <button
                              type="button"
                              onClick={() => setFComm(fComm === 10 ? 20 : 10)}
                              className={`relative inline-flex h-4.5 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                                fComm === 10 ? 'bg-cyan-500' : 'bg-zinc-300 dark:bg-zinc-700'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                  fComm === 10 ? 'translate-x-3.5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Stock Quantity (КОЛИЧЕСТВО В НАЛИЧИИ/ЗАПАСЫ) */}
                        <div className="space-y-1">
                          <label className="text-amber-600 dark:text-amber-500 block font-bold">Текущий запас (шт.)</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={fQuantity}
                            onChange={(e) => setFQuantity(Math.max(0, parseInt(e.target.value || '0')))}
                            className="w-full h-9.5 px-3 bg-amber-500/5 dark:bg-amber-500/2 border border-amber-300 dark:border-amber-805/40 rounded-lg text-zinc-900 dark:text-zinc-200 focus:outline-hidden font-bold text-xs"
                          />
                        </div>
                      </div>

                      {/* Status */}
                      <div className="space-y-1">
                        <label className="text-zinc-500 dark:text-zinc-400 block font-semibold">Статус публикации</label>
                        <div className="relative">
                          <select
                            value={fStatus}
                            onChange={(e) => setFStatus(e.target.value as ItemStatus)}
                            className="w-full h-9.5 pl-3 pr-8 bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-805 rounded-lg text-zinc-900 dark:text-zinc-200 focus:outline-hidden appearance-none cursor-pointer text-xs"
                          >
                            <option value="active">Активный (Выставить в таблицу)</option>
                            <option value="pause">На паузе (Снять временно)</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-3.5 w-3 h-3 text-zinc-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* REAL-TIME ECONOMIC CALCULATION PREVIEW */}
                      <div className="p-3 bg-zinc-50 dark:bg-[#252520] border border-zinc-200/50 dark:border-zinc-800 rounded-lg space-y-1.5 font-sans">
                        <div className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">ОЦЕНКА БЮДЖЕТА</div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500">Закупка всей партии:</span>
                          <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">
                            {formMarginPreview.spentNewBatch.toLocaleString('ru-RU')} ₽ (Потрачено)
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-500">Выручка за 1 шт. (после комиссии):</span>
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                            {formMarginPreview.revenue.toFixed(1)} ₽
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs border-t border-zinc-200/40 dark:border-zinc-800/40 pt-1.5 mt-1">
                          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Чистая маржа с 1 шт:</span>
                          <span className={`font-mono font-bold text-sm ${formMarginPreview.margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                            {formMarginPreview.margin >= 0 ? '+' : ''}{formMarginPreview.margin.toFixed(0)} ₽
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full h-10 rounded-lg bg-zinc-900 dark:bg-[#2f2f28] hover:bg-zinc-800 dark:hover:bg-[#3f3f37] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>ДОБАВИТЬ ТОВАР НА СКЛАД</span>
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

              </div>

              {/* COMMISSIONS GUIDE TIP BOX REMOVED */}

            </div>

          </div>

        </main>

      </div>

      {/* --- RE-EDIT POPUP MODAL --- */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs" 
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-[#1e1e1a] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-md w-full overflow-hidden relative z-10 text-xs font-semibold"
            >
              <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Редактировать параметры товара</h3>
                </div>
                <button 
                  onClick={() => setEditingItem(null)}
                  className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-205 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-zinc-500 dark:text-zinc-400 block pb-0.5">Название товара</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full h-9.5 px-3 bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-zinc-500 dark:text-zinc-400 block pb-0.5">Категория</label>
                    <select
                      value={editingItem.cat}
                      onChange={(e) => setEditingItem({ ...editingItem, cat: e.target.value })}
                      className="w-full h-9.5 px-3 bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden cursor-pointer text-xs"
                    >
                      {uniqueCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-zinc-500 dark:text-zinc-400 block pb-0.5">Статус публикации</label>
                    <select
                      value={editingItem.status}
                      onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as ItemStatus })}
                      className="w-full h-9.5 px-3 bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden cursor-pointer text-xs"
                    >
                      <option value="active">Активный (Продаётся)</option>
                      <option value="pause">На паузе (Скрыт)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Stock Quantity (КОЛИЧЕСТВО В НАЛИЧИИ) */}
                  <div className="space-y-1">
                    <label className="text-amber-600 dark:text-amber-500 block pb-0.5 font-bold">Остаток на складе (шт.)</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.quantity}
                      onChange={(e) => setEditingItem({ ...editingItem, quantity: Math.max(0, parseInt(e.target.value || '0')) })}
                      className="w-full h-9.5 px-3 bg-amber-500/5 border border-amber-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 font-bold focus:outline-hidden text-xs"
                    />
                  </div>

                  {/* Sold count manual override */}
                  <div className="space-y-1">
                    <label className="text-emerald-600 dark:text-emerald-500 block pb-0.5 font-bold">Продано штук (фактически)</label>
                    <input
                      type="number"
                      min="0"
                      value={editingItem.soldCount}
                      onChange={(e) => setEditingItem({ ...editingItem, soldCount: Math.max(0, parseInt(e.target.value || '0')) })}
                      className="w-full h-9.5 px-3 bg-emerald-500/5 border border-emerald-300 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 font-bold focus:outline-hidden text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Buy */}
                  <div className="space-y-1">
                    <label className="text-zinc-500 dark:text-zinc-400 block pb-0.5">Закупка (₽)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingItem.buy}
                      onChange={(e) => setEditingItem({ ...editingItem, buy: Math.max(0, Number(e.target.value || 0)) })}
                      className="w-full h-9.5 px-3 bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden font-mono text-xs"
                    />
                  </div>

                  {/* Sell */}
                  <div className="space-y-1">
                    <label className="text-zinc-500 dark:text-zinc-400 block pb-0.5">Продажа (₽)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingItem.sell}
                      onChange={(e) => setEditingItem({ ...editingItem, sell: Math.max(0, Number(e.target.value || 0)) })}
                      className="w-full h-9.5 px-3 bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-hidden font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Edit modal isPaymentTen toggle */}
                <div className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-805 rounded-lg select-none">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 leading-none">
                    <span className={`w-2 h-2 rounded-full ${editingItem.comm === 10 ? 'bg-cyan-500 animate-pulse' : 'bg-zinc-400'}`} />
                    10%
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...editingItem, comm: editingItem.comm === 10 ? 20 : 10 })}
                    className={`relative inline-flex h-4.5 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      editingItem.comm === 10 ? 'bg-cyan-500' : 'bg-zinc-300 dark:bg-zinc-750'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        editingItem.comm === 10 ? 'translate-x-3.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Economic Summary Preview inside Modal */}
                <div className="p-3 bg-zinc-50 dark:bg-[#252520] border border-zinc-200/50 dark:border-zinc-800 rounded-lg flex items-center justify-between font-sans">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider leading-none mb-1">ФИНАНСОВЫЙ БАЛАНС</span>
                    <span className="text-zinc-500">Затраты на этот лот:</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                      {getItemSpent(editingItem).toLocaleString('ru-RU')} ₽ (Вложено)
                    </div>
                    <div className="text-[10px] text-zinc-400 block leading-tight font-serif">
                      Маржа с 1 шт.: <strong className="text-emerald-500 font-mono">+{getItemMargin(editingItem).toFixed(0)} ₽</strong>
                    </div>
                  </div>
                </div>

              </div>

              <div className="px-5 py-3.5 bg-zinc-50 dark:bg-[#252520] border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 h-9 rounding-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 bg-white dark:bg-[#1e1e1a] border border-zinc-250 dark:border-zinc-800 text-xs cursor-pointer rounded-lg hover:bg-zinc-50 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedItem}
                  className="px-4 h-9 bg-zinc-900 dark:bg-[#32322a] hover:bg-zinc-800 dark:hover:bg-[#43433a] cursor-pointer text-white text-xs font-bold rounded-lg hover:shadow-sm"
                >
                  Сохранить изменения
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CUSTOM CONFIRM DIALOG MODAL --- */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs" 
            />

            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-[#1e1e1a] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-sm w-full overflow-hidden relative z-10 text-xs font-semibold"
            >
              <div className="p-5 text-center space-y-4">
                <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${confirmModal.isDanger ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'}`}>
                  <Info className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{confirmModal.title}</h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed font-normal">{confirmModal.message}</p>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-zinc-50 dark:bg-[#252520] border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="px-4 h-9 rounded-lg text-zinc-650 dark:text-zinc-350 hover:text-zinc-900 bg-white dark:bg-[#1e1e1a] border border-zinc-250 dark:border-zinc-805 text-xs cursor-pointer hover:bg-zinc-50 font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className={`px-4 h-9 rounded-lg text-white text-xs font-bold cursor-pointer transition-opacity duration-150 active:scale-95 ${confirmModal.isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-zinc-900 dark:bg-[#2f2f28] hover:bg-zinc-850'}`}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
