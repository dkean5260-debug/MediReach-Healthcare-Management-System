import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword, generateToken, parseToken } from './src/server/db.ts';
import { User, Medicine, Prescription, Order, SupportTicket } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '20mb' }));

// Helper to authenticate request
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const payload = parseToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
    return;
  }
  const user = db.getRaw().users.find((u) => u.id === payload.userId && u.isActive);
  if (!user) {
    res.status(401).json({ error: 'User account not found or suspended.' });
    return;
  }
  (req as any).user = user;
  next();
}

function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as User;
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource.' });
      return;
    }
    next();
  };
}

/* ==========================================================================
   PUBLIC & AUTH ROUTES
   ========================================================================== */

// Register customer account (ONLY customers can register publicly)
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password || !phone) {
    res.status(400).json({ error: 'Please provide full name, email, phone number, and password.' });
    return;
  }

  const emailClean = String(email).trim().toLowerCase();
  const existing = db.getRaw().users.find((u) => u.email.toLowerCase() === emailClean);
  if (existing) {
    res.status(409).json({ error: 'An account with this email address already exists.' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters in length.' });
    return;
  }

  const newUser: any = {
    id: 'usr_cust_' + Date.now(),
    role: 'customer', // strictly customer
    email: emailClean,
    name: String(name).trim(),
    phone: String(phone).trim(),
    isActive: true,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  db.getRaw().users.push(newUser);

  // Create welcome notification
  db.addNotification(
    newUser.id,
    'customer',
    'Welcome to MediReach!',
    'Your customer account has been created. You can now browse specialized medicines and upload prescriptions.',
    'system'
  );

  db.addAuditLog(newUser, 'CUSTOMER_REGISTERED', 'auth', `Customer ${newUser.name} registered account.`);
  db.persist();

  const token = generateToken(newUser);
  const { passwordHash, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, token });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Please enter both email and password.' });
    return;
  }

  const emailClean = String(email).trim().toLowerCase();
  const user = db.getRaw().users.find((u) => u.email.toLowerCase() === emailClean);

  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: 'Invalid email or password. Please verify your credentials.' });
    return;
  }

  if (!user.isActive) {
    res.status(403).json({ error: 'This account has been deactivated or suspended. Please contact pharmacy administration.' });
    return;
  }

  user.lastLogin = new Date().toISOString();
  db.addAuditLog(user, 'USER_LOGIN', 'auth', `User logged in with role: ${user.role}`);
  db.persist();

  const token = generateToken(user);
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

// Get current user profile
app.get('/api/auth/me', authenticate, (req, res) => {
  const user = (req as any).user;
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
});

// Update personal profile
app.put('/api/auth/profile', authenticate, (req, res) => {
  const user = (req as any).user;
  const { name, phone } = req.body;
  if (name) user.name = String(name).trim();
  if (phone) user.phone = String(phone).trim();
  db.persist();
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, message: 'Profile updated successfully.' });
});

// Change password
app.put('/api/auth/change-password', authenticate, (req, res) => {
  const user = (req as any).user;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Both current password and new password are required.' });
    return;
  }
  if (user.passwordHash !== hashPassword(currentPassword)) {
    res.status(400).json({ error: 'Current password does not match.' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    return;
  }
  user.passwordHash = hashPassword(newPassword);
  db.addAuditLog(user, 'PASSWORD_CHANGED', 'auth', 'User changed their password.');
  db.persist();
  res.json({ message: 'Password updated successfully.' });
});

// Reset password request (sandbox flow)
app.post('/api/auth/reset-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: 'Please provide your account email.' });
    return;
  }
  const emailClean = String(email).trim().toLowerCase();
  const user = db.getRaw().users.find((u) => u.email.toLowerCase() === emailClean);
  if (!user) {
    res.status(404).json({ error: 'No account found with this email address.' });
    return;
  }
  // In sandbox, reset password to "Reset123!"
  user.passwordHash = hashPassword('Reset123!');
  db.addAuditLog(user, 'PASSWORD_RESET', 'auth', `Password reset token requested for ${user.email}.`);
  db.persist();
  res.json({
    message: 'Temporary password reset instructions sent. For demonstration, your password has been reset to: Reset123!',
    tempPassword: 'Reset123!',
  });
});

/* ==========================================================================
   MEDICINES & CATALOG (Public read)
   ========================================================================== */

app.get('/api/medicines', (req, res) => {
  const { search, category, brand, condition, inStock, requiresPrescription, sortBy } = req.query;
  let items = db.getRaw().medicines.filter((m) => !m.isArchived);

  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        m.condition.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }

  if (category && category !== 'All') {
    items = items.filter((m) => m.category === category);
  }

  if (brand && brand !== 'All') {
    items = items.filter((m) => m.brand === brand);
  }

  if (condition && condition !== 'All') {
    items = items.filter((m) => m.condition === condition);
  }

  if (inStock === 'true') {
    items = items.filter((m) => m.stock > 0);
  }

  if (requiresPrescription === 'true') {
    items = items.filter((m) => m.requiresPrescription);
  } else if (requiresPrescription === 'false') {
    items = items.filter((m) => !m.requiresPrescription);
  }

  if (sortBy === 'price_asc') {
    items.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price_desc') {
    items.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'name') {
    items.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Default popularity
    items.sort((a, b) => b.popularity - a.popularity);
  }

  res.json({ medicines: items });
});

app.get('/api/medicines/:id', (req, res) => {
  const med = db.getRaw().medicines.find((m) => m.id === req.params.id);
  if (!med) {
    res.status(404).json({ error: 'Medicine not found' });
    return;
  }
  res.json({ medicine: med });
});

app.get('/api/categories', (req, res) => {
  const categories = Array.from(new Set(db.getRaw().medicines.map((m) => m.category)));
  res.json({ categories });
});

app.get('/api/brands', (req, res) => {
  const brands = Array.from(new Set(db.getRaw().medicines.map((m) => m.brand)));
  res.json({ brands });
});

/* ==========================================================================
   CUSTOMER ROUTES (Protected)
   ========================================================================== */

// Customer Favorites
app.get('/api/customer/favorites', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const favIds = db.getRaw().favorites.filter((f) => f.userId === user.id).map((f) => f.medicineId);
  const medicines = db.getRaw().medicines.filter((m) => favIds.includes(m.id));
  res.json({ favorites: favIds, medicines });
});

app.post('/api/customer/favorites/toggle', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const { medicineId } = req.body;
  if (!medicineId) {
    res.status(400).json({ error: 'Medicine ID required' });
    return;
  }
  const index = db.getRaw().favorites.findIndex((f) => f.userId === user.id && f.medicineId === medicineId);
  let isFavorited = false;
  if (index >= 0) {
    db.getRaw().favorites.splice(index, 1);
  } else {
    db.getRaw().favorites.push({
      id: 'fav_' + Date.now(),
      userId: user.id,
      medicineId,
    });
    isFavorited = true;
  }
  db.persist();
  res.json({ isFavorited });
});

// Addresses
app.get('/api/customer/addresses', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const addrs = db.getRaw().addresses.filter((a) => a.customerId === user.id);
  res.json({ addresses: addrs });
});

app.post('/api/customer/addresses', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const { label, recipientName, street, city, state, postalCode, phone, deliveryInstructions, isDefault } = req.body;

  if (!recipientName || !street || !city || !state || !postalCode || !phone) {
    res.status(400).json({ error: 'Please provide recipient name, street, city, state, zip, and phone.' });
    return;
  }

  if (isDefault) {
    db.getRaw().addresses.forEach((a) => {
      if (a.customerId === user.id) a.isDefault = false;
    });
  }

  const newAddr = {
    id: 'addr_' + Date.now(),
    customerId: user.id,
    label: label || 'Home',
    recipientName,
    street,
    city,
    state,
    postalCode,
    phone,
    deliveryInstructions,
    isDefault: !!isDefault,
  };

  db.getRaw().addresses.push(newAddr);
  db.persist();
  res.status(201).json({ address: newAddr });
});

app.delete('/api/customer/addresses/:id', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const index = db.getRaw().addresses.findIndex((a) => a.id === req.params.id && a.customerId === user.id);
  if (index >= 0) {
    db.getRaw().addresses.splice(index, 1);
    db.persist();
    res.json({ message: 'Address removed successfully.' });
  } else {
    res.status(404).json({ error: 'Address not found' });
  }
});

// Prescriptions
app.get('/api/customer/prescriptions', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const rxs = db.getRaw().prescriptions.filter((p) => p.customerId === user.id);
  res.json({ prescriptions: rxs });
});

app.post('/api/customer/prescriptions', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const { doctorName, clinicHospital, licenseRegNo, issueDate, documentName, documentUrl, medicineIds, notes } = req.body;

  if (!doctorName || !clinicHospital || !licenseRegNo || !issueDate) {
    res.status(400).json({ error: 'Doctor name, clinic/hospital, license registration, and issue date are required.' });
    return;
  }

  const newRx: Prescription = {
    id: 'rx_' + Date.now(),
    customerId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    customerPhone: user.phone,
    medicineIds: Array.isArray(medicineIds) ? medicineIds : [],
    documentName: documentName || 'Prescription_Document.pdf',
    documentUrl: documentUrl || '/src/assets/images/rx_sample_prescription_1794104817239.jpg',
    fileType: 'image/jpeg',
    doctorName: String(doctorName).trim(),
    clinicHospital: String(clinicHospital).trim(),
    licenseRegNo: String(licenseRegNo).trim(),
    issueDate,
    status: 'Pending Review',
    notes,
    createdAt: new Date().toISOString(),
  };

  db.getRaw().prescriptions.unshift(newRx);

  // Notify Staff & Customer
  db.addNotification(
    user.id,
    'customer',
    'Prescription Uploaded',
    `Your prescription from ${newRx.doctorName} has been received and queued for licensed pharmacist verification.`,
    'prescription'
  );

  db.addNotification(
    'all_staff',
    'staff',
    'New Prescription Pending Review',
    `Customer ${user.name} submitted a prescription for verification.`,
    'prescription'
  );

  db.addAuditLog(user, 'PRESCRIPTION_UPLOADED', 'prescription', `Uploaded prescription from ${newRx.doctorName} (ID: ${newRx.id})`);
  db.persist();

  res.status(201).json({ prescription: newRx });
});

// Orders
app.get('/api/customer/orders', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const orders = db.getRaw().orders.filter((o) => o.customerId === user.id);
  res.json({ orders });
});

app.get('/api/customer/orders/:id', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const order = db.getRaw().orders.find((o) => o.id === req.params.id && o.customerId === user.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json({ order });
});

