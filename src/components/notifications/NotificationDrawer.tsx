import React, { useEffect, useState } from 'react';
import { Bell, Check, X, ShieldAlert, Package, FileText, Info } from 'lucide-react';
import { Notification } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string, orderId?: string) => void;
}

export const NotificationDrawer: React.FC<Props> = ({ isOpen, onClose, onNavigate }) => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/customer/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen, token]);

  const markAsRead = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/customer/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <Package className="w-4 h-4 text-sky-600" />;
      case 'prescription':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'inventory':
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              <p className="text-xs text-slate-500">
                {notifications.filter((n) => !n.isRead).length} unread updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
          {loading && notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
              <p className="text-sm font-medium text-slate-700">No notifications yet</p>
              <p className="text-xs text-slate-400 mt-1">Updates regarding your orders and prescriptions will appear here.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition-colors ${
                  item.isRead
                    ? 'bg-white border-slate-200'
                    : 'bg-sky-50/50 border-sky-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs mt-0.5 shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-slate-900 truncate">{item.title}</h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                    <div className="mt-2 flex items-center justify-between">
                      {item.link && onNavigate ? (
                        <button
                          onClick={() => {
                            onClose();
                            if (item.type === 'order') onNavigate('orders');
                            else if (item.type === 'prescription') onNavigate('prescriptions');
                          }}
                          className="text-[11px] font-semibold text-sky-600 hover:text-sky-700"
                        >
                          View Details &rarr;
                        </button>
                      ) : <span />}
                      {!item.isRead && (
                        <button
                          onClick={() => markAsRead(item.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800"
                        >
                          <Check className="w-3.5 h-3.5" /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-2xs hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
