import { useState } from 'react';
import { motion } from 'framer-motion';
import useSeo from '../../hooks/useSeo.js';
import { FaGift, FaEnvelope, FaLock, FaCheck } from 'react-icons/fa';

const AMOUNTS = [500, 1000, 2000, 5000];

export default function GiftCards() {
  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useSeo({
    title: 'Buy SmartServe Gift Cards | Home Services Gifts',
    description: 'Give the gift of a clean, comfortable home. Buy SmartServe digital gift cards for AC repair, plumbing, or cleaning services. Perfect for housewarmings.',
    path: '/gift-cards',
  });

  const handlePurchase = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call to Razorpay/Stripe for gift card purchase
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <main className="bg-gray-50 min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-tint text-brand mb-6">
            <FaGift className="text-3xl" />
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Give the Gift of a Happy Home</h1>
          <p className="text-ink-muted max-w-2xl mx-auto">
            Perfect for housewarmings, holidays, or just to say thank you. SmartServe digital gift cards can be used for any service on our platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-line">
            {success ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
                  <FaCheck className="text-2xl" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Purchase Successful!</h2>
                <p className="text-ink-muted">We've emailed the gift card code and instructions to your email address.</p>
              </motion.div>
            ) : (
              <form onSubmit={handlePurchase}>
                <h2 className="text-xl font-bold mb-6">Select Amount</h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                      className={`py-3 rounded-xl border-2 font-bold transition-all ${
                        selectedAmount === amt && !customAmount
                          ? 'border-brand bg-brand-tint text-brand-dark'
                          : 'border-gray-200 text-gray-600 hover:border-brand/50'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Or enter a custom amount (₹)</label>
                  <input
                    type="number"
                    min="100"
                    max="50000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <h2 className="text-xl font-bold mb-4 mt-8">Recipient Details</h2>
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Recipient's Name</label>
                    <input type="text" required placeholder="John Doe" className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-brand focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Recipient's Email</label>
                    <div className="relative">
                      <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="email" required placeholder="john@example.com" className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-3 focus:border-brand focus:outline-none" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-4 text-sm font-bold text-white hover:bg-brand-dark transition-colors disabled:opacity-70"
                >
                  <FaLock className="text-xs" />
                  {isSubmitting ? 'Processing...' : `Proceed to Pay ₹${customAmount || selectedAmount}`}
                </button>
                <p className="text-center text-xs text-ink-muted mt-4">
                  Secured by Razorpay. The gift card code will be delivered via email.
                </p>
              </form>
            )}
          </div>

          {/* Right: Visual Preview */}
          <div className="relative">
            <div className="sticky top-24">
              <motion.div
                initial={{ rotateY: 20, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="bg-gradient-to-br from-brand to-brand-dark p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-white/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-32 w-32 bg-black/10 rounded-full blur-2xl"></div>
                
                <div className="relative z-10 flex flex-col h-56 justify-between">
                  <div className="flex justify-between items-start">
                    <div className="font-extrabold text-2xl tracking-tight">SmartServe</div>
                    <FaGift className="text-3xl opacity-80" />
                  </div>
                  
                  <div>
                    <p className="text-white/70 text-sm uppercase tracking-widest font-semibold mb-1">Gift Card</p>
                    <p className="text-5xl font-extrabold">₹{customAmount || selectedAmount}</p>
                  </div>
                  
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">To</p>
                      <p className="font-semibold text-lg">Your Loved One</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-xs mb-0.5">From</p>
                      <p className="font-semibold">You</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <div className="mt-8 text-sm text-ink-muted space-y-3">
                <p className="flex items-center gap-2"><FaCheck className="text-green-500" /> No expiration date</p>
                <p className="flex items-center gap-2"><FaCheck className="text-green-500" /> Can be used across all services</p>
                <p className="flex items-center gap-2"><FaCheck className="text-green-500" /> Delivered instantly via email</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}