// Place order with atomic stock validation & cold chain fee calculation
app.post('/api/customer/orders', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const { items, shippingAddressId, paymentMethod, deliveryInstructions } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Your cart is empty. Please add medicines to order.' });
    return;
  }

  // Find address
  const address = db.getRaw().addresses.find((a) => a.id === shippingAddressId && a.customerId === user.id);
  if (!address) {
    res.status(400).json({ error: 'Please select a valid delivery address.' });
    return;
  }

  // Check inventory & prescription compliance
  const customerApprovedRxs = db.getRaw().prescriptions.filter(
    (p) => p.customerId === user.id && p.status === 'Approved'
  );

  let subtotal = 0;
  let hasColdChain = false;
  const verifiedItems: any[] = [];

  for (const it of items) {
    const med = db.getRaw().medicines.find((m) => m.id === it.medicineId && !m.isArchived);
    if (!med) {
      res.status(400).json({ error: `Medicine with ID ${it.medicineId} not available in catalog.` });
      return;
    }

    const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
    if (med.stock < qty) {
      res.status(400).json({
        error: `Insufficient inventory for ${med.name}. Only ${med.stock} units currently available.`,
      });
      return;
    }

    if (med.requiresPrescription) {
      // Find valid approved Rx
      const hasValidRx = customerApprovedRxs.some(
        (rx) => !rx.medicineIds || rx.medicineIds.length === 0 || rx.medicineIds.includes(med.id)
      );
      if (!hasValidRx) {
        res.status(400).json({
          error: `Prescription verification required: "${med.name}" requires an approved prescription. Please upload your prescription document first.`,
        });
        return;
      }
    }

    if (med.coldChain) {
      hasColdChain = true;
    }

    subtotal += med.price * qty;
    verifiedItems.push({
      medicineId: med.id,
      name: med.name,
      brand: med.brand,
      dosageForm: med.dosageForm,
      price: med.price,
      quantity: qty,
      requiresPrescription: med.requiresPrescription,
      imageUrl: med.imageUrl,
    });
  }

  const settings = db.getRaw().settings;
  const deliveryFee = subtotal >= settings.freeShippingThreshold ? 0 : settings.defaultDeliveryFee;
  const coldChainFee = hasColdChain ? settings.coldChainFee : 0;
  const total = subtotal + deliveryFee + coldChainFee;

  // Atomically deduct inventory & record transactions
  for (const it of verifiedItems) {
    const med = db.getRaw().medicines.find((m) => m.id === it.medicineId)!;
    med.stock -= it.quantity;

    db.getRaw().inventoryTransactions.push({
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      medicineId: med.id,
      medicineName: med.name,
      changeType: 'order_deduction',
      quantity: -it.quantity,
      resultingStock: med.stock,
      reason: `Order placement reserve`,
      staffId: 'system',
      staffName: 'Automated Pharmacy Allocation',
      timestamp: new Date().toISOString(),
    });

    if (med.stock <= med.minStockAlert) {
      db.addNotification(
        'all_staff',
        'staff',
        `Low Stock Alert: ${med.name}`,
        `${med.name} stock has dropped to ${med.stock} units (threshold: ${med.minStockAlert}).`,
        'inventory'
      );
    }
  }

  const orderNum = 'MR-' + Math.floor(1000 + Math.random() * 9000);
  const now = new Date().toISOString();

  const newOrder: Order = {
    id: 'ord_' + Date.now(),
    orderNumber: orderNum,
    orderDate: now,
    customerId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    customerPhone: user.phone,
    items: verifiedItems,
    subtotal,
    deliveryFee,
    coldChainFee,
    total,
    status: 'Order Placed',
    paymentStatus: 'Paid (Sandbox)',
    paymentMethod: paymentMethod || 'Credit / Debit Card',
    shippingAddress: {
      ...address,
      deliveryInstructions: deliveryInstructions || address.deliveryInstructions,
    },
    coldChainAssurance: hasColdChain,
    currentTemp: hasColdChain ? '3.8°C' : undefined,
    tracking: {
      courierName: 'MediReach Rapid CryoExpress',
      courierPhone: '+1 (800) 555-7273',
      trackingNumber: 'MRC-' + Math.floor(100000 + Math.random() * 900000),
      estimatedDelivery: 'Within 24 Hours',
      timeline: [
        {
          step: 'Order Placed',
          timestamp: now,
          note: `Order placed and payment authorized in sandbox gateway (${paymentMethod}).`,
          actor: user.name,
        },
      ],
    },
    createdAt: now,
    updatedAt: now,
  };

  db.getRaw().orders.unshift(newOrder);

  // Notifications
  db.addNotification(
    user.id,
    'customer',
    `Order Confirmed: ${newOrder.orderNumber}`,
    `We have received your order of ₱${total.toFixed(2)}. Licensed pharmacists will prepare your cold-chain shipment.`,
    'order',
    `/orders/${newOrder.id}`
  );

  db.addNotification(
    'all_staff',
    'staff',
    `Incoming Order: ${newOrder.orderNumber}`,
    `New order of ${verifiedItems.length} items submitted by ${user.name}.`,
    'order'
  );

  db.addAuditLog(user, 'ORDER_PLACED', 'order', `Placed order #${newOrder.orderNumber} (₱${total.toFixed(2)})`);
  db.persist();

  res.status(201).json({ order: newOrder });
});

