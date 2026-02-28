import { useState } from 'react';
import { X, CreditCard, Wallet, DollarSign } from 'lucide-react';
import { paymentService } from '../../api/services';
import GlassButton from './GlassButton';
import GlassInput from './GlassInput';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  amount: number;
  onSuccess?: () => void;
}

export const PaymentModal = ({ isOpen, onClose, jobId, amount, onSuccess }: PaymentModalProps) => {
  const [paymentMode, setPaymentMode] = useState<'online' | 'offline'>('online');
  const [tip, setTip] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const totalAmount = amount + (parseFloat(tip) || 0);

  const handlePayment = async () => {
    setLoading(true);
    try {
      if (paymentMode === 'offline') {
        await paymentService.confirmOffline({
          jobId,
          amount,
          tip: parseFloat(tip) || 0,
        });
        onSuccess?.();
        onClose();
      } else {
        // Online payment - would integrate with Razorpay here
        const { data } = await paymentService.createOrder({
          jobId,
          amount,
          tip: parseFloat(tip) || 0,
        });
        // TODO: Integrate Razorpay payment gateway
        console.log('Payment order created:', data);
        onSuccess?.();
        onClose();
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 glass-modal"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card rounded-3xl p-8 max-w-md w-full animate-fadeInUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 glass-button rounded-full p-2 hover:bg-white/20 transition-all"
        >
          <X size={20} className="text-white" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Complete Payment</h2>
          <p className="text-white/70 text-sm">Choose your payment method</p>
        </div>

        {/* Payment Mode Selection */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setPaymentMode('online')}
            className={`glass-nested rounded-xl p-4 transition-all ${
              paymentMode === 'online' 
                ? 'bg-blue-500/20 border-2 border-blue-500/50' 
                : 'hover:bg-white/10'
            }`}
          >
            <CreditCard size={24} className="mx-auto mb-2 text-blue-400" />
            <p className="text-sm font-medium text-white">Online</p>
          </button>

          <button
            onClick={() => setPaymentMode('offline')}
            className={`glass-nested rounded-xl p-4 transition-all ${
              paymentMode === 'offline' 
                ? 'bg-green-500/20 border-2 border-green-500/50' 
                : 'hover:bg-white/10'
            }`}
          >
            <Wallet size={24} className="mx-auto mb-2 text-green-400" />
            <p className="text-sm font-medium text-white">Cash</p>
          </button>
        </div>

        {/* Amount Details */}
        <div className="glass-nested rounded-xl p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm">Job Amount</span>
            <span className="text-white font-semibold">₹{amount}</span>
          </div>

          <div className="border-t border-white/10 pt-3">
            <label className="text-sm text-white/70 mb-2 block">Add Tip (Optional)</label>
            <GlassInput
              type="number"
              placeholder="0"
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              icon={<DollarSign size={16} />}
              min="0"
              step="0.01"
            />
          </div>

          <div className="border-t border-white/10 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold">Total Amount</span>
              <span className="text-2xl font-bold text-green-400">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <GlassButton
          variant="success"
          fullWidth
          onClick={handlePayment}
          disabled={loading}
        >
          {loading ? 'Processing...' : `Pay ₹${totalAmount.toFixed(2)}`}
        </GlassButton>

        {paymentMode === 'offline' && (
          <p className="text-center text-xs text-white/60 mt-4">
            Please pay the worker in cash after job completion
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
