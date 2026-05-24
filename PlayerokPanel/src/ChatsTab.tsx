import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, ArrowLeft, User, Circle } from 'lucide-react';
import { PlayerokChat, PlayerokChatMessage } from './types';
import { fetchChats, fetchChatMessages, sendMessage } from './api';

export default function ChatsTab() {
  const [chats, setChats] = useState<PlayerokChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<PlayerokChat | null>(null);
  const [messages, setMessages] = useState<PlayerokChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadChats = async () => {
    setLoading(true);
    const data = await fetchChats();
    setChats(data);
    setLoading(false);
  };

  const openChat = async (chat: PlayerokChat) => {
    setSelectedChat(chat);
    setMsgLoading(true);
    const msgs = await fetchChatMessages(chat.id);
    setMessages(msgs.reverse());
    setMsgLoading(false);
  };

  const handleSend = async () => {
    if (!newMsg.trim() || !selectedChat || sending) return;
    setSending(true);
    const sent = await sendMessage(selectedChat.id, newMsg.trim());
    if (sent) {
      setMessages(prev => [...prev, sent]);
      setNewMsg('');
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getOtherMember = (chat: PlayerokChat) => {
    return chat.members?.find(m => m.username !== 'Spooky21291') || chat.members?.[0];
  };

  if (selectedChat) {
    const other = getOtherMember(selectedChat);
    return (
      <div className="flex flex-col h-[calc(100vh-200px)] bg-white dark:bg-[#1e1e1a] rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#252520]">
          <button onClick={() => setSelectedChat(null)} className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            {other?.avatar?.url ? (
              <img src={other.avatar.url} className="w-8 h-8 rounded-full" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-500" />
              </div>
            )}
            <div>
              <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{other?.username || 'Пользователь'}</span>
              {selectedChat.deal?.product && (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 block">
                  Товар: {selectedChat.deal.product.name}
                </span>
              )}
            </div>
          </div>
          {selectedChat.deal && (
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
              selectedChat.deal.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' :
              selectedChat.deal.status === 'PAID' ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300' :
              'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}>
              {selectedChat.deal.status}
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgLoading ? (
            <div className="text-center text-zinc-400 py-12 text-sm">Загрузка сообщений...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-zinc-400 py-12 text-sm">Нет сообщений</div>
          ) : (
            messages.map(msg => {
              const isMe = msg.user?.username === 'Spooky21291';
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-amber-500 text-white rounded-br-md' 
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-bl-md'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    <span className={`text-[9px] block mt-1 ${isMe ? 'text-amber-100' : 'text-zinc-400'}`}>
                      {new Date(msg.createdAt).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-[#252520]">
          <div className="flex items-center gap-2">
            <textarea
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Введите сообщение..."
              rows={1}
              className="flex-1 resize-none px-3 py-2 bg-white dark:bg-[#1e1e1a] border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              onClick={handleSend}
              disabled={!newMsg.trim() || sending}
              className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1e1e1a] rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-200/70 dark:border-zinc-800/75 flex items-center gap-2">
        <MessageCircle className="w-4.5 h-4.5 text-amber-500" />
        <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Чаты Playerok</span>
        <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-mono">{chats.length}</span>
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-400 text-sm">Загрузка чатов...</div>
      ) : chats.length === 0 ? (
        <div className="p-12 text-center text-zinc-400">
          <MessageCircle className="w-12 h-12 mx-auto stroke-1 text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="text-sm font-medium">Чаты не найдены</p>
          <p className="text-xs text-zinc-500/80 mt-1">Убедитесь, что токен авторизации указан в настройках</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {chats.map(chat => {
            const other = getOtherMember(chat);
            return (
              <button
                key={chat.id}
                onClick={() => openChat(chat)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 dark:hover:bg-[#252520] transition-colors cursor-pointer text-left"
              >
                <div className="relative">
                  {other?.avatar?.url ? (
                    <img src={other.avatar.url} className="w-10 h-10 rounded-full" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                      <User className="w-5 h-5 text-zinc-500" />
                    </div>
                  )}
                  {other?.isOnline && (
                    <Circle className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 fill-emerald-500 text-white dark:text-[#1e1e1a] stroke-2" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">{other?.username || 'Пользователь'}</span>
                    {chat.unreadMessagesCount > 0 && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {chat.unreadMessagesCount}
                      </span>
                    )}
                  </div>
                  {chat.lastMessage && (
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{chat.lastMessage.text}</p>
                  )}
                  {chat.deal?.product && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      {chat.deal.product.name}
                    </span>
                  )}
                </div>
                {chat.lastMessage && (
                  <span className="text-[10px] text-zinc-400 whitespace-nowrap">
                    {new Date(chat.lastMessage.createdAt).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
