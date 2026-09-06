import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MessageCircle, MessagesSquare, Package, Search, Store, X } from 'lucide-react';
import { supabase } from '@/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ChatBox from './ChatBox';

interface DockProps {
  actorData: {
    id?: string;
    ActorName?: string;
    email?: string;
  };
}

interface ConversationSummary {
  id: string;
  client_name: string;
  last_message_content: string | null;
  last_message_timestamp: string | null;
}

interface OrderSummary {
  id: string;
  order_id_string: string;
  client_name: string;
  client_email: string;
  service_type: string;
  status: string;
  total_price: number | null;
  last_message_sender_role: 'client' | 'actor' | null;
  actor_has_unread_messages: boolean;
  deliveries: { id: string; created_at: string; file_url: string; version_number: number }[];
}

type DockView = 'menu' | 'conversations' | 'orders' | 'stores';

const FloatingCommunicationDock: React.FC<DockProps> = ({ actorData }) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeckExpanded, setIsDeckExpanded] = useState(false);
  const dockRef = useRef<HTMLElement>(null);
  const [view, setView] = useState<DockView>('menu');
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [search, setSearch] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const loadDockData = useCallback(async () => {
    if (!actorData.id) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const [{ data: conversationRows }, { data: orderRows }] = await Promise.all([
      supabase.from('conversations').select('id, client_user_id, last_message_content, last_message_timestamp').eq('actor_user_id', user.id).order('last_message_timestamp', { ascending: false, nullsFirst: false }).limit(20),
      supabase.from('orders').select('id, order_id_string, client_name, client_email, service_type, status, total_price, last_message_sender_role, actor_has_unread_messages, deliveries(*)').eq('actor_id', actorData.id).order('created_at', { ascending: false }).limit(30),
    ]);

    const clientIds = (conversationRows || []).map((conversation) => conversation.client_user_id).filter(Boolean);
    const { data: clients } = clientIds.length ? await supabase.from('clients').select('user_id, full_name').in('user_id', clientIds) : { data: [] };
    const clientNames = new Map((clients || []).map((client) => [client.user_id, client.full_name || 'Client']));

    setConversations((conversationRows || []).map((conversation) => ({
      id: conversation.id,
      client_name: clientNames.get(conversation.client_user_id) || 'Client',
      last_message_content: conversation.last_message_content,
      last_message_timestamp: conversation.last_message_timestamp,
    })));
    setOrders((orderRows || []) as OrderSummary[]);
    setLoading(false);
  }, [actorData.id]);

  useEffect(() => { loadDockData(); }, [loadDockData]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) {
        setIsDeckExpanded(false);
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const filteredConversations = conversations.filter((conversation) => !search || `${conversation.client_name} ${conversation.last_message_content || ''}`.toLowerCase().includes(search.toLowerCase()));
  const filteredOrders = orders.filter((order) => !search || `${order.client_name} ${order.order_id_string} ${order.service_type}`.toLowerCase().includes(search.toLowerCase()));
  const unreadOrders = orders.filter((order) => order.actor_has_unread_messages).length;
  const dockViews: DockView[] = unreadOrders > 0
    ? ['orders', 'conversations', 'stores']
    : ['conversations', 'orders', 'stores'];

  const openConversation = (conversationId: string) => {
    setIsExpanded(false);
    setIsDeckExpanded(false);
    navigate(`/dashboard/messages/${conversationId}`);
  };

  const openOrder = (order: OrderSummary) => {
    setSelectedOrder(order);
    setView('orders');
    setIsExpanded(true);
  };

  const handleCircleClick = (dockView: DockView) => {
    if (!isDeckExpanded) {
      setIsDeckExpanded(true);
      return;
    }
    setView(dockView);
    setIsExpanded(true);
  };

  const viewTitle = view === 'conversations' ? 'Conversations' : view === 'orders' ? 'Order chats' : 'Store chats';

  return <>
    {isExpanded && <div className="fixed inset-0 z-[59] bg-black/10 md:hidden" onClick={() => setIsExpanded(false)} />}
    <aside ref={dockRef} className={`fixed bottom-20 right-3 z-[60] flex flex-row-reverse items-end gap-3 md:bottom-6 md:right-6 ${isExpanded ? 'w-[min(390px,calc(100vw-1.5rem))]' : 'w-auto'}`}>
      {isExpanded && <div className="absolute bottom-14 right-0 w-[min(390px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-background/95 shadow-2xl backdrop-blur-xl md:bottom-14">
        <div className="flex items-center justify-between border-b bg-muted/30 p-4">
          <div className="flex items-center gap-2"><MessagesSquare className="h-5 w-5 text-primary" /><div><p className="font-bold">{viewTitle}</p><p className="text-xs text-muted-foreground">Quick access workspace</p></div></div>
          <Button variant="ghost" size="icon" onClick={() => setIsExpanded(false)} title="Close communication dock"><X className="h-4 w-4" /></Button>
        </div>
        {view === 'menu' ? <div className="grid gap-2 p-3">
          <button onClick={() => setView('orders')} className="flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted"><div className="rounded-lg bg-primary/10 p-2 text-primary"><Package className="h-5 w-5" /></div><div className="flex-1"><p className="font-semibold">Orders</p><p className="text-xs text-muted-foreground">Project chats and delivery</p></div>{unreadOrders > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{unreadOrders}</span>}<ChevronRight className="h-4 w-4" /></button>
          <button onClick={() => setView('conversations')} className="flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted"><div className="rounded-lg bg-primary/10 p-2 text-primary"><MessageCircle className="h-5 w-5" /></div><div className="flex-1"><p className="font-semibold">Conversations</p><p className="text-xs text-muted-foreground">Messages from actor profiles</p></div><ChevronRight className="h-4 w-4" /></button>
          <button onClick={() => setView('stores')} className="flex items-center gap-3 rounded-xl border p-3 text-left hover:bg-muted"><div className="rounded-lg bg-primary/10 p-2 text-primary"><Store className="h-5 w-5" /></div><div className="flex-1"><p className="font-semibold">Store chats</p><p className="text-xs text-muted-foreground">Ready for store messaging</p></div><ChevronRight className="h-4 w-4" /></button>
        </div> : <>
          <div className="flex items-center gap-2 border-b p-3"><Button variant="ghost" size="icon" onClick={() => { setView('menu'); setSelectedOrder(null); }} title="Back to communication menu"><ChevronLeft className="h-4 w-4" /></Button><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations" className="h-9 pl-8" /></div></div>
          {view === 'orders' && selectedOrder ? <div className="p-0"><ChatBox orderId={selectedOrder.id} userRole="actor" orderData={{ last_message_sender_role: selectedOrder.last_message_sender_role, client_email: selectedOrder.client_email, client_name: selectedOrder.client_name, actor_email: actorData.email || '', actor_name: actorData.ActorName || 'You', order_id_string: selectedOrder.order_id_string }} conversationId="" currentUserId="" otherUserName={selectedOrder.client_name} /></div> : <div className="max-h-[min(55vh,480px)] overflow-y-auto p-3">
            {loading ? <p className="p-6 text-center text-sm text-muted-foreground">Loading...</p> : view === 'conversations' ? filteredConversations.map((conversation) => <button key={conversation.id} onClick={() => openConversation(conversation.id)} className="flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-muted"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="font-semibold">{conversation.client_name}</p><p className="truncate text-xs text-muted-foreground">{conversation.last_message_content || 'No messages yet'}</p></div></button>) : view === 'orders' ? filteredOrders.map((order) => <button key={order.id} onClick={() => openOrder(order)} className="flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-muted"><Package className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><p className="font-semibold">{order.client_name}</p>{order.actor_has_unread_messages && <span className="h-2 w-2 rounded-full bg-primary" />}</div><p className="truncate text-xs text-muted-foreground">#{order.order_id_string} · {order.service_type.replace('_', ' ')}</p></div></button>) : <div className="space-y-3"><label className="text-xs font-semibold text-muted-foreground">Store filter</label><select value={storeFilter} onChange={(event) => setStoreFilter(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="all">All stores</option><option value="main">Main store</option></select><div className="rounded-xl border border-dashed p-5 text-center"><Store className="mx-auto mb-2 h-6 w-6 text-muted-foreground" /><p className="text-sm font-semibold">Store chat is ready to connect</p><p className="mt-1 text-xs text-muted-foreground">Customer store conversations will appear here when store messaging is enabled.</p></div></div>}
            {!loading && view !== 'stores' && ((view === 'orders' && filteredOrders.length === 0) || (view === 'conversations' && filteredConversations.length === 0)) && <p className="p-6 text-center text-sm text-muted-foreground">Nothing found.</p>}
          </div>}
        </>}
      </div>}
      <div className="flex flex-row items-center">
        <div className={isDeckExpanded ? 'relative flex flex-row items-center gap-2' : 'relative h-11 w-[5.75rem]'}>
          {dockViews.map((dockView, index) => {
            const circleStyle = dockView === 'orders'
              ? 'from-orange-500 to-rose-600'
              : dockView === 'conversations'
                ? 'from-cyan-400 to-blue-600'
                : 'from-fuchsia-500 to-violet-600';
            return <button key={dockView} style={isDeckExpanded ? { zIndex: 10 - index } : { zIndex: 10 - index, left: `${(dockViews.length - 1 - index) * 18}px` }} onClick={() => handleCircleClick(dockView)} title={dockView === 'orders' ? 'Order chats' : dockView === 'conversations' ? 'Profile conversations' : 'Store chats'} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${circleStyle} text-white shadow-lg shadow-black/20 ring-2 ring-background/80 transition hover:scale-110 ${isDeckExpanded ? 'relative' : 'absolute top-0'}`}>
              {dockView === 'orders' ? <Package className="h-5 w-5" /> : dockView === 'conversations' ? <MessageCircle className="h-5 w-5" /> : <Store className="h-5 w-5" />}
              {dockView === 'orders' && unreadOrders > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-rose-600 shadow">{unreadOrders}</span>}
            </button>;
          })}
        </div>
      </div>
    </aside>
  </>;
};

export default FloatingCommunicationDock;