// Cancel eligible order
app.post('/api/customer/orders/:id/cancel', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const order = db.getRaw().orders.find((o) => o.id === req.params.id && o.customerId === user.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const cancelableStatuses = ['Order Placed', 'Pending Verification', 'Confirmed'];
  if (!cancelableStatuses.includes(order.status)) {
    res.status(400).json({
      error: `Order cannot be cancelled at status "${order.status}". Please contact pharmacy support.`,
    });
    return;
  }

  const reason = req.body.reason || 'Customer cancelled via application';
  order.status = 'Cancelled';
  order.cancellationReason = reason;
  order.paymentStatus = 'Refunded (Sandbox)';
  order.updatedAt = new Date().toISOString();
  order.tracking.timeline.push({
    step: 'Cancelled',
    timestamp: new Date().toISOString(),
    note: `Order cancelled. Reason: ${reason}. Refund initiated to original payment method.`,
    actor: user.name,
  });

  // Restock inventory
  for (const it of order.items) {
    const med = db.getRaw().medicines.find((m) => m.id === it.medicineId);
    if (med) {
      med.stock += it.quantity;
      db.getRaw().inventoryTransactions.push({
        id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        medicineId: med.id,
        medicineName: med.name,
        changeType: 'order_restock',
        quantity: it.quantity,
        resultingStock: med.stock,
        reason: `Restocked after order #${order.orderNumber} cancellation`,
        staffId: user.id,
        staffName: user.name,
        timestamp: new Date().toISOString(),
      });
    }
  }

  db.addNotification(
    user.id,
    'customer',
    `Order ${order.orderNumber} Cancelled`,
    `Your order has been cancelled and sandbox refund of ₱${order.total.toFixed(2)} processed.`,
    'order'
  );

  db.addAuditLog(user, 'ORDER_CANCELLED', 'order', `Cancelled order #${order.orderNumber}`);
  db.persist();

  res.json({ order, message: 'Order successfully cancelled and inventory restocked.' });
});

// Notifications
app.get('/api/customer/notifications', authenticate, (req, res) => {
  const user = (req as any).user;
  const notifs = db.getRaw().notifications.filter(
    (n) => n.userId === user.id || n.roleTarget === user.role || n.roleTarget === 'all'
  );
  res.json({ notifications: notifs });
});

app.put('/api/customer/notifications/:id/read', authenticate, (req, res) => {
  const user = (req as any).user;
  const notif = db.getRaw().notifications.find(
    (n) => n.id === req.params.id && (n.userId === user.id || n.roleTarget === user.role || n.roleTarget === 'all')
  );
  if (notif) {
    notif.isRead = true;
    db.persist();
  }
  res.json({ success: true });
});

// Customer Support Tickets
app.get('/api/customer/tickets', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const tickets = db.getRaw().tickets.filter((t) => t.customerId === user.id);
  res.json({ tickets });
});

