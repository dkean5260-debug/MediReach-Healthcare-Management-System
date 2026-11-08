import React, { useState, useEffect } from 'react';
import {
  X,
  Stethoscope,
  ShieldCheck,
  FileSignature,
  Building,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Lock,
  ThermometerSnowflake,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Medicine, Prescription } from '../../types/index.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPrescriptionIssued?: (rx: Prescription) => void;
  preSelectedMedicine?: Medicine | null;
}

interface PhysicianPreset {
  name: string;
  title: string;
  hospital: string;
  license: string;
  dea: string;
}

const PHYSICIAN_PRESETS: PhysicianPreset[] = [
  {
    name: 'Dr. Eleanor Vance, MD',
    title: 'Chief of Medical Genetics & Rare Disorders',
    hospital: 'St. Elizabeth Specialty Hospital & Rare Disease Center',
    license: 'MD-88391-BOARD-CERT',
    dea: 'BV-9912044',
  },
  {
    name: 'Dr. Marcus Sterling, MD',
    title: 'Pediatric Neurology & SMA Specialist',
    hospital: 'Metropolitan University Children\'s Hospital',
    license: 'MD-44912-NEURO',
    dea: 'BS-8422190',
  },
  {
    name: 'Dr. Aris Thorne, MD',
    title: 'Director of Hematology & Complement Biology',
    hospital: 'Memorial Comprehensive Specialty Center',
    license: 'MD-66201-HEMATO',
    dea: 'BT-3391082',
  },
];

