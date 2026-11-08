import React, { useState, useEffect } from 'react';
import {
  FileUp,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  UserCheck,
  Building,
  Calendar,
  Eye,
  Plus,
  Stethoscope,
} from 'lucide-react';
import { Prescription } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { StatusBadge } from '../ui/Badge.tsx';
import { DoctorPrescribeModal } from '../doctor/DoctorPrescribeModal.tsx';

interface Props {
  onOpenLogin: () => void;
}

export const PrescriptionManager: React.FC<Props> = ({ onOpenLogin }) => {
  const { user, token } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [previewRx, setPreviewRx] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [doctorName, setDoctorName] = useState('Dr. Eleanor Vance, MD');
  const [clinicHospital, setClinicHospital] = useState('St. Elizabeth Specialty Hospital & Rare Disease Center');
  const [licenseRegNo, setLicenseRegNo] = useState('LIC-12345-BOARD-CERT');
  const [issueDate, setIssueDate] = useState('2026-11-04');
  const [documentUrl, setDocumentUrl] = useState('/src/assets/images/rx_sample_prescription_1794104817239.jpg');
  const [documentName, setDocumentName] = useState('Prescription_DrVance_Clinical.jpg');
  const [notes, setNotes] = useState('Specialty orphan drug dispensation prescription.');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPrescriptions = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/customer/prescriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [token]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setDocumentUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUsePresetDoc = () => {
    setDocumentUrl('/src/assets/images/rx_sample_prescription_1794104817239.jpg');
    setDocumentName('Prescription_Certified_DrVance.jpg');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!token) {
      onOpenLogin();
      return;
    }
    if (!doctorName || !clinicHospital || !licenseRegNo || !issueDate) {
      setUploadError('Please complete all physician and document fields.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/customer/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          doctorName,
          clinicHospital,
          licenseRegNo,
          issueDate,
          documentUrl,
          documentName,
          notes,
        }),
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setUploadError(data.error || 'Failed to submit prescription');
      } else {
        setShowUploadModal(false);
        fetchPrescriptions();
      }
    } catch (err) {
      setSubmitting(false);
      setUploadError('Failed to communicate with pharmacy verification server.');
    }
  };

  if (!user) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto">
        <FileText className="w-12 h-12 text-sky-600 mx-auto mb-3 stroke-1" />
        <h2 className="text-lg font-bold text-slate-900">Prescription Center</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Please log in with your customer account to upload, verify, and manage your doctor prescriptions.
        </p>
        <button
          onClick={onOpenLogin}
          className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs"
        >
          Sign In as Customer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Prescription Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Electronic physician e-prescriptions &amp; certified pharmacist verification records
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowDoctorModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-sky-700 to-indigo-700 hover:from-sky-800 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all"
          >
            <Stethoscope className="w-4 h-4 text-sky-200" />
            <span>Doctor E-Prescribing Pad</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 text-sky-600" />
            <span>Upload Patient Doc</span>
          </button>
        </div>
      </div>

      {/* Info Banner with Doctor direct issuing explanation */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-sky-50 to-indigo-50 border border-sky-200 text-xs text-sky-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Dual E-Prescription System:</span>
            <p className="text-sky-800 leading-relaxed text-[11px]">
              Doctors can digitally issue e-prescriptions directly through the <strong>Doctor E-Prescribing Pad</strong>, or patients can upload physical doctor prescription scans for licensed pharmacist board verification.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDoctorModal(true)}
          className="shrink-0 text-xs font-bold text-indigo-700 hover:text-indigo-800 underline decoration-indigo-300"
        >
          Open Doctor Prescribing Studio &rarr;
        </button>
      </div>

      {/* Prescriptions List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading prescription records...</div>
      ) : prescriptions.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <FileUp className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-sm font-semibold text-slate-800">No prescriptions recorded yet</h3>
            <p className="text-xs text-slate-500">
              Have your doctor issue a direct electronic prescription, or upload your physical prescription document.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setShowDoctorModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-sky-700 to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Use Doctor E-Prescribing Pad</span>
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-white text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-50"
            >
              Upload Patient Document
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-sky-300 shadow-2xs transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{rx.doctorName}</h3>
                    <StatusBadge status={rx.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{rx.clinicHospital}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Issue: {rx.issueDate}
                  </span>
                  <button
                    onClick={() => setPreviewRx(rx)}
                    className="p-1.5 text-xs text-slate-600 hover:text-sky-600 bg-slate-50 hover:bg-sky-50 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Doc</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">License / NPI:</span>
                  <span className="font-mono font-semibold text-slate-800">{rx.licenseRegNo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Document File:</span>
                  <span className="truncate block font-medium">{rx.documentName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Submitted:</span>
                  <span>{new Date(rx.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Review notes / Rejection feedback */}
              {rx.status === 'Approved' && rx.verifiedByStaffName && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Verified & Approved by {rx.verifiedByStaffName} on {rx.verifiedAt ? new Date(rx.verifiedAt).toLocaleDateString() : 'N/A'}.
                    {rx.notes && ` Note: ${rx.notes}`}
                  </span>
                </div>
              )}

              {rx.status === 'Rejected' && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Prescription Not Accepted:</span>
                    <span>{rx.rejectionReason || 'Please upload a legible document with valid physician NPI.'}</span>
                  </div>
                </div>
              )}

              {rx.status === 'Pending Review' && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Assigned to specialty clinical pharmacist queue. Verification underway.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <FileUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Upload Doctor Prescription</h3>
                  <p className="text-xs text-slate-500">Provide official medical details</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {uploadError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  {uploadError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Physician Full Name & Credentials
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Eleanor Vance, MD"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hospital / Clinic
                  </label>
                  <input
                    type="text"
                    value={clinicHospital}
                    onChange={(e) => setClinicHospital(e.target.value)}
                    placeholder="e.g. St. Elizabeth Hospital"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State License / NPI No.
                  </label>
                  <input
                    type="text"
                    value={licenseRegNo}
                    onChange={(e) => setLicenseRegNo(e.target.value)}
                    placeholder="e.g. LIC-12345"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  required
                />
              </div>

              {/* File Attachment */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Prescription Document (Image / PDF)
                  </label>
                  <button
                    type="button"
                    onClick={handleUsePresetDoc}
                    className="text-[11px] text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    Use Sample Clinic Rx
                  </button>
                </div>
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center hover:bg-slate-100/50 transition-colors">
                  <input
                    type="file"
                    id="rxFile"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="rxFile" className="cursor-pointer block">
                    <Upload className="w-7 h-7 text-sky-600 mx-auto mb-1.5" />
                    <span className="text-xs font-medium text-slate-700 block">
                      {documentName || 'Click to select file from your device'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      JPG, PNG, PDF up to 10MB
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Clinical Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Prescribed for bi-weekly infusion therapy..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Document Preview Modal */}
      {previewRx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900">{previewRx.documentName}</h3>
                <p className="text-[11px] text-slate-500">{previewRx.doctorName} · {previewRx.licenseRegNo}</p>
              </div>
              <button
                onClick={() => setPreviewRx(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-slate-900/5">
              <img
                src={previewRx.documentUrl}
                alt="Prescription Document"
                className="max-h-[65vh] object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <StatusBadge status={previewRx.status} />
              <button
                onClick={() => setPreviewRx(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor E-Prescribing Studio Modal */}
      <DoctorPrescribeModal
        isOpen={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        onPrescriptionIssued={() => {
          setShowDoctorModal(false);
          fetchPrescriptions();
        }}
      />
    </div>
  );
};
