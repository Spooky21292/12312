export type ItemStatus = 'active' | 'pause';

export interface ProductItem {
  id: number;
  name: string;
  cat: string;
  status: ItemStatus;
  buy: number; // Purchase price per unit (закупка)
  sell: number; // Retail price per unit (продажа)
  comm: number; // Playerok commission in %
  quantity: number; // In stock quantity (в наличии)
  soldCount: number; // Sold count (продано)
  date: string; // Added date
}

export interface SaleRecord {
  id: string;
  itemId: number;
  itemName: string;
  sellPrice: number;
  buyPrice: number;
  commission: number;
  revenue: number;
  profit: number;
  date: string;
}

// ===== Playerok API Types =====

export interface PlayerokUser {
  id: string;
  username: string;
  email?: string;
  balance?: number;
  avatar?: { url: string };
  role?: string;
  isOnline?: boolean;
}

export interface PlayerokChatMessage {
  id: string;
  text: string;
  createdAt: string;
  user: PlayerokUser;
  file?: { url: string; name: string };
}

export interface PlayerokDeal {
  id: string;
  status: string;
  totalPrice?: number;
  product?: { id: string; name: string; slug: string };
}

export interface PlayerokChat {
  id: string;
  unreadMessagesCount: number;
  lastMessage?: PlayerokChatMessage;
  members: PlayerokUser[];
  deal?: PlayerokDeal;
}

export interface PlayerokDealFull {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  completedAt?: string;
  buyer: PlayerokUser;
  seller: PlayerokUser;
  product: {
    id: string;
    name: string;
    slug: string;
    images?: { url: string }[];
  };
  chat?: { id: string };
}

export interface PlayerokProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: string;
  category?: { id: string; name: string };
  images?: { url: string }[];
  dealsCount: number;
  viewsCount: number;
  createdAt: string;
}

export type AppTab = 'warehouse' | 'chats' | 'deals' | 'settings';