app.post('/api/customer/tickets', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const { subject, category, message, priority } = req.body;

  if (!subject || !message) {
    res.status(400).json({ error: 'Subject and message are required.' });
    return;
  }

  const now = new Date().toISOString();
  const newTicket: SupportTicket = {
    id: 'tkt_' + Date.now(),
    ticketNumber: 'TKT-2026-' + Math.floor(100 + Math.random() * 900),
    customerId: user.id,
    customerName: user.name,
    customerEmail: user.email,
    subject: String(subject).trim(),
    category: category || 'Order Inquiry',
    status: 'Open',
    priority: priority || 'Normal',
    messages: [
      {
        id: 'msg_' + Date.now(),
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        text: String(message).trim(),
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  db.getRaw().tickets.unshift(newTicket);
  db.addNotification(
    'all_staff',
    'staff',
    `New Support Ticket: ${newTicket.ticketNumber}`,
    `Customer ${user.name} submitted ticket "${newTicket.subject}".`,
    'system'
  );
  db.persist();

  res.status(201).json({ ticket: newTicket });
});

app.post('/api/customer/tickets/:id/reply', authenticate, requireRole(['customer']), (req, res) => {
  const user = (req as any).user;
  const ticket = db.getRaw().tickets.find((t) => t.id === req.params.id && t.customerId === user.id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Reply text cannot be empty' });
    return;
  }
  const now = new Date().toISOString();
  ticket.messages.push({
    id: 'msg_' + Date.now(),
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    text: String(text).trim(),
    timestamp: now,
  });
  ticket.updatedAt = now;
  db.persist();
  res.json({ ticket });
});

/* ==========================================================================
   STAFF ROUTES (Protected: Staff & Admin)
   ========================================================================== */

app.get('/api/staff/overview', authenticate, requireRole(['staff', 'admin']), (req, res) => {
  const raw = db.getRaw();
  const todayStr = new Date().toISOString().slice(0, 10);
  const totalOrdersToday = raw.orders.filter((o) => o.orderDate.startsWith(todayStr)).length;
  const pendingOrders = raw.orders.filter((o) =>
    ['Order Placed', 'Pending Verification', 'Confirmed', 'Processing'].includes(o.status)
  ).length;
  const pendingPrescriptions = raw.prescriptions.filter((p) =>
    ['Pending Review', 'Under Verification'].includes(p.status)
  ).length;
  const availableMedicines = raw.medicines.filter((m) => !m.isArchived && m.stock > 0).length;
  const lowStockMedicines = raw.medicines.filter((m) => !m.isArchived && m.stock <= m.minStockAlert).length;
  const completedDeliveries = raw.orders.filter((o) => o.status === 'Delivered').length;

  res.json({
    totalOrdersToday,
    pendingOrders,
    pendingPrescriptions,
    availableMedicines,
    lowStockMedicines,
    completedDeliveries,
  });
});

app.get('/api/staff/orders', authenticate, requireRole(['staff', 'admin']), (req, res) => {
  const { status, search } = req.query;
  let list = [...db.getRaw().orders];
  if (status && status !== 'All') {
    list = list.filter((o) => o.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.tracking.trackingNumber.toLowerCase().includes(q)
    );
  }
  res.json({ orders: list });
});

app.put('/api/staff/orders/:id/status', authenticate, requireRole(['staff', 'admin']), (req, res) => {
  const staff = (req as any).user;
  const { status, note, courierName, trackingNumber, estimatedDelivery, currentTemp } = req.body;
  const order = db.getRaw().orders.find((o) => o.id === req.params.id);

  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();

  if (courierName) order.tracking.courierName = courierName;
  if (trackingNumber) order.tracking.trackingNumber = trackingNumber;
  if (estimatedDelivery) order.tracking.estimatedDelivery = estimatedDelivery;
  if (currentTemp) order.currentTemp = currentTemp;

  order.tracking.timeline.push({
    step: status,
    timestamp: new Date().toISOString(),
    note: note || `Status updated to ${status} by ${staff.name}`,
    actor: staff.name,
  });

  // Notify customer
  db.addNotification(
    order.customerId,
    'customer',
    `Order ${order.orderNumber} Update: ${status}`,
    note || `Your order status has progressed to ${status}.`,
    'order',
    `/orders/${order.id}`
  );

  db.addAuditLog(staff, 'ORDER_STATUS_UPDATED', 'order', `Updated order #${order.orderNumber} to ${status}`);
  db.persist();

  res.json({ order, message: `Order status updated to ${status}.` });
});

app.get('/api/staff/prescriptions', authenticate, requireRole(['staff', 'admin']), (req, res) => {
  const { status } = req.query;
  let list = [...db.getRaw().prescriptions];
  if (status && status !== 'All') {
    list = list.filter((p) => p.status === status);
  }
  res.json({ prescriptions: list });
});

app.put('/api/staff/prescriptions/:id/verify', authenticate, requireRole(['staff', 'admin']), (req, res) => {
  const staff = (req as any).user;
  const { status, notes, rejectionReason } = req.body;
  const rx = db.getRaw().prescriptions.find((p) => p.id === req.params.id);

  if (!rx) {
    res.status(404).json({ error: 'Prescription not found' });
    return;
  }

  if (!['Approved', 'Rejected', 'Under Verification'].includes(status)) {
    res.status(400).json({ error: 'Invalid verification decision.' });
    return;
  }

  rx.status = status;
  rx.notes = notes || rx.notes;
  rx.rejectionReason = status === 'Rejected' ? rejectionReason || 'Information does not match authorized physician registry.' : undefined;
  rx.verifiedByStaffId = staff.id;
  rx.verifiedByStaffName = staff.name;
  rx.verifiedAt = new Date().toISOString();

  const title = status === 'Approved' ? 'Prescription Approved' : status === 'Rejected' ? 'Prescription Rejected' : 'Prescription Under Review';
  const msg =
    status === 'Approved'
      ? `Your prescription document from ${rx.doctorName} has been approved by ${staff.name}. You may proceed with ordering.`
      : status === 'Rejected'
      ? `Prescription document was rejected. Reason: ${rx.rejectionReason}`
      : `Your prescription document is being verified with ${rx.clinicHospital}.`;

  db.addNotification(rx.customerId, 'customer', title, msg, 'prescription');
  db.addAuditLog(
    staff,
    status === 'Approved' ? 'PRESCRIPTION_APPROVED' : 'PRESCRIPTION_REJECTED',
    'prescription',
    `Prescription ${rx.id} verified as ${status} for customer ${rx.customerName}`
  );

  db.persist();
  res.json({ prescription: rx, message: `Prescription has been marked as ${status}.` });
});

app.get('/api/staff/inventory', authenticate, requireRole(['staff', 'admin']), (req, res) => {
  const medicines = db.getRaw().medicines.filter((m) => !m.isArchived);
  const transactions = db.getRaw().inventoryTransactions.slice(0, 50);
  res.json({ medicines, transactions });
});

app.post('/api/staff/inventory/adjust', authenticate, requireRole(['staff', 'admin']), (req, res) => {
  const staff = (req as any).user;
  const { medicineId, changeType, quantity, reason } = req.body;

  const med = db.getRaw().medicines.find((m) => m.id === medicineId);
  if (!med) {
    res.status(404).json({ error: 'Medicine not found' });
    return;
  }

  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty === 0) {
    res.status(400).json({ error: 'Quantity must be a non-zero integer' });
    return;
  }

  if (changeType === 'manual_reduction' && med.stock < Math.abs(qty)) {
    res.status(400).json({ error: `Cannot reduce more stock than available (${med.stock}).` });
    return;
  }

  const delta = changeType === 'manual_reduction' ? -Math.abs(qty) : Math.abs(qty);
  med.stock += delta;

  const tx = {
    id: 'tx_' + Date.now(),
    medicineId: med.id,
    medicineName: med.name,
    changeType,
    quantity: delta,
    resultingStock: med.stock,
    reason: reason || 'Manual inventory adjustment',
    staffId: staff.id,
    staffName: staff.name,
    timestamp: new Date().toISOString(),
  };

  db.getRaw().inventoryTransactions.unshift(tx);
  db.addAuditLog(
    staff,
    'INVENTORY_ADJUSTED',
    'inventory',
    `Adjusted ${med.name} by ${delta > 0 ? '+' : ''}${delta} to ${med.stock} (${reason})`
  );
  db.persist();

  res.json({ medicine: med, transaction: tx, message: 'Stock updated successfully.' });
});

// Staff reports
app.get('/api/staff/reports', authenticate, requireRole(['staff', 'admin']), (req, res) => {
  const raw = db.getRaw();
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayOrders = raw.orders.filter((o) => o.orderDate.startsWith(todayStr));
  const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);

  const statusBreakdown: Record<string, number> = {};
  raw.orders.forEach((o) => {
    statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
  });

  const lowStockList = raw.medicines.filter((m) => !m.isArchived && m.stock <= m.minStockAlert);

  res.json({
    todayStr,
    todayOrdersCount: todayOrders.length,
    todaySales,
    statusBreakdown,
    lowStockList,
  });
});

