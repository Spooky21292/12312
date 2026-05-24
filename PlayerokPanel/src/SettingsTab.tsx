import React, { useState, useEffect } from 'react';
import { Settings, Key, CheckCircle, XCircle, User, RefreshCw } from 'lucide-react';
import { getToken, setToken, fetchMe } from './api';
import { PlayerokUser } from './types';

export default function SettingsTab() {
  const [tokenInput, setTokenInput] = useState(getToken());
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle');
  const [user, setUser] = useState<PlayerokUser | null>(null);

  useEffect(() => {
    if (getToken()) {
      checkConnection();
    }
  }, []);

  const checkConnection = async () => {
    setStatus('checking');
    const me = await fetchMe();
    if (me) {
      setUser(me);
      setStatus('ok');
    } else {
      setUser(null);
      setStatus('error');
    }
  };

  const handleSave = () => {
    setToken(tokenInput.trim());
    checkConnection();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white dark:bg-[#1e1e1a] rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-200/70 dark:border-zinc-800/75 flex items-center gap-2">
          <Settings className="w-4.5 h-4.5 text-amber-500" />
          <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Подключение к Playerok</span>
        </div>

        <div className="p-5 space-y-5">
          {/* Инструкция */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <p className="font-bold">Как получить токен авторизации:</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-800 dark:text-amber-300">
              <li>Откройте <a href="https://playerok.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">playerok.com</a> и войдите в свой аккаунт</li>
              <li>Откройте DevTools (F12) → вкладка Application → Cookies</li>
              <li>Найдите cookie с именем <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">token</code></li>
              <li>Скопируйте его значение и вставьте ниже</li>
            </ol>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">
              ⚠️ Токен хранится только локально в вашем браузере. Никуда не отправляется кроме прокси-сервера → Playerok API.
            </p>
          </div>

          {/* Token Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5" />
              Токен авторизации (cookie "token")
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="Вставьте значение cookie token..."
                className="flex-1 h-10 px-3 bg-zinc-50 dark:bg-[#252520] border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
              <button
                onClick={handleSave}
                className="px-4 h-10 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Сохранить и проверить
              </button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#252520]">
            {status === 'idle' && (
              <>
                <div className="p-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500">
                  <Key className="w-4 h-4" />
                </div>
                <span className="text-xs text-zinc-500">Токен не проверен</span>
              </>
            )}
            {status === 'checking' && (
              <>
                <div className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-500">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400">Проверка подключения...</span>
              </>
            )}
            {status === 'ok' && user && (
              <>
                <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-500">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  {user.avatar?.url && <img src={user.avatar.url} className="w-6 h-6 rounded-full" alt="" />}
                  <div>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Подключено!</span>
                    <span className="text-[10px] text-zinc-500 block">
                      Аккаунт: <strong>{user.username}</strong>
                      {user.balance !== undefined && ` • Баланс: ${user.balance} ₽`}
                    </span>
                  </div>
                </div>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="p-1.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-500">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Ошибка подключения</span>
                  <span className="text-[10px] text-zinc-500 block">Проверьте токен и убедитесь, что прокси-сервер запущен (порт 3001)</span>
                </div>
              </>
            )}
          </div>

          {/* Server Info */}
          <div className="p-3 bg-zinc-50 dark:bg-[#252520] border border-zinc-200/50 dark:border-zinc-800 rounded-lg text-xs text-zinc-500 space-y-1">
            <p className="font-bold text-zinc-700 dark:text-zinc-300">Прокси-сервер:</p>
            <p>Для работы панели необходимо запустить прокси-сервер:</p>
            <code className="block bg-zinc-900 dark:bg-zinc-950 text-emerald-400 p-2 rounded mt-1 font-mono text-[11px]">
              npx tsx server.ts
            </code>
            <p className="mt-2 text-zinc-400">Сервер проксирует запросы к API Playerok, обходя CORS-ограничения браузера.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
