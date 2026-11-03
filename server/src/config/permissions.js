const PERMISSIONS = [
  { key: 'bookings', label: 'Bookings', hint: 'View, approve, assign and cancel bookings' },
  { key: 'services', label: 'Services', hint: 'Add and edit services and prices' },
  { key: 'categories', label: 'Categories', hint: 'Manage categories, SEO and FAQs' },
  { key: 'blogs', label: 'Blog', hint: 'Write, publish and delete posts' },
  { key: 'technicians', label: 'Technicians', hint: 'Add and manage technicians' },
  { key: 'customers', label: 'Customers', hint: 'View and deactivate customers' },
  { key: 'payments', label: 'Payments', hint: 'View payments and issue refunds' },
  { key: 'reviews', label: 'Reviews', hint: 'Hide or show customer reviews' },
  { key: 'messages', label: 'Messages', hint: 'Read contact form messages' },
  { key: 'audit', label: 'Activity log', hint: 'See who did what' },
  { key: 'settings', label: 'Settings', hint: 'Slots, cancellation rules, COD' },
  { key: 'coupons', label: 'Coupons', hint: 'Create and manage coupons' },
  { key: 'applications', label: 'Applications', hint: 'Approve technician applications' },
];

exports.PERMISSIONS = PERMISSIONS;
exports.PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);