/* ==========================================================================
   ADMIN ROUTES (Strictly Administrator)
   ========================================================================== */

app.get('/api/admin/overview', authenticate, requireRole(['admin']), (req, res) => {
  const raw = db.getRaw();
  const totalCustomers = raw.users.filter((u) => u.role === 'customer').length;
  const totalStaff = raw.users.filter((u) => u.role === 'staff').length;
  const totalMedicines = raw.medicines.filter((m) => !m.isArchived).length;
  const totalOrders = raw.orders.length;
  const totalSales = raw.orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = raw.orders.filter((o) =>
    ['Order Placed', 'Pending Verification', 'Confirmed', 'Processing'].includes(o.status)
  ).length;
  const pendingPrescriptions = raw.prescriptions.filter((p) =>
    ['Pending Review', 'Under Verification'].includes(p.status)
  ).length;
  const lowStockAlerts = raw.medicines.filter((m) => !m.isArchived && m.stock <= m.minStockAlert).length;

  res.json({
    totalCustomers,
    totalStaff,
    totalMedicines,
    totalOrders,
    totalSales,
    pendingOrders,
    pendingPrescriptions,
    lowStockAlerts,
  });
});

// Admin User Management
app.get('/api/admin/users', authenticate, requireRole(['admin']), (req, res) => {
  const { role } = req.query;
  let list = db.getRaw().users.map(({ passwordHash, ...safeUser }) => safeUser);
  if (role && role !== 'All') {
    list = list.filter((u) => u.role === role);
  }
  res.json({ users: list });
});

// Admin creates staff account
app.post('/api/admin/users/staff', authenticate, requireRole(['admin']), (req, res) => {
  const admin = (req as any).user;
  const { name, email, phone, password, permissions } = req.body;

  if (!name || !email || !password || !phone) {
    res.status(400).json({ error: 'Name, email, phone, and password are required.' });
    return;
  }

  const emailClean = String(email).trim().toLowerCase();
  const existing = db.getRaw().users.find((u) => u.email.toLowerCase() === emailClean);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const newStaff: any = {
    id: 'usr_staff_' + Date.now(),
    role: 'staff',
    email: emailClean,
    name: String(name).trim(),
    phone: String(phone).trim(),
    isActive: true,
    permissions: Array.isArray(permissions) ? permissions : ['verify_prescriptions', 'update_orders', 'manage_inventory'],
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    lastLogin: undefined,
  };

  db.getRaw().users.push(newStaff);
  db.addAuditLog(admin, 'STAFF_CREATED', 'user', `Admin created staff account for ${newStaff.name} (${newStaff.email})`);
  db.persist();

  const { passwordHash, ...safeUser } = newStaff;
  res.status(201).json({ user: safeUser, message: 'Staff account successfully provisioned.' });
});

// Toggle user activation / suspension
app.put('/api/admin/users/:id/status', authenticate, requireRole(['admin']), (req, res) => {
  const admin = (req as any).user;
  const user = db.getRaw().users.find((u) => u.id === req.params.id);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.id === admin.id) {
    res.status(400).json({ error: 'Cannot deactivate your own administrator account.' });
    return;
  }

  user.isActive = !user.isActive;
  db.addAuditLog(
    admin,
    user.isActive ? 'USER_ACTIVATED' : 'USER_SUSPENDED',
    'user',
    `User ${user.email} was ${user.isActive ? 'activated' : 'suspended'}`
  );
  db.persist();

  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, message: `Account is now ${user.isActive ? 'active' : 'suspended'}.` });
});

// Admin Medicine CRUD
app.post('/api/admin/medicines', authenticate, requireRole(['admin']), (req, res) => {
  const admin = (req as any).user;
  const {
    name,
    brand,
    genericName,
    category,
    condition,
    strength,
    dosageForm,
    price,
    stock,
    minStockAlert,
    requiresPrescription,
    coldChain,
    storageTemp,
    manufacturer,
    indications,
    description,
    labelDosageInstructions,
    regulatoryApprovalNo,
    imageUrl,
  } = req.body;

  if (!name || !brand || !category || !price) {
    res.status(400).json({ error: 'Name, brand, category, and price are required.' });
    return;
  }

  const newMed: Medicine = {
    id: 'med_' + Date.now(),
    name: String(name).trim(),
    brand: String(brand).trim(),
    genericName: String(genericName || name).trim(),
    category: String(category).trim(),
    condition: String(condition || 'Specialty Rare Condition').trim(),
    strength: String(strength || 'Standard').trim(),
    dosageForm: String(dosageForm || 'Vial / Solution').trim(),
    price: parseFloat(price) || 0,
    stock: parseInt(stock, 10) || 0,
    minStockAlert: parseInt(minStockAlert, 10) || 5,
    requiresPrescription: requiresPrescription !== false,
    coldChain: !!coldChain,
    storageTemp: storageTemp || (coldChain ? '2°C to 8°C Refrigerated' : 'Controlled Room Temperature'),
    manufacturer: manufacturer || brand,
    indications: indications || 'Orphan and specialty therapeutic indications.',
    description: description || 'Specialized pharmaceutical product with guaranteed supply chain provenance.',
    labelDosageInstructions: labelDosageInstructions || 'Administer according to verified prescription protocol.',
    regulatoryApprovalNo: regulatoryApprovalNo || 'FDA-ODD-REGISTRY',
    imageUrl: imageUrl || '/src/assets/images/medicine_soliris_1794104816333.jpg',
    isArchived: false,
    popularity: 50,
    createdAt: new Date().toISOString(),
  };

  db.getRaw().medicines.push(newMed);
  db.addAuditLog(admin, 'MEDICINE_CREATED', 'medicine', `Created new medicine listing: ${newMed.name}`);
  db.persist();

  res.status(201).json({ medicine: newMed });
});

