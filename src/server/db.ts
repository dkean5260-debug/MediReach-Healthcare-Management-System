import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Medicine,
  Prescription,
  Order,
  InventoryTransaction,
  Notification,
  DeliveryAddress,
  SupportTicket,
  AuditLog,
  SystemSettings,
} from '../types/index.ts';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DB_DIR, 'db.json');

// Password hashing utility with PBKDF2
export function hashPassword(password: string, salt = 'medireach_salt_2026'): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
}

export function generateToken(user: User): string {
  const payload = {
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function parseToken(token: string): { userId: string; role: string; email: string; name: string } | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const data = JSON.parse(raw);
    if (data.exp && data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

interface StoredUser extends User {
  passwordHash: string;
}

export interface DatabaseSchema {
  users: StoredUser[];
  medicines: Medicine[];
  prescriptions: Prescription[];
  orders: Order[];
  inventoryTransactions: InventoryTransaction[];
  notifications: Notification[];
  addresses: DeliveryAddress[];
  favorites: { id: string; userId: string; medicineId: string }[];
  tickets: SupportTicket[];
  auditLogs: AuditLog[];
  settings: SystemSettings;
}

const defaultSettings: SystemSettings = {
  pharmacyName: 'MediReach Central Specialty Pharmacy',
  licenseNumber: 'MED-RX-98234-SPECIALTY',
  operatingHours: '24/7 Clinical & Cold-Chain Dispatch',
  emergencyHotline: '+1 (800) 555-RARE (7273)',
  defaultDeliveryFee: 15.0,
  coldChainFee: 25.0,
  freeShippingThreshold: 1000.0,
  autoRequireRxVerification: true,
  coldChainMonitorsActive: true,
  maintenanceMode: false,
};

function getInitialData(): DatabaseSchema {
  const adminId = 'usr_admin_01';
  const staffId = 'usr_staff_01';
  const staffId2 = 'usr_staff_02';
  const customerId = 'usr_cust_01';

  return {
    users: [
      {
        id: adminId,
        role: 'admin',
        email: 'admin@medireach.com',
        name: 'Dr. Gregory House, PharmD',
        phone: '+1 (555) 901-4400',
        isActive: true,
        permissions: ['all'],
        passwordHash: hashPassword('admin123'),
        createdAt: '2026-01-10T08:00:00.000Z',
        lastLogin: new Date().toISOString(),
      },
      {
        id: staffId,
        role: 'staff',
        email: 'pharmacist.elena@medireach.com',
        name: 'Elena Rostova, RPh',
        phone: '+1 (555) 234-8891',
        isActive: true,
        permissions: ['verify_prescriptions', 'manage_inventory', 'update_orders', 'dispatch_deliveries'],
        passwordHash: hashPassword('staff123'),
        createdAt: '2026-01-15T09:30:00.000Z',
        lastLogin: new Date().toISOString(),
      },
      {
        id: staffId2,
        role: 'staff',
        email: 'dispatch.marcus@medireach.com',
        name: 'Marcus Vance',
        phone: '+1 (555) 782-1144',
        isActive: true,
        permissions: ['update_orders', 'dispatch_deliveries', 'manage_inventory'],
        passwordHash: hashPassword('staff123'),
        createdAt: '2026-02-01T10:00:00.000Z',
        lastLogin: new Date().toISOString(),
      },
      {
        id: customerId,
        role: 'customer',
        email: 'customer.sarah@example.com',
        name: 'Sarah Jenkins',
        phone: '+1 (555) 432-8921',
        isActive: true,
        passwordHash: hashPassword('customer123'),
        createdAt: '2026-02-14T14:15:00.000Z',
        lastLogin: new Date().toISOString(),
      },
    ],
    medicines: [
      {
        id: 'med_01',
        name: 'Soliris (Eculizumab)',
        brand: 'Alexion Pharmaceuticals',
        genericName: 'Eculizumab recombinant IgG2/4k',
        category: 'Rare Hematology',
        condition: 'Paroxysmal Nocturnal Hemoglobinuria (PNH) & aHUS',
        strength: '300 mg / 30 mL',
        dosageForm: 'IV Infusion Single-use Vial',
        price: 6820.0,
        stock: 14,
        minStockAlert: 5,
        requiresPrescription: true,
        coldChain: true,
        storageTemp: '2°C to 8°C (Do Not Freeze)',
        manufacturer: 'Alexion Pharma International',
        indications: 'Indicated for reduction of hemolysis in Paroxysmal Nocturnal Hemoglobinuria and treatment of atypical Hemolytic Uremic Syndrome.',
        description: 'First-in-class terminal complement inhibitor targeting C5 protein. Shipped in medical-grade refrigerated thermal shippers with live IoT temperature logger.',
        labelDosageInstructions: 'Administer via IV infusion over 35 minutes as prescribed by certified hematologist. Strictly maintain cold-chain handling.',
        regulatoryApprovalNo: 'FDA-BLA-125166 / EMA-EU/1/07/393/001',
        imageUrl: '/src/assets/images/medicine_soliris_1794104816333.jpg',
        isArchived: false,
        popularity: 98,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'med_02',
        name: 'Cerezyme (Imiglucerase)',
        brand: 'Sanofi Genzyme',
        genericName: 'Imiglucerase for injection',
        category: 'Metabolic & Genetic',
        condition: 'Type 1 Gaucher Disease',
        strength: '400 Units Lyophilized Powder',
        dosageForm: 'Injection for IV Infusion',
        price: 3450.0,
        stock: 22,
        minStockAlert: 8,
        requiresPrescription: true,
        coldChain: true,
        storageTemp: '2°C to 8°C Refrigerated',
        manufacturer: 'Genzyme Corporation',
        indications: 'Long-term enzyme replacement therapy for pediatric and adult patients with confirmed diagnosis of Type 1 Gaucher disease.',
        description: 'Recombinant human beta-glucocerebrosidase. Reconstitute with sterile water for injection according to certified protocol.',
        labelDosageInstructions: 'Individualized dosing usually 60 units/kg bi-weekly administered as a 1 to 2 hour infusion.',
        regulatoryApprovalNo: 'FDA-NDA-020367',
        imageUrl: '/src/assets/images/medicine_cerezyme_1794104816660.jpg',
        isArchived: false,
        popularity: 92,
        createdAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'med_03',
        name: 'Spinraza (Nusinersen)',
        brand: 'Biogen',
        genericName: 'Nusinersen antisense oligonucleotide',
        category: 'Neurology & Spinal',
        condition: 'Spinal Muscular Atrophy (SMA 5q)',
        strength: '12 mg / 5 mL',
        dosageForm: 'Intrathecal Injection Solution',
        price: 11200.0,
        stock: 5,
        minStockAlert: 6, // Low stock trigger
        requiresPrescription: true,
        coldChain: true,
        storageTemp: '2°C to 8°C Refrigerated',
        manufacturer: 'Biogen Ireland Ltd',
        indications: 'Treatment of 5q spinal muscular atrophy in pediatric and adult patients across stages 1 through 3.',
        description: 'Specialty survival motor neuron-2 (SMN2)-directed antisense oligonucleotide. Requires strict cold-chain verification prior to clinical intrathecal delivery.',
        labelDosageInstructions: 'Administer intrathecally by or under direction of experienced healthcare provider. 4 loading doses followed by maintenance doses every 4 months.',
        regulatoryApprovalNo: 'FDA-BLA-761049',
        imageUrl: '/src/assets/images/medicine_spinraza_1794104817956.jpg',
        isArchived: false,
        popularity: 96,
        createdAt: '2026-01-05T00:00:00.000Z',
      },
      {
        id: 'med_04',
        name: 'Kalydeco (Ivacaftor)',
        brand: 'Vertex Pharmaceuticals',
        genericName: 'Ivacaftor potentiator',
        category: 'Pulmonary & Respiratory',
        condition: 'Cystic Fibrosis (CFTR responsive mutations)',
        strength: '150 mg Film-Coated',
        dosageForm: 'Oral Tablets (Pack of 56)',
        price: 4890.0,
        stock: 18,
        minStockAlert: 5,
        requiresPrescription: true,
        coldChain: false,
        storageTemp: '20°C to 25°C Controlled Room Temp',
        manufacturer: 'Vertex Pharmaceuticals Inc.',
        indications: 'Treatment of cystic fibrosis in patients with specific CFTR gating mutations.',
        description: 'CFTR potentiator that helps chloride ions flow through cells, thinning mucus in the lungs and pancreas.',
        labelDosageInstructions: 'One 150 mg tablet taken orally every 12 hours with fat-containing food.',
        regulatoryApprovalNo: 'FDA-NDA-203188',
        imageUrl: '/src/assets/images/hero_banner_medical_1794104816141.jpg',
        isArchived: false,
        popularity: 88,
        createdAt: '2026-01-10T00:00:00.000Z',
      },
      {
        id: 'med_05',
        name: 'Syprine (Trientine HCl)',
        brand: 'Bausch Health',
        genericName: 'Trientine hydrochloride',
        category: 'Metabolic & Genetic',
        condition: 'Wilson Disease (Copper Accumulation)',
        strength: '250 mg Capsules',
        dosageForm: 'Oral Capsule (Bottle of 100)',
        price: 2150.0,
        stock: 28,
        minStockAlert: 10,
        requiresPrescription: true,
        coldChain: true,
        storageTemp: '2°C to 8°C Keep tightly closed',
        manufacturer: 'Bausch Health US LLC',
        indications: 'Treatment of patients with Wilson disease who are intolerant of penicillamine.',
        description: 'Copper chelating agent that binds excess system copper for urinary excretion.',
        labelDosageInstructions: 'Take on empty stomach, at least 1 hour before meals or 2 hours after meals, with water.',
        regulatoryApprovalNo: 'FDA-NDA-019201',
        imageUrl: '/src/assets/images/medicine_cerezyme_1794104816660.jpg',
        isArchived: false,
        popularity: 85,
        createdAt: '2026-01-12T00:00:00.000Z',
      },
      {
        id: 'med_06',
        name: 'Esbriet (Pirfenidone)',
        brand: 'Genentech',
        genericName: 'Pirfenidone antifibrotic',
        category: 'Pulmonary & Respiratory',
        condition: 'Idiopathic Pulmonary Fibrosis (IPF)',
        strength: '267 mg Capsules',
        dosageForm: 'Oral Capsules (270 count pack)',
        price: 1850.0,
        stock: 35,
        minStockAlert: 10,
        requiresPrescription: true,
        coldChain: false,
        storageTemp: '25°C Dry Environment',
        manufacturer: 'Hoffmann-La Roche Inc.',
        indications: 'Indicated for slowing disease progression in adults with idiopathic pulmonary fibrosis.',
        description: 'Antifibrotic agent reducing fibroblast proliferation and collagen synthesis in lung tissue.',
        labelDosageInstructions: 'Titrated up to 801 mg three times daily with food.',
        regulatoryApprovalNo: 'FDA-NDA-022535',
        imageUrl: '/src/assets/images/medicine_soliris_1794104816333.jpg',
        isArchived: false,
        popularity: 81,
        createdAt: '2026-01-15T00:00:00.000Z',
      },
      {
        id: 'med_07',
        name: 'Fabrazyme (Agalsidase Beta)',
        brand: 'Sanofi Genzyme',
        genericName: 'Agalsidase beta recombinant',
        category: 'Metabolic & Genetic',
        condition: 'Fabry Disease',
        strength: '35 mg Lyophilized Cake',
        dosageForm: 'Solution for IV Infusion',
        price: 5120.0,
        stock: 9,
        minStockAlert: 5,
        requiresPrescription: true,
        coldChain: true,
        storageTemp: '2°C to 8°C Protected from Light',
        manufacturer: 'Genzyme Europe B.V.',
        indications: 'Long-term enzyme replacement therapy in patients with confirmed Fabry disease.',
        description: 'Recombinant human alpha-galactosidase A to clear globotriaosylceramide accumulation in tissues.',
        labelDosageInstructions: '1 mg/kg body weight infused once every two weeks intravenously.',
        regulatoryApprovalNo: 'FDA-BLA-103977',
        imageUrl: '/src/assets/images/medicine_spinraza_1794104817956.jpg',
        isArchived: false,
        popularity: 90,
        createdAt: '2026-01-18T00:00:00.000Z',
      },
      {
        id: 'med_08',
        name: 'Kuvan (Sapropterin)',
        brand: 'BioMarin',
        genericName: 'Sapropterin dihydrochloride',
        category: 'Endocrinology & Growth',
        condition: 'Phenylketonuria (PKU)',
        strength: '100 mg Soluble Tablets',
        dosageForm: 'Oral Solution Tablets (Bottle of 120)',
        price: 1380.0,
        stock: 40,
        minStockAlert: 12,
        requiresPrescription: true,
        coldChain: false,
        storageTemp: '20°C to 25°C',
        manufacturer: 'BioMarin Pharmaceutical Inc.',
        indications: 'Reduction of blood phenylalanine (Phe) levels in adult and pediatric patients with hyperphenylalaninemia.',
        description: 'Synthetic preparation of tetrahydrobiopterin (BH4), the cofactor for the enzyme phenylalanine hydroxylase.',
        labelDosageInstructions: 'Take once daily with a meal; dissolve tablets in 4 to 8 oz of water or apple juice.',
        regulatoryApprovalNo: 'FDA-NDA-022181',
        imageUrl: '/src/assets/images/hero_banner_medical_1794104816141.jpg',
        isArchived: false,
        popularity: 79,
        createdAt: '2026-01-20T00:00:00.000Z',
      },
      {
        id: 'med_09',
        name: 'Cold-Chain Sterile Infusion Administration Kit',
        brand: 'MediReach Clinical Supplies',
        genericName: 'Sterile IV Infusion Administration Line & Filter',
        category: 'Clinical Supplies & Infusion',
        condition: 'Intravenous Therapy Administration',
        strength: '0.2 Micron In-Line Sterile Filter',
        dosageForm: 'Sterile Medical Supply Pack',
        price: 65.0,
        stock: 120,
        minStockAlert: 25,
        requiresPrescription: false, // OTC Medical supply
        coldChain: false,
        storageTemp: 'Controlled Room Temperature',
        manufacturer: 'Baxter Healthcare International',
        indications: 'Sterile fluid path administration set with low-protein binding filter for biologics.',
        description: 'Specially engineered low-binding tubing suitable for sensitive enzyme and antibody infusions.',
        labelDosageInstructions: 'Single patient use. Connect per nurse/infusionist instructions.',
        regulatoryApprovalNo: 'FDA-510K-K19284',
        imageUrl: '/src/assets/images/medicine_soliris_1794104816333.jpg',
        isArchived: false,
        popularity: 84,
        createdAt: '2026-01-22T00:00:00.000Z',
      },
    ],
    prescriptions: [
      {
        id: 'rx_01',
        customerId: customerId,
        customerName: 'Sarah Jenkins',
        customerEmail: 'customer.sarah@example.com',
        customerPhone: '+1 (555) 432-8921',
        medicineIds: ['med_01', 'med_02'],
        documentName: 'Prescription_Dr_Vance_Oct2026.pdf',
        documentUrl: '/src/assets/images/rx_sample_prescription_1794104817239.jpg',
        fileType: 'image/jpeg',
        doctorName: 'Dr. Eleanor Vance, MD',
        clinicHospital: 'St. Elizabeth Specialty Hospital & Rare Disease Center',
        licenseRegNo: 'LIC-12345-BOARD-CERT',
        issueDate: '2026-10-26',
        status: 'Approved',
        notes: 'Verified against State Board of Medicine directory. Valid for 12 months for Soliris 300mg IV.',
        verifiedByStaffId: staffId,
        verifiedByStaffName: 'Elena Rostova, RPh',
        verifiedAt: '2026-10-27T10:14:00.000Z',
        createdAt: '2026-10-26T16:20:00.000Z',
      },
      {
        id: 'rx_02',
        customerId: customerId,
        customerName: 'Sarah Jenkins',
        customerEmail: 'customer.sarah@example.com',
        customerPhone: '+1 (555) 432-8921',
        medicineIds: ['med_03'],
        documentName: 'Prescription_Spinraza_Nov2026.jpg',
        documentUrl: '/src/assets/images/rx_sample_prescription_1794104817239.jpg',
        fileType: 'image/jpeg',
        doctorName: 'Dr. Arthur Sterling, MD, FAAN',
        clinicHospital: 'University Neurosciences Institute',
        licenseRegNo: 'NEURO-NY-88219',
        issueDate: '2026-11-04',
        status: 'Pending Review',
        notes: 'Submitted for intrathecal therapy maintenance regimen. Awaiting hospital clearance confirmation.',
        createdAt: '2026-11-04T11:45:00.000Z',
      },
    ],
    orders: [
      {
        id: 'ord_01',
        orderNumber: 'MR-8921',
        orderDate: '2026-11-06T14:30:00.000Z',
        customerId: customerId,
        customerName: 'Sarah Jenkins',
        customerEmail: 'customer.sarah@example.com',
        customerPhone: '+1 (555) 432-8921',
        items: [
          {
            medicineId: 'med_01',
            name: 'Soliris (Eculizumab)',
            brand: 'Alexion Pharmaceuticals',
            dosageForm: 'IV Infusion Single-use Vial',
            price: 6820.0,
            quantity: 1,
            requiresPrescription: true,
            prescriptionId: 'rx_01',
            imageUrl: '/src/assets/images/medicine_soliris_1794104816333.jpg',
          },
          {
            medicineId: 'med_09',
            name: 'Cold-Chain Sterile Infusion Administration Kit',
            brand: 'MediReach Clinical Supplies',
            dosageForm: 'Sterile Medical Supply Pack',
            price: 65.0,
            quantity: 2,
            requiresPrescription: false,
            imageUrl: '/src/assets/images/medicine_soliris_1794104816333.jpg',
          },
        ],
        subtotal: 6950.0,
        deliveryFee: 0.0, // Free above threshold
        coldChainFee: 25.0,
        total: 6975.0,
        status: 'Out for Delivery',
        paymentStatus: 'Paid (Sandbox)',
        paymentMethod: 'Health Insurance Direct',
        shippingAddress: {
          id: 'addr_01',
          customerId: customerId,
          label: 'Primary Residence',
          recipientName: 'Sarah Jenkins',
          street: '742 Evergreen Terrace, Suite 4B',
          city: 'Springfield',
          state: 'IL',
          postalCode: '62704',
          phone: '+1 (555) 432-8921',
          deliveryInstructions: 'Ring bell 4B. Cold-chain perishable. Direct hand-off required.',
          isDefault: true,
        },
        coldChainAssurance: true,
        currentTemp: '3.6°C',
        tracking: {
          courierName: 'MediReach Rapid CryoExpress',
          courierPhone: '+1 (555) 899-2311',
          trackingNumber: 'MRC-7782-9901-IL',
          estimatedDelivery: 'Today by 4:30 PM',
          timeline: [
            {
              step: 'Order Placed',
              timestamp: '2026-11-06T14:30:00.000Z',
              note: 'Order submitted with verified Prescription #rx_01.',
              actor: 'Sarah Jenkins',
            },
            {
              step: 'Confirmed',
              timestamp: '2026-11-06T14:35:00.000Z',
              note: 'Payment authorized via Insurance Direct. Inventory reserved.',
              actor: 'System',
            },
            {
              step: 'Processing',
              timestamp: '2026-11-06T15:10:00.000Z',
              note: 'Compounded and inspected by Elena Rostova, RPh. Cold-chain thermal insulation sealed.',
              actor: 'Elena Rostova, RPh',
            },
            {
              step: 'Ready for Delivery',
              timestamp: '2026-11-06T16:00:00.000Z',
              note: 'Packaged into CryoCube active refrigerated shipper. Temperature probe verified at 3.4°C.',
              actor: 'Marcus Vance',
            },
            {
              step: 'Out for Delivery',
              timestamp: '2026-11-07T09:15:00.000Z',
              note: 'Driver David Morales dispatched in refrigerated vehicle #14. En route.',
              actor: 'Logistics Dispatch',
            },
          ],
        },
        createdAt: '2026-11-06T14:30:00.000Z',
        updatedAt: '2026-11-07T09:15:00.000Z',
      },
      {
        id: 'ord_02',
        orderNumber: 'MR-7419',
        orderDate: '2026-10-18T10:12:00.000Z',
        customerId: customerId,
        customerName: 'Sarah Jenkins',
        customerEmail: 'customer.sarah@example.com',
        customerPhone: '+1 (555) 432-8921',
        items: [
          {
            medicineId: 'med_02',
            name: 'Cerezyme (Imiglucerase)',
            brand: 'Sanofi Genzyme',
            dosageForm: 'Injection for IV Infusion',
            price: 3450.0,
            quantity: 1,
            requiresPrescription: true,
            prescriptionId: 'rx_01',
            imageUrl: '/src/assets/images/medicine_cerezyme_1794104816660.jpg',
          },
        ],
        subtotal: 3450.0,
        deliveryFee: 0.0,
        coldChainFee: 25.0,
        total: 3475.0,
        status: 'Delivered',
        paymentStatus: 'Paid (Sandbox)',
        paymentMethod: 'Credit / Debit Card',
        shippingAddress: {
          id: 'addr_01',
          customerId: customerId,
          label: 'Primary Residence',
          recipientName: 'Sarah Jenkins',
          street: '742 Evergreen Terrace, Suite 4B',
          city: 'Springfield',
          state: 'IL',
          postalCode: '62704',
          phone: '+1 (555) 432-8921',
          isDefault: true,
        },
        coldChainAssurance: true,
        currentTemp: '4.1°C',
        tracking: {
          courierName: 'MediReach Rapid CryoExpress',
          courierPhone: '+1 (555) 899-2311',
          trackingNumber: 'MRC-5541-1182-IL',
          estimatedDelivery: 'Delivered Oct 19, 2026',
          timeline: [
            { step: 'Order Placed', timestamp: '2026-10-18T10:12:00.000Z', note: 'Order placed by Sarah Jenkins.' },
            { step: 'Confirmed', timestamp: '2026-10-18T10:20:00.000Z', note: 'Insurance verified.' },
            { step: 'Processing', timestamp: '2026-10-18T12:00:00.000Z', note: 'Prepared in clean room.' },
            { step: 'Ready for Delivery', timestamp: '2026-10-18T14:30:00.000Z', note: 'Inspected by Pharmacist.' },
            { step: 'Out for Delivery', timestamp: '2026-10-19T08:30:00.000Z', note: 'Out with courier.' },
            { step: 'Delivered', timestamp: '2026-10-19T11:45:00.000Z', note: 'Received and temperature confirmed by Sarah Jenkins.' },
          ],
        },
        createdAt: '2026-10-18T10:12:00.000Z',
        updatedAt: '2026-10-19T11:45:00.000Z',
      },
    ],
    inventoryTransactions: [
      {
        id: 'tx_01',
        medicineId: 'med_01',
        medicineName: 'Soliris (Eculizumab)',
        changeType: 'order_deduction',
        quantity: -1,
        resultingStock: 14,
        reason: 'Order #MR-8921 allocation',
        staffId: staffId,
        staffName: 'Elena Rostova, RPh',
        timestamp: '2026-11-06T14:35:00.000Z',
      },
      {
        id: 'tx_02',
        medicineId: 'med_03',
        medicineName: 'Spinraza (Nusinersen)',
        changeType: 'batch_intake',
        quantity: 5,
        resultingStock: 5,
        reason: 'Manufacturer Biogen direct supply batch #BGN-2026-99',
        staffId: adminId,
        staffName: 'Dr. Gregory House, PharmD',
        timestamp: '2026-11-01T09:00:00.000Z',
      },
    ],
    notifications: [
      {
        id: 'notif_01',
        userId: customerId,
        roleTarget: 'customer',
        title: 'Prescription Approved',
        message: 'Your prescription #rx_01 from Dr. Eleanor Vance has been verified and approved for rare medicine dispensation.',
        type: 'prescription',
        isRead: false,
        createdAt: '2026-10-27T10:15:00.000Z',
      },
      {
        id: 'notif_02',
        userId: customerId,
        roleTarget: 'customer',
        title: 'Order MR-8921 Out for Delivery',
        message: 'Your order is on its way in refrigerated vehicle #14. Current temperature: 3.6°C. Estimated delivery: Today by 4:30 PM.',
        type: 'order',
        isRead: false,
        createdAt: '2026-11-07T09:15:00.000Z',
      },
      {
        id: 'notif_03',
        userId: staffId,
        roleTarget: 'staff',
        title: 'Low Stock Alert: Spinraza',
        message: 'Spinraza stock has dropped to 5 units (below threshold of 6). Please initiate supplier replenishment.',
        type: 'inventory',
        isRead: false,
        createdAt: '2026-11-06T18:00:00.000Z',
      },
      {
        id: 'notif_04',
        userId: adminId,
        roleTarget: 'admin',
        title: 'System Audit Record',
        message: 'Daily temperature logs verified for all 9 cold-chain biological storage units.',
        type: 'system',
        isRead: true,
        createdAt: '2026-11-07T06:00:00.000Z',
      },
    ],
    addresses: [
      {
        id: 'addr_01',
        customerId: customerId,
        label: 'Primary Residence',
        recipientName: 'Sarah Jenkins',
        street: '742 Evergreen Terrace, Suite 4B',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62704',
        phone: '+1 (555) 432-8921',
        deliveryInstructions: 'Ring bell 4B. Direct signature hand-off required.',
        isDefault: true,
      },
      {
        id: 'addr_02',
        customerId: customerId,
        label: 'St. Elizabeth Infusion Suite',
        recipientName: 'Sarah Jenkins (c/o Nurse Station 3)',
        street: '678 Medical Center Drive',
        city: 'Springfield',
        state: 'IL',
        postalCode: '62702',
        phone: '+1 (555) 432-8921',
        deliveryInstructions: 'Deliver to Outpatient Infusion Pharmacy reception.',
        isDefault: false,
      },
    ],
    favorites: [
      { id: 'fav_01', userId: customerId, medicineId: 'med_01' },
      { id: 'fav_02', userId: customerId, medicineId: 'med_02' },
    ],
    tickets: [
      {
        id: 'tkt_01',
        ticketNumber: 'TKT-2026-091',
        customerId: customerId,
        customerName: 'Sarah Jenkins',
        customerEmail: 'customer.sarah@example.com',
        subject: 'Cold-Chain Delivery Confirmation Time Window',
        category: 'Cold-Chain Delivery',
        status: 'In Progress',
        priority: 'Urgent',
        messages: [
          {
            id: 'msg_01',
            senderId: customerId,
            senderName: 'Sarah Jenkins',
            senderRole: 'customer',
            text: 'Hello, I want to confirm if the driver can call 15 minutes before arrival so I can have the medical refrigerator ready.',
            timestamp: '2026-11-07T08:00:00.000Z',
          },
          {
            id: 'msg_02',
            senderId: staffId2,
            senderName: 'Marcus Vance (Logistics)',
            senderRole: 'staff',
            text: 'Hi Sarah! Absolutely. Driver David Morales has been instructed to call your phone number 20 minutes before pulling up to 742 Evergreen Terrace.',
            timestamp: '2026-11-07T08:45:00.000Z',
          },
        ],
        createdAt: '2026-11-07T08:00:00.000Z',
        updatedAt: '2026-11-07T08:45:00.000Z',
      },
    ],
    auditLogs: [
      {
        id: 'aud_01',
        timestamp: '2026-10-27T10:14:00.000Z',
        userId: staffId,
        userName: 'Elena Rostova, RPh',
        userRole: 'staff',
        action: 'APPROVE_PRESCRIPTION',
        entity: 'prescription',
        details: 'Approved prescription #rx_01 for patient Sarah Jenkins after State Board verification.',
        ipAddress: '192.168.1.14',
      },
      {
        id: 'aud_02',
        timestamp: '2026-11-06T14:35:00.000Z',
        userId: customerId,
        userName: 'Sarah Jenkins',
        userRole: 'customer',
        action: 'ORDER_SUBMITTED',
        entity: 'order',
        details: 'Placed order #MR-8921 total $6,975.00 with Cold-Chain Assurance.',
        ipAddress: '10.0.4.82',
      },
      {
        id: 'aud_03',
        timestamp: '2026-11-06T16:00:00.000Z',
        userId: staffId2,
        userName: 'Marcus Vance',
        userRole: 'staff',
        action: 'STATUS_UPDATE',
        entity: 'order',
        details: 'Order #MR-8921 packaged and marked Ready for Delivery with CryoCube #9.',
        ipAddress: '192.168.1.20',
      },
    ],
    settings: defaultSettings,
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error loading db file, falling back to initial data', err);
    }
    const initial = getInitialData();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db file', err);
    }
  }

  public getRaw(): DatabaseSchema {
    return this.data;
  }

  public persist() {
    this.save();
  }

  public addAuditLog(
    user: { id: string; name: string; role: any },
    action: string,
    entity: AuditLog['entity'],
    details: string,
    ipAddress = '127.0.0.1'
  ) {
    const entry: AuditLog = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      entity,
      details,
      ipAddress,
    };
    this.data.auditLogs.unshift(entry);
    this.persist();
  }

  public addNotification(
    userId: string,
    roleTarget: Notification['roleTarget'],
    title: string,
    message: string,
    type: Notification['type'],
    link?: string
  ) {
    const notif: Notification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      userId,
      roleTarget,
      title,
      message,
      type,
      isRead: false,
      link,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.persist();
    return notif;
  }
}

export const db = new Database();
