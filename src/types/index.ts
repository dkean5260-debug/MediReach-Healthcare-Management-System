export type UserRole = 'customer' | 'staff' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  email: string;
  name: string;
  phone: string;
  isActive: boolean;
  permissions?: string[]; // For staff: 'verify_prescriptions' | 'manage_inventory' | 'update_orders' | 'dispatch_deliveries' | 'manage_catalog'
  avatarUrl?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface Medicine {
  id: string;
  name: string;
  brand: string;
  genericName: string;
  category: string;
  condition: string;
  strength: string;
  dosageForm: string;
  price: number;
  stock: number;
  minStockAlert: number;
  requiresPrescription: boolean;
  coldChain: boolean;
  storageTemp: string;
  manufacturer: string;
  indications: string;
  description: string;
  labelDosageInstructions: string;
  regulatoryApprovalNo: string;
  imageUrl: string;
  isArchived: boolean;
  popularity: number;
  createdAt: string;
}

export type PrescriptionStatus = 
  | 'Pending Review' 
  | 'Under Verification' 
  | 'Approved' 
  | 'Rejected' 
  | 'Expired';

export interface Prescription {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  medicineIds?: string[];
  documentName: string;
  documentUrl: string;
  fileType: string;
  doctorName: string;
  clinicHospital: string;
  licenseRegNo: string;
  deaNumber?: string;
  issueDate: string;
  status: PrescriptionStatus;
  isDigitalEPrescription?: boolean;
  diagnosis?: string;
  prescribedMedicineName?: string;
  dosageInstructions?: string;
  quantityPrescribed?: number;
  refillsAuthorized?: number;
  digitalSignature?: string;
  notes?: string;
  rejectionReason?: string;
  verifiedByStaffId?: string;
  verifiedByStaffName?: string;
  verifiedAt?: string;
  createdAt: string;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Pending Verification'
  | 'Confirmed'
  | 'Processing'
  | 'Ready for Delivery'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItem {
  medicineId: string;
  name: string;
  brand: string;
  dosageForm: string;
  price: number;
  quantity: number;
  requiresPrescription: boolean;
  prescriptionId?: string;
  imageUrl?: string;
}

export interface OrderTimelineStep {
  step: OrderStatus;
  timestamp: string;
  note: string;
  actor?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  coldChainFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: 'Paid (Sandbox)' | 'Pending Verification' | 'Refunded (Sandbox)';
  paymentMethod: 'Credit / Debit Card' | 'Health Insurance Direct' | 'Digital Wallet' | 'Cash on Delivery';
  shippingAddress: DeliveryAddress;
  coldChainAssurance: boolean;
  currentTemp?: string; // e.g. "3.8°C"
  tracking: {
    courierName: string;
    courierPhone: string;
    trackingNumber: string;
    estimatedDelivery: string;
    timeline: OrderTimelineStep[];
  };
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  medicineId: string;
  medicineName: string;
  changeType: 'order_deduction' | 'order_restock' | 'manual_add' | 'manual_reduction' | 'batch_intake';
  quantity: number;
  resultingStock: number;
  reason: string;
  staffId: string;
  staffName: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  userId: string;
  roleTarget: 'customer' | 'staff' | 'admin' | 'all';
  title: string;
  message: string;
  type: 'order' | 'prescription' | 'inventory' | 'system' | 'security';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface DeliveryAddress {
  id: string;
  customerId: string;
  label: string;
  recipientName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  deliveryInstructions?: string;
  isDefault: boolean;
}

export interface SupportTicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  subject: string;
  category: 'Order Inquiry' | 'Prescription Help' | 'Cold-Chain Delivery' | 'Rare Drug Sourcing' | 'Billing';
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'Normal' | 'Urgent';
  messages: SupportTicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: 'auth' | 'medicine' | 'inventory' | 'prescription' | 'order' | 'user' | 'system';
  details: string;
  ipAddress: string;
}

export interface SystemSettings {
  pharmacyName: string;
  licenseNumber: string;
  operatingHours: string;
  emergencyHotline: string;
  defaultDeliveryFee: number;
  coldChainFee: number;
  freeShippingThreshold: number;
  autoRequireRxVerification: boolean;
  coldChainMonitorsActive: boolean;
  maintenanceMode: boolean;
}
