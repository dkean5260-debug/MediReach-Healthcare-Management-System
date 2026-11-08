import React, { useState, useEffect } from 'react';
import {
  FileSignature,
  FileText,
  CheckCircle2,
  Printer,
  Search,
  ShieldCheck,
  User,
  Pill,
  Eye,
  Plus,
  Trash2,
  Calendar,
  Hospital,
  AlertCircle,
  X,
  Stethoscope,
  Sparkles,
} from 'lucide-react';
import { Medicine, Prescription, User as UserType } from '../../types/index.ts';

interface DoctorPrescribingStudioProps {
  medicines: Medicine[];
  token: string | null;
  onRefreshAll?: () => void;
  showToast: (msg: string) => void;
}

export const DoctorPrescribingStudio: React.FC<DoctorPrescribingStudioProps> = ({
  medicines,
  token,
  onRefreshAll,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'pad' | 'records'>('pad');
  const [customers, setCustomers] = useState<UserType[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [patientName, setPatientName] = useState('Sarah Jenkins');
  const [patientEmail, setPatientEmail] = useState('customer.sarah@example.com');
  const [patientAge, setPatientAge] = useState('32');
  const [doctorName, setDoctorName] = useState('Dr. Gregory House, MD, PharmD');
  const [clinicHospital, setClinicHospital] = useState('MediReach Specialized Clinical Center & Rare Disease Institute');
  const [licenseRegNo, setLicenseRegNo] = useState('PRC-MD-098234');
  const [deaNumber, setDeaNumber] = useState('S2-DOH-PH-7789');
  const [diagnosis, setDiagnosis] = useState('Specialized condition requiring targeted clinical pharmaceutical intervention');
  
  // Selected Medicines on prescription
  const [prescribedItems, setPrescribedItems] = useState<Array<{
    medicineId: string;
    medicineName: string;
    dosageForm: string;
    dosageInstructions: string;
    quantity: number;
    refills: number;
  }>>([
    {
      medicineId: medicines[0]?.id || 'med_01',
      medicineName: medicines[0]?.name || 'Soliris (Eculizumab)',
      dosageForm: medicines[0]?.dosageForm || 'IV Infusion Single-use Vial',
      dosageInstructions: '300 mg via slow IV infusion every 2 weeks as scheduled with outpatient clinic.',
      quantity: 1,
      refills: 3,
    },
  ]);

  const [notes, setNotes] = useState('E-Verified direct clinical order. Verified cold-chain handling required.');
  const [autoApprove, setAutoApprove] = useState(true);

  // Preview Modal
  const [previewRx, setPreviewRx] = useState<Prescription | null>(null);

  // Load registered customers and all prescriptions
  useEffect(() => {
    fetchCustomers();
    fetchPrescriptions();
  }, [token]);

  const fetchCustomers = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/users?role=customer', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.users || []);
        if (data.users?.length > 0 && !selectedCustomerId) {
          const first = data.users[0];
          setSelectedCustomerId(first.id);
          setPatientName(first.name);
          setPatientEmail(first.email);
        }
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const fetchPrescriptions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/doctor-prescriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions || []);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setPatientName(found.name);
      setPatientEmail(found.email);
    }
  };

  const handleAddMedicineItem = () => {
    const defaultMed = medicines[0];
    if (!defaultMed) return;
    setPrescribedItems((prev) => [
      ...prev,
      {
        medicineId: defaultMed.id,
        medicineName: defaultMed.name,
        dosageForm: defaultMed.dosageForm,
        dosageInstructions: 'Take 1 unit according to standard clinical schedule with meals.',
        quantity: 1,
        refills: 1,
      },
    ]);
  };

  const handleRemoveMedicineItem = (idx: number) => {
    if (prescribedItems.length <= 1) {
      showToast('Prescription must include at least one medicine');
      return;
    }
    setPrescribedItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    setPrescribedItems((prev) => {
      const updated = [...prev];
      if (field === 'medicineId') {
        const med = medicines.find((m) => m.id === val);
        if (med) {
          updated[idx].medicineId = med.id;
          updated[idx].medicineName = med.name;
          updated[idx].dosageForm = med.dosageForm;
        }
      } else {
        (updated[idx] as any)[field] = val;
      }
      return updated;
    });
  };

  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !doctorName || !licenseRegNo) {
      showToast('Please fill out patient name, doctor name, and medical license');
      return;
    }
    if (prescribedItems.length === 0) {
      showToast('Please add at least one prescribed medicine');
      return;
    }

    setSubmitting(true);
    try {
      const medicineIds = prescribedItems.map((item) => item.medicineId);
      const combinedInstructions = prescribedItems
        .map((it) => `${it.medicineName} (${it.dosageForm}): ${it.dosageInstructions} [Qty: ${it.quantity}, Refills: ${it.refills}]`)
        .join('\n');
      const combinedNames = prescribedItems.map((it) => it.medicineName).join(', ');

      const res = await fetch('/api/admin/doctor-prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          customerName: patientName,
          customerEmail: patientEmail,
          doctorName,
          clinicHospital,
          licenseRegNo,
          deaNumber,
          medicineIds,
          prescribedMedicineName: combinedNames,
          dosageInstructions: combinedInstructions,
          quantityPrescribed: prescribedItems.reduce((sum, it) => sum + it.quantity, 0),
          refillsAuthorized: prescribedItems[0]?.refills || 1,
          diagnosis,
          notes,
          autoApprove,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to issue prescription');
        return;
      }

      showToast(`E-Prescription #${data.prescription.id} signed & issued to ${patientName}!`);
      setPreviewRx(data.prescription);
      fetchPrescriptions();
      if (onRefreshAll) onRefreshAll();
      setActiveTab('records');
    } catch (err: any) {
      showToast(err.message || 'Error communicating with prescriber service');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Doctor E-Verified Prescriber Certification */}
      <div className="bg-gradient-to-r from-blue-900 via-sky-900 to-indigo-950 text-white rounded-3xl p-6 shadow-sm border border-sky-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-sky-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DOCTOR E-VERIFIED PRESCRIBER CERTIFICATE · ACTIVE</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Stethoscope className="w-6 h-6 text-sky-400" />
              Doctor Prescribing Studio & E-Verified Pad
            </h2>
            <p className="text-xs text-sky-200/80 max-w-2xl leading-relaxed">
              Authorized clinical workstation for licensed healthcare providers and medical administrators. Issue legally binding, tamper-evident digital electronic prescriptions with instant patient account clearance.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('pad')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'pad'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/15 text-sky-100'
              }`}
            >
              <FileSignature className="w-4 h-4" />
              <span>Write E-Prescription</span>
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'records'
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-white/10 hover:bg-white/15 text-sky-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Prescription Registry ({prescriptions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Write E-Prescription Pad */}
      {activeTab === 'pad' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Prescription Form (Left / 8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
                  <FileSignature className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Official Electronic Rx Form</h3>
                  <p className="text-[11px] text-slate-500">Department of Health & PRC Medical Standards Compliant</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                DATE: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <form onSubmit={handleIssuePrescription} className="space-y-6">
              {/* Prescriber Identification Header */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Hospital className="w-3.5 h-3.5 text-sky-600" />
                    Prescribing Physician Credentials
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    E-VERIFIED
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Prescribing Doctor</label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Medical PRC License No.</label>
                    <input
                      type="text"
                      value={licenseRegNo}
                      onChange={(e) => setLicenseRegNo(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Clinic / Hospital Affiliation</label>
                    <input
                      type="text"
                      value={clinicHospital}
                      onChange={(e) => setClinicHospital(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">S2 Drug Registration / Specialty ID</label>
                    <input
                      type="text"
                      value={deaNumber}
                      onChange={(e) => setDeaNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Patient Selection & Demographics */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  Patient Demographics & Indication
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Select Patient Profile</label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleSelectCustomer(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Patient Full Name</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Patient Email / Account</label>
                    <input
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Clinical Diagnosis & Findings</label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Paroxysmal Nocturnal Hemoglobinuria (PNH) with persistent hemolysis"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    required
                  />
                </div>
              </div>

              {/* Prescribed Items (Rx Body) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-serif italic text-base">
                    ℞ <span className="font-sans font-bold text-xs not-italic text-slate-700">Prescribed Pharmaceuticals (Medications & Dosage)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddMedicineItem}
                    className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Drug</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {prescribedItems.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-sky-50/40 border border-sky-100 space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                          <Pill className="w-3.5 h-3.5 text-sky-600" />
                          Medicine Item #{idx + 1}
                        </span>
                        {prescribedItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-6">
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Select From Catalog</label>
                          <select
                            value={item.medicineId}
                            onChange={(e) => handleItemChange(idx, 'medicineId', e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                          >
                            {medicines.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} — {m.category} (₱{m.price.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="sm:col-span-3">
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Dispense Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                            required
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">Refills Authorized</label>
                          <select
                            value={item.refills}
                            onChange={(e) => handleItemChange(idx, 'refills', parseInt(e.target.value, 10))}
                            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 font-semibold"
                          >
                            <option value={0}>0 (No Refills)</option>
                            <option value={1}>1 Refill</option>
                            <option value={2}>2 Refills</option>
                            <option value={3}>3 Refills</option>
                            <option value={5}>5 Refills (6 Months)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Signa / Dosage Instructions (Sig)
                        </label>
                        <input
                          type="text"
                          value={item.dosageInstructions}
                          onChange={(e) => handleItemChange(idx, 'dosageInstructions', e.target.value)}
                          placeholder="e.g. Take 1 tablet every 12 hours with meals"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 font-mono"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physician Notes & Auto-Approval Toggle */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Special Physician Notes / Warning</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Direct hand-off required. Perishable biologics with continuous cold-chain monitor."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="autoApproveCheck"
                      checked={autoApprove}
                      onChange={(e) => setAutoApprove(e.target.checked)}
                      className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500 cursor-pointer"
                    />
                    <label htmlFor="autoApproveCheck" className="text-xs font-bold text-slate-800 cursor-pointer">
                      Direct Dispensation Clearance (Auto-Approve for Instant Checkout)
                    </label>
                  </div>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    Bypasses manual staff review queue
                  </span>
                </div>
              </div>

              {/* Digital Signature & Submission */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Secured with cryptographic prescriber SHA-256 seal</span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white font-extrabold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FileSignature className="w-4 h-4" />
                  <span>{submitting ? 'Signing & Registering Rx...' : 'Sign & Issue E-Prescription'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Preview Card / Prescriber Pad Quick View (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-amber-50/70 border-2 border-dashed border-amber-300 rounded-3xl p-5 shadow-2xs space-y-4 relative">
              <div className="text-center pb-3 border-b border-amber-200/70">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center font-bold mb-1 shadow-2xs">
                  ⚕
                </div>
                <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">{clinicHospital}</h4>
                <p className="text-[10px] text-amber-800 font-bold mt-0.5">{doctorName}</p>
                <p className="text-[9px] font-mono text-amber-700/80">PRC Lic: {licenseRegNo} · S2: {deaNumber}</p>
              </div>

              <div className="text-xs space-y-1.5 text-amber-950 font-serif">
                <div className="flex justify-between text-[11px]">
                  <span>Patient: <strong>{patientName}</strong></span>
                  <span>Date: <strong>{new Date().toLocaleDateString()}</strong></span>
                </div>
                <p className="text-[10px] text-amber-800 font-sans">
                  <strong>Dx:</strong> {diagnosis || 'Clinical evaluation'}
                </p>
              </div>

              {/* Rx Symbol */}
              <div className="py-2">
                <span className="font-serif font-black text-3xl text-sky-900 block leading-none">℞</span>
                <div className="space-y-2 mt-2 font-mono text-xs text-slate-800">
                  {prescribedItems.map((it, i) => (
                    <div key={i} className="pl-3 border-l-2 border-sky-400">
                      <div className="font-bold font-sans text-xs text-slate-900">{it.medicineName}</div>
                      <div className="text-[11px] text-slate-600">Sig: {it.dosageInstructions}</div>
                      <div className="text-[10px] text-slate-500">Dispense: #{it.quantity} · Refills: {it.refills}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-amber-200/70 text-center space-y-1">
                <div className="h-9 flex items-center justify-center">
                  <span className="font-serif italic text-slate-700 font-bold text-sm tracking-wider">
                    ~ {doctorName.replace('Dr. ', '')} ~
                  </span>
                </div>
                <div className="w-3/4 mx-auto border-t border-slate-400"></div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Attending Physician Signature
                </span>
                <div className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-mono font-bold mt-1">
                  E-VERIFIED PRESCRIBER SEAL
                </div>
              </div>
            </div>

            {/* Prescriber Security Highlights */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                Prescribing Studio Security Features
              </h5>
              <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Direct patient account synchronization.</li>
                <li>Digital watermark & anti-forgery tamper serial.</li>
                <li>Instant pre-clearance on prescription-only pharmaceuticals.</li>
                <li>Automatic notification dispatch to patient's dashboard.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2: Prescription Registry & Records */}
      {activeTab === 'records' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Official Prescriptions Issued & Registered</h3>
              <p className="text-xs text-slate-500">Live clinical repository of digital and uploaded patient prescriptions</p>
            </div>
            <button
              onClick={() => setActiveTab('pad')}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-2xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue New E-Prescription</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-y border-slate-100">
                <tr>
                  <th className="p-3.5">Rx ID / Date</th>
                  <th className="p-3.5">Patient Details</th>
                  <th className="p-3.5">Prescriber / Clinic</th>
                  <th className="p-3.5">Prescribed Drug(s)</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescriptions.map((rx) => {
                  const isEVP = rx.isDigitalEPrescription;
                  return (
                    <tr key={rx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-slate-900 block">{rx.id}</span>
                        <span className="text-[11px] text-slate-400">{rx.issueDate}</span>
                        {isEVP && (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-sky-100 text-sky-800">
                            E-VERIFIED PAD
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 block">{rx.customerName}</span>
                        <span className="text-[11px] text-slate-500">{rx.customerEmail}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-900 block">{rx.doctorName}</span>
                        <span className="text-[11px] text-slate-500">{rx.clinicHospital}</span>
                        <span className="text-[10px] font-mono text-slate-400 block">PRC: {rx.licenseRegNo}</span>
                      </td>
                      <td className="p-3.5 max-w-[220px]">
                        <span className="font-medium text-slate-800 truncate block">
                          {rx.prescribedMedicineName || rx.medicineIds?.join(', ') || 'Specialized formulation'}
                        </span>
                        {rx.dosageInstructions && (
                          <span className="text-[10px] text-slate-500 line-clamp-1">
                            Sig: {rx.dosageInstructions}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            rx.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rx.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rx.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setPreviewRx(rx)}
                          className="px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Rx Slip</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Rx Slip Modal */}
      {previewRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-slate-200">
            {/* Close Button */}
            <button
              onClick={() => setPreviewRx(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Official Medical Letterhead */}
            <div className="text-center pb-4 border-b-2 border-slate-800 space-y-1">
              <div className="inline-flex items-center gap-1 text-sky-700 font-extrabold text-xs tracking-wider uppercase mb-1">
                <Hospital className="w-4 h-4" />
                <span>MediReach Specialized Pharmaceutical Health Network</span>
              </div>
              <h3 className="text-lg font-black text-slate-900">{previewRx.doctorName}</h3>
              <p className="text-xs text-slate-600 font-medium">{previewRx.clinicHospital}</p>
              <p className="text-[11px] font-mono text-slate-500">
                PRC Lic No: <strong>{previewRx.licenseRegNo}</strong> · S2 Drug Lic: <strong>{previewRx.deaNumber || 'S2-DOH-PH-7789'}</strong>
              </p>
            </div>

            {/* Patient Header */}
            <div className="grid grid-cols-2 gap-4 text-xs font-serif bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-slate-500 block text-[10px] font-sans uppercase">Patient Name:</span>
                <span className="font-bold text-slate-900">{previewRx.customerName}</span>
                <span className="text-slate-500 block text-[11px]">{previewRx.customerEmail}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[10px] font-sans uppercase">Date Prescribed:</span>
                <span className="font-bold text-slate-900">{previewRx.issueDate}</span>
                <span className="text-slate-500 block text-[11px]">Rx Serial: {previewRx.id}</span>
              </div>
              {previewRx.diagnosis && (
                <div className="col-span-2 pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block text-[10px] font-sans uppercase">Clinical Diagnosis:</span>
                  <span className="font-bold text-slate-800">{previewRx.diagnosis}</span>
                </div>
              )}
            </div>

            {/* Rx Body */}
            <div className="space-y-3 py-2 min-h-[120px]">
              <span className="font-serif font-black text-4xl text-sky-800 block leading-none">℞</span>
              <div className="pl-6 space-y-3 font-mono text-xs">
                <div className="font-sans font-extrabold text-sm text-slate-900">
                  {previewRx.prescribedMedicineName || previewRx.medicineIds?.join(', ')}
                </div>
                <div className="text-slate-700 leading-relaxed font-sans">
                  <strong>Sig:</strong> {previewRx.dosageInstructions || 'Administer as prescribed by certified specialist.'}
                </div>
                {previewRx.notes && (
                  <div className="text-[11px] text-slate-500 font-sans italic">
                    Special notes: {previewRx.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Verification Watermark & Signature Area */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>AUTHENTIC E-VERIFIED PRESCRIPTION</span>
                </div>
                <p className="text-[9px] font-mono text-slate-400">
                  DIGITAL SEAL: {previewRx.digitalSignature || 'SHA256-DIGITAL-SIG-VERIFIED'}
                </p>
              </div>

              <div className="text-center sm:text-right">
                <span className="font-serif italic font-bold text-sm text-slate-800 block">
                  {previewRx.doctorName}
                </span>
                <div className="w-36 border-t border-slate-400 mt-1"></div>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block">
                  Authorized Prescriber Signature
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setPreviewRx(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close Slip
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Rx Pad Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