app.put('/api/admin/medicines/:id', authenticate, requireRole(['admin']), (req, res) => {
  const admin = (req as any).user;
  const med = db.getRaw().medicines.find((m) => m.id === req.params.id);
  if (!med) {
    res.status(404).json({ error: 'Medicine not found' });
    return;
  }

  Object.assign(med, req.body);
  if (req.body.price) med.price = parseFloat(req.body.price);
  if (req.body.stock) med.stock = parseInt(req.body.stock, 10);
  if (req.body.minStockAlert) med.minStockAlert = parseInt(req.body.minStockAlert, 10);

  db.addAuditLog(admin, 'MEDICINE_UPDATED', 'medicine', `Updated medicine listing: ${med.name}`);
  db.persist();

  res.json({ medicine: med, message: 'Medicine updated successfully.' });
});

app.delete('/api/admin/medicines/:id', authenticate, requireRole(['admin']), (req, res) => {
  const admin = (req as any).user;
  const med = db.getRaw().medicines.find((m) => m.id === req.params.id);
  if (!med) {
    res.status(404).json({ error: 'Medicine not found' });
    return;
  }
  med.isArchived = true;
  db.addAuditLog(admin, 'MEDICINE_ARCHIVED', 'medicine', `Archived medicine listing: ${med.name}`);
  db.persist();

  res.json({ message: 'Medicine archived successfully.' });
});

// Admin Financial Reports
app.get('/api/admin/financial-reports', authenticate, requireRole(['admin']), (req, res) => {
  const raw = db.getRaw();
  const validOrders = raw.orders.filter((o) => o.status !== 'Cancelled');

  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalPrescriptionSales = validOrders
    .filter((o) => o.items.some((it) => it.requiresPrescription))
    .reduce((sum, o) => sum + o.total, 0);
  const totalColdChainSales = validOrders
    .filter((o) => o.coldChainAssurance)
    .reduce((sum, o) => sum + o.total, 0);

  // Group by date for daily chart
  const dailyMap: Record<string, number> = {};
  validOrders.forEach((o) => {
    const d = o.orderDate.slice(0, 10);
    dailyMap[d] = (dailyMap[d] || 0) + o.total;
  });

  const dailyTrend = Object.keys(dailyMap)
    .sort()
    .map((date) => ({ date, amount: dailyMap[date] }));

  // Payment methods breakdown
  const paymentBreakdown: Record<string, number> = {};
  validOrders.forEach((o) => {
    paymentBreakdown[o.paymentMethod] = (paymentBreakdown[o.paymentMethod] || 0) + o.total;
  });

  // Top medicines
  const medSales: Record<string, { name: string; brand: string; unitsSold: number; totalSales: number }> = {};
  validOrders.forEach((o) => {
    o.items.forEach((it) => {
      if (!medSales[it.medicineId]) {
        medSales[it.medicineId] = { name: it.name, brand: it.brand, unitsSold: 0, totalSales: 0 };
      }
      medSales[it.medicineId].unitsSold += it.quantity;
      medSales[it.medicineId].totalSales += it.price * it.quantity;
    });
  });

  const topSellingMedicines = Object.values(medSales).sort((a, b) => b.totalSales - a.totalSales);

  res.json({
    totalRevenue,
    totalPrescriptionSales,
    totalColdChainSales,
    orderCount: validOrders.length,
    dailyTrend,
    paymentBreakdown,
    topSellingMedicines,
  });
});

// Admin Audit Logs
app.get('/api/admin/audit-logs', authenticate, requireRole(['admin']), (req, res) => {
  const { entity, search } = req.query;
  let logs = [...db.getRaw().auditLogs];
  if (entity && entity !== 'All') {
    logs = logs.filter((l) => l.entity === entity);
  }
  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
    );
  }
  res.json({ auditLogs: logs });
});

// System settings
app.get('/api/admin/settings', authenticate, requireRole(['admin']), (req, res) => {
  res.json({ settings: db.getRaw().settings });
});

app.put('/api/admin/settings', authenticate, requireRole(['admin']), (req, res) => {
  const admin = (req as any).user;
  Object.assign(db.getRaw().settings, req.body);
  db.addAuditLog(admin, 'SETTINGS_UPDATED', 'system', 'Updated system configurations');
  db.persist();
  res.json({ settings: db.getRaw().settings, message: 'Settings updated successfully.' });
});

// Admin Support Tickets management
app.get('/api/admin/support-tickets', authenticate, requireRole(['admin', 'staff']), (req, res) => {
  res.json({ tickets: db.getRaw().tickets });
});

