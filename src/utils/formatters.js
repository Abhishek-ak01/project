// Formatting utilities for LocalLoop

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function getStatusBadge(status) {
  const configs = {
    placed: { label: 'Order Placed', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    confirmed: { label: 'Confirmed', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
    preparing: { label: 'Preparing Fresh', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
    ready: { label: 'Ready for Pickup / Delivery', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    completed: { label: 'Completed', bg: 'bg-forest-50 text-forest-800 border-forest-200' },
    cancelled: { label: 'Cancelled', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
  };

  return configs[status] || { label: status, bg: 'bg-gray-50 text-gray-800 border-gray-200' };
}
