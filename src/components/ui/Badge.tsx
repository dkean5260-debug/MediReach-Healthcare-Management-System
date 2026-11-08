import React from 'react';

export function StatusBadge({ status }: { status: string }) {
  const getStyle = () => {
    switch (status) {
      case 'Approved':
      case 'Delivered':
      case 'Paid (Sandbox)':
        return 'text-emerald-700 bg-emerald-50 border border-emerald-200';
      case 'Out for Delivery':
      case 'Ready for Delivery':
      case 'Processing':
        return 'text-sky-700 bg-sky-50 border border-sky-200';
      case 'Confirmed':
      case 'Open':
        return 'text-blue-700 bg-blue-50 border border-blue-200';
      case 'Pending Review':
      case 'Pending Verification':
      case 'Under Verification':
      case 'In Progress':
        return 'text-amber-700 bg-amber-50 border border-amber-200';
      case 'Rejected':
      case 'Cancelled':
        return 'text-rose-700 bg-rose-50 border border-rose-200';
      default:
        return 'text-slate-700 bg-slate-100 border border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStyle()}`}>
      {status}
    </span>
  );
}

export function ColdChainBadge({ temp }: { temp?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-cyan-800 bg-cyan-50 border border-cyan-200">
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
      Cold-Chain {temp || '2°C - 8°C'}
    </span>
  );
}

export function RxBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 tracking-wide">
      Rx ONLY
    </span>
  );
}