app.post('/api/admin/support-tickets/:id/reply', authenticate, requireRole(['admin', 'staff']), (req, res) => {
  const staff = (req as any).user;
  const ticket = db.getRaw().tickets.find((t) => t.id === req.params.id);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }
  const { text, status } = req.body;
  if (!text) {
    res.status(400).json({ error: 'Response message cannot be empty' });
    return;
  }
  const now = new Date().toISOString();
  ticket.messages.push({
    id: 'msg_' + Date.now(),
    senderId: staff.id,
    senderName: `${staff.name} (${staff.role.toUpperCase()})`,
    senderRole: staff.role,
    text: String(text).trim(),
    timestamp: now,
  });
  if (status) ticket.status = status;
  ticket.updatedAt = now;

  db.addNotification(
    ticket.customerId,
    'customer',
    `Support Reply: Ticket ${ticket.ticketNumber}`,
    `${staff.name} responded to your support inquiry.`,
    'system'
  );
  db.persist();

  res.json({ ticket });
});

/* ==========================================================================
   DOCTOR E-VERIFIED PRESCRIBING STUDIO (Strictly Admin Only)
   ========================================================================== */

app.get('/api/admin/doctor-prescriptions', authenticate, requireRole(['admin']), (req, res) => {
  const rxs = db.getRaw().prescriptions;
  res.json({ prescriptions: rxs });
});

app.post('/api/admin/doctor-prescriptions', authenticate, requireRole(['admin']), (req, res) => {
  const admin = (req as any).user;
  const {
    customerId,
    customerName,
    customerEmail,
    doctorName,
    clinicHospital,
    licenseRegNo,
    deaNumber,
    medicineIds,
    prescribedMedicineName,
    dosageInstructions,
    quantityPrescribed,
    refillsAuthorized,
    diagnosis,
    notes,
    autoApprove,
  } = req.body;

  if (!customerName || !doctorName || !licenseRegNo || (!medicineIds?.length && !prescribedMedicineName)) {
    res.status(400).json({ error: 'Patient, doctor prescriber name, medical license, and prescribed medicine are required.' });
    return;
  }

  // Find target customer if customerId provided, or by email
  let targetCustomer = db.getRaw().users.find((u) => u.id === customerId);
  if (!targetCustomer && customerEmail) {
    targetCustomer = db.getRaw().users.find((u) => u.email.toLowerCase() === String(customerEmail).toLowerCase().trim());
  }

  const finalCustomerId = targetCustomer ? targetCustomer.id : (customerId || 'usr_cust_' + Date.now());
  const finalCustomerEmail = targetCustomer ? targetCustomer.email : (customerEmail || 'patient@example.com');
  const finalCustomerName = targetCustomer ? targetCustomer.name : customerName;

  const now = new Date().toISOString();
  const rxId = 'rx_evp_' + Date.now();
  const isApproved = autoApprove !== false;

  const newRx: Prescription = {
    id: rxId,
    customerId: finalCustomerId,
    customerName: finalCustomerName,
    customerEmail: finalCustomerEmail,
    customerPhone: targetCustomer?.phone || '+63 917 555 0199',
    medicineIds: Array.isArray(medicineIds) ? medicineIds : [],
    documentName: `E-Prescription_${rxId}.pdf`,
    documentUrl: '/src/assets/images/rx_sample_prescription_1794104817239.jpg',
    fileType: 'application/pdf',
    doctorName: String(doctorName).trim(),
    clinicHospital: String(clinicHospital || 'MediReach Specialized Clinical Center').trim(),
    licenseRegNo: String(licenseRegNo).trim(),
    deaNumber: deaNumber || 'S2-DOH-PH-7789',
    issueDate: now.slice(0, 10),
    status: isApproved ? 'Approved' : 'Pending Review',
    isDigitalEPrescription: true,
    diagnosis: diagnosis || 'Clinical condition indicated for specialized pharmaceutical management',
    prescribedMedicineName: prescribedMedicineName || 'Specialized Prescribed Medicines',
    dosageInstructions: dosageInstructions || 'Take according to standard medical protocol.',
    quantityPrescribed: parseInt(quantityPrescribed, 10) || 1,
    refillsAuthorized: parseInt(refillsAuthorized, 10) || 1,
    digitalSignature: `SHA256-DIGITAL-SIG-${crypto.createHash('sha256').update(rxId + doctorName + now).digest('hex').substring(0, 16).toUpperCase()}`,
    notes: notes || 'Issued via Doctor E-Verified Prescriber Pad in Admin Prescribing Studio.',
    verifiedByStaffId: isApproved ? admin.id : undefined,
    verifiedByStaffName: isApproved ? `Dr. Prescriber (${admin.name})` : undefined,
    verifiedAt: isApproved ? now : undefined,
    createdAt: now,
  };

  db.getRaw().prescriptions.unshift(newRx);

  // Notify customer
  db.addNotification(
    finalCustomerId,
    'customer',
    'New E-Verified Prescription Issued',
    `Dr. ${newRx.doctorName} has issued an E-Verified Prescription (${newRx.id}) for your profile. It has been authorized for ordering.`,
    'prescription'
  );

  db.addAuditLog(
    admin,
    'DOCTOR_PRESCRIPTION_ISSUED',
    'prescription',
    `Doctor Prescribing Studio: Issued E-Verified Rx ${newRx.id} for ${finalCustomerName} by Dr. ${newRx.doctorName}`
  );

  db.persist();

  res.status(201).json({ prescription: newRx, message: 'E-Prescription successfully signed and issued to patient account.' });
});

/* ==========================================================================
   VITE & STATIC ASSET SERVER
   ========================================================================== */

const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MediReach server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
