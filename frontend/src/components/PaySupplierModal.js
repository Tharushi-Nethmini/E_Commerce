
import '@/styles/pay-supplier-modal.css';
import { useState, useEffect } from 'react';

export default function PaySupplierModal({ open, onClose, restock, onSubmit, readOnlyBankFields }) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    branch: ''
  });

  useEffect(() => {
    if (restock) {
      setAmount(restock.amount || restock.total || '');
      setBankDetails({
        accountName: restock.supplierBank?.accountName || '',
        accountNumber: restock.supplierBank?.accountNumber || '',
        bankName: restock.supplierBank?.bankName || '',
        branch: restock.supplierBank?.branch || ''
      });
    }
  }, [restock]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.3)', zIndex: 1000 }}>
      <div className="modal" style={{ background: '#fff', padding: 24, borderRadius: 8, maxWidth: 400, margin: '60px auto', position: 'relative' }}>
        <h2>Pay Supplier</h2>
        <form onSubmit={e => { e.preventDefault(); onSubmit({ amount, paymentMethod, bankDetails }); }}>
          <div style={{ marginBottom: 12 }}>
            <label>Amount</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required style={{ width: '100%' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Payment Method</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%' }}>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
          {paymentMethod === 'BANK_TRANSFER' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label>Account Name</label>
                <input value={bankDetails.accountName} onChange={e => setBankDetails(b => ({ ...b, accountName: e.target.value }))} required style={{ width: '100%' }} readOnly={readOnlyBankFields} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Account Number</label>
                <input value={bankDetails.accountNumber} onChange={e => setBankDetails(b => ({ ...b, accountNumber: e.target.value }))} required style={{ width: '100%' }} readOnly={readOnlyBankFields} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Bank Name</label>
                <input value={bankDetails.bankName} onChange={e => setBankDetails(b => ({ ...b, bankName: e.target.value }))} required style={{ width: '100%' }} readOnly={readOnlyBankFields} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Branch</label>
                <input value={bankDetails.branch} onChange={e => setBankDetails(b => ({ ...b, branch: e.target.value }))} required style={{ width: '100%' }} readOnly={readOnlyBankFields} />
              </div>
            </>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="submit" style={{ background: '#0070f3', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 4 }}>Pay</button>
            <button type="button" onClick={onClose} style={{ background: '#eee', border: 'none', padding: '8px 16px', borderRadius: 4 }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
