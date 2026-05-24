import { PlayerokChat, PlayerokChatMessage, PlayerokDealFull, PlayerokProduct, PlayerokUser } from './types';

const API_BASE = 'http://localhost:3001';
const TOKEN_KEY = 'playerok_auth_token';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function headers() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`,
  };
}

export async function fetchMe(): Promise<PlayerokUser | null> {
  try {
    const res = await fetch(`${API_BASE}/api/me`, { headers: headers() });
    const data = await res.json();
    return data?.data?.viewer || null;
  } catch {
    return null;
  }
}

export async function fetchChats(first = 20): Promise<PlayerokChat[]> {
  try {
    const res = await fetch(`${API_BASE}/api/chats?first=${first}`, { headers: headers() });
    const data = await res.json();
    return data?.data?.chats?.edges?.map((e: any) => e.node) || [];
  } catch {
    return [];
  }
}

export async function fetchChatMessages(chatId: string, first = 30): Promise<PlayerokChatMessage[]> {
  try {
    const res = await fetch(`${API_BASE}/api/chats/${chatId}/messages?first=${first}`, { headers: headers() });
    const data = await res.json();
    return data?.data?.chatMessages?.edges?.map((e: any) => e.node) || [];
  } catch {
    return [];
  }
}

export async function sendMessage(chatId: string, text: string): Promise<PlayerokChatMessage | null> {
  try {
    const res = await fetch(`${API_BASE}/api/chats/${chatId}/send`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    return data?.data?.sendChatMessage || null;
  } catch {
    return null;
  }
}

export async function fetchDeals(first = 20, status?: string): Promise<PlayerokDealFull[]> {
  try {
    const url = `${API_BASE}/api/deals?first=${first}${status ? `&status=${status}` : ''}`;
    const res = await fetch(url, { headers: headers() });
    const data = await res.json();
    return data?.data?.deals?.edges?.map((e: any) => e.node) || [];
  } catch {
    return [];
  }
}

export async function fetchProducts(first = 20): Promise<PlayerokProduct[]> {
  try {
    const res = await fetch(`${API_BASE}/api/products?first=${first}`, { headers: headers() });
    const data = await res.json();
    return data?.data?.viewer?.products?.edges?.map((e: any) => e.node) || [];
  } catch {
    return [];
  }
}