export const DoctorPrescribeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onPrescriptionIssued,
  preSelectedMedicine,
}) => {
  const { user } = useAuth();

  // Physician fields
  const [selectedPhysicianIdx, setSelectedPhysicianIdx] = useState(0);
  const [doctorName, setDoctorName] = useState(PHYSICIAN_PRESETS[0].name);
  const [clinicHospital, setClinicHospital] = useState(PHYSICIAN_PRESETS[0].hospital);
  const [licenseRegNo, setLicenseRegNo] = useState(PHYSICIAN_PRESETS[0].license);
  const [deaNumber, setDeaNumber] = useState(PHYSICIAN_PRESETS[0].dea);

  // Patient fields
  const [patientName, setPatientName] = useState(user?.name || 'Sarah Jenkins');
  const [patientEmail, setPatientEmail] = useState(user?.email || 'customer.sarah@example.com');
  const [diagnosis, setDiagnosis] = useState('Paroxysmal Nocturnal Hemoglobinuria (PNH) with complement hemolysis');

  // Medicine & Regimen
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('');
  const [selectedMedicineName, setSelectedMedicineName] = useState('Soliris (Eculizumab 300mg/30mL)');
  const [dosageInstructions, setDosageInstructions] = useState(
    'Initial induction: 900 mg IV infusion weekly for first 4 weeks, followed by 1200 mg at week 5, then 1200 mg every 2 weeks.'
  );
  const [quantityPrescribed, setQuantityPrescribed] = useState(4);
  const [refillsAuthorized, setRefillsAuthorized] = useState(2);
  const [coldChainRequired, setColdChainRequired] = useState(true);
  const [doctorNotes, setDoctorNotes] = useState(
    'Specialty biologic distribution authorized. Pre-medication administered. Maintain strict 2°C to 8°C cold chain.'
  );

  const [digitalSignature, setDigitalSignature] = useState(PHYSICIAN_PRESETS[0].name);
  const [loading, setLoading] = useState(false);
  const [successRx, setSuccessRx] = useState<Prescription | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch medicines for prescribing dropdown
  useEffect(() => {
    async function fetchMeds() {
      try {
        const res = await fetch('/api/medicines');
        if (res.ok) {
          const data = await res.json();
          setMedicines(data.medicines || []);
          if (preSelectedMedicine) {
            setSelectedMedicineId(preSelectedMedicine.id);
            setSelectedMedicineName(`${preSelectedMedicine.name} (${preSelectedMedicine.genericName} - ${preSelectedMedicine.dosageForm})`);
            setDosageInstructions(preSelectedMedicine.labelDosageInstructions || 'Administer according to specialized protocol.');
            if (preSelectedMedicine.condition) {
              setDiagnosis(preSelectedMedicine.condition);
            }
          } else if (data.medicines?.length > 0) {
            const first = data.medicines[0];
            setSelectedMedicineId(first.id);
            setSelectedMedicineName(`${first.name} (${first.genericName} - ${first.dosageForm})`);
            setDosageInstructions(first.labelDosageInstructions || 'Administer as directed by specialist.');
            if (first.condition) setDiagnosis(first.condition);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (isOpen) {
      fetchMeds();
      setSuccessRx(null);
      setError(null);
    }
  }, [isOpen, preSelectedMedicine]);

  if (!isOpen) return null;

  const handlePhysicianPresetChange = (idx: number) => {
    setSelectedPhysicianIdx(idx);
    const p = PHYSICIAN_PRESETS[idx];
    setDoctorName(p.name);
    setClinicHospital(p.hospital);
    setLicenseRegNo(p.license);
    setDeaNumber(p.dea);
    setDigitalSignature(p.name);
  };

  const handleMedicineChange = (medId: string) => {
    setSelectedMedicineId(medId);
    const found = medicines.find((m) => m.id === medId);
    if (found) {
      setSelectedMedicineName(`${found.name} (${found.genericName} - ${found.dosageForm})`);
      setDosageInstructions(found.labelDosageInstructions || 'Administer as directed by specialist.');
      if (found.condition) setDiagnosis(found.condition);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/prescriptions/doctor-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName,
          clinicHospital,
          licenseRegNo,
          deaNumber,
          customerId: user?.id,
          customerName: patientName,
          customerEmail: patientEmail,
          diagnosis,
          medicineId: selectedMedicineId,
          medicineName: selectedMedicineName,
          dosageInstructions,
          quantityPrescribed,
          refillsAuthorized,
          digitalSignature,
          notes: doctorNotes,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok && data.prescription) {
        setSuccessRx(data.prescription);
        if (onPrescriptionIssued) {
          onPrescriptionIssued(data.prescription);
        }
      } else {
        setError(data.error || 'Failed to transmit electronic prescription.');
      }
    } catch (err) {
      setLoading(false);
      setError('Communication with the pharmaceutical e-Rx server failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-sky-700 via-sky-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold tracking-tight">Doctor E-Prescribing Studio</h2>
                <span className="text-[10px] uppercase tracking-wider font-extrabold bg-emerald-500/90 text-white px-2 py-0.5 rounded-full border border-emerald-400">
                  Verified Prescriber Pad
                </span>
              </div>
              <p className="text-xs text-sky-100 mt-0.5">
                Issue tamper-evident, digitally signed doctor prescriptions for rare &amp; specialty medications
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State View */}
        {successRx ? (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">
                Official E-Prescription Issued &amp; Transmitted!
              </h3>
              <p className="text-xs text-slate-500">
                Prescription <span className="font-mono font-bold text-slate-800">{successRx.id}</span> has been authenticated by{' '}
                <span className="font-semibold text-slate-800">{successRx.doctorName}</span> and recorded into the patient record for{' '}
                <span className="font-semibold text-slate-800">{successRx.customerName}</span>.
              </p>
            </div>

            {/* Generated Document Card Preview */}
            <div className="max-w-lg mx-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                <span className="font-mono font-bold text-sky-700">{successRx.id}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  VERIFIED &amp; APPROVED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Prescribed Medicine:</span>
                  <span className="font-bold text-slate-900">{successRx.prescribedMedicineName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Attending Physician:</span>
                  <span className="font-semibold text-slate-800">{successRx.doctorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Authorized Patient:</span>
                  <span className="font-semibold text-slate-800">{successRx.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">License / DEA:</span>
                  <span className="font-mono text-slate-700">{successRx.licenseRegNo}</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Clinical Sig / Dosage Instructions:
                </span>
                <p className="text-slate-800 italic">{successRx.dosageInstructions}</p>
                <div className="pt-1 flex gap-4 text-[11px] text-slate-600 font-mono">
                  <span>Qty: <strong>{successRx.quantityPrescribed} units</strong></span>
                  <span>Refills: <strong>{successRx.refillsAuthorized}</strong></span>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Cryptographically Signed &amp; Stamped
                </span>
                <a
                  href={successRx.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-sky-600 hover:text-sky-700 underline"
                >
                  View Official Vector Document
                </a>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setSuccessRx(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Write Another Prescription
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 transition-all"
              >
                Done / Proceed to Orders
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {error && (
              <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* SECTION 1: Physician Preset Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-sky-600" />
                  <span>1. Attending Prescribing Physician</span>
                </label>
                <span className="text-[10px] text-slate-500">Select certified specialist</span>
              </div>

              {/* Quick Preset Selector Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PHYSICIAN_PRESETS.map((p, idx) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handlePhysicianPresetChange(idx)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      selectedPhysicianIdx === idx
                        ? 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-500/20'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-white'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900 leading-tight">{p.name}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{p.title}</p>
                    <span className="inline-block mt-1.5 font-mono text-[9px] font-semibold text-sky-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      Lic: {p.license}
                    </span>
                  </button>
                ))}
              </div>

              {/* Editable Physician Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Physician Full Name &amp; Degree
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Clinic / Hospital / Medical Center
                  </label>
                  <input
                    type="text"
                    value={clinicHospital}
                    onChange={(e) => setClinicHospital(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Medical Board License #
                  </label>
                  <input
                    type="text"
                    value={licenseRegNo}
                    onChange={(e) => setLicenseRegNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    DEA Registration # (Controlled Biologics)
                  </label>
                  <input
                    type="text"
                    value={deaNumber}
                    onChange={(e) => setDeaNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: Patient Info */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-sky-600" />
                <span>2. Patient Identification &amp; Clinical Indication</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Patient Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Patient Account Email
                  </label>
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={(e) => setPatientEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Clinical Diagnosis &amp; Indication for Biologic Therapy
                  </label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Paroxysmal Nocturnal Hemoglobinuria (PNH)"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium text-slate-800"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Medication & Regimen */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileSignature className="w-4 h-4 text-sky-600" />
                <span>3. Medicine Prescribed &amp; Administration Directive (Sig)</span>
              </label>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Select Rare / Orphan Medication from Catalog
                  </label>
                  <select
                    value={selectedMedicineId}
                    onChange={(e) => handleMedicineChange(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold text-slate-900"
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.genericName} - {m.dosageForm}) - ${m.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Dosage &amp; Infusion Instructions (Sig)
                  </label>
                  <textarea
                    rows={2}
                    value={dosageInstructions}
                    onChange={(e) => setDosageInstructions(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-800 leading-relaxed font-sans"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Dispense Quantity (Vials/Packs)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={quantityPrescribed}
                      onChange={(e) => setQuantityPrescribed(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Authorized Refills
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={12}
                      value={refillsAuthorized}
                      onChange={(e) => setRefillsAuthorized(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
                      required
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1 flex items-end">
                    <label className="flex items-center gap-2 p-2.5 bg-sky-50 border border-sky-200 rounded-xl text-[11px] text-sky-900 font-semibold cursor-pointer w-full">
                      <input
                        type="checkbox"
                        checked={coldChainRequired}
                        onChange={(e) => setColdChainRequired(e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <ThermometerSnowflake className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>Refrigerated 2°C–8°C</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Clinical Notes to Dispensing Pharmacist
                  </label>
                  <input
                    type="text"
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Digital Signature */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Physician Electronic Signature &amp; Legal Attestation</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  SHA-256 PKI Authenticated
                </span>
              </div>

              <div className="p-3 bg-white border border-slate-300 rounded-xl">
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1">
                  Electronic Signature Stamp:
                </p>
                <div className="font-serif italic text-2xl text-blue-950 font-bold tracking-wide">
                  {digitalSignature}
                </div>
                <p className="text-[9px] text-slate-400 mt-1">
                  Attestation: I certify that I am a board-certified physician with an active state license. This prescription is medically necessary for the identified patient.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md shadow-sky-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{loading ? 'Digitally Signing & Transmitting...' : 'Sign & Issue Doctor E-Prescription'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
