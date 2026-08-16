'use client';

import React, { useState } from 'react';
import { CheckCircle2, Construction, XCircle, X, ShieldCheck, ThumbsUp } from 'lucide-react';
import type { Change } from '@/types';
import { localDB } from '@/services/supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  change: Change | null;
  onVerified: (updatedChange: Change) => void;
}

export const GroundVerifyModal: React.FC<Props> = ({ isOpen, onClose, change, onVerified }) => {
  const [selectedStatus, setSelectedStatus] = useState<'open' | 'construction' | 'closed'>('open');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !change) return null;

  const placeName = change.new_data?.name || change.old_data?.name || change.title;

  const handleSubmit = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      let updatedType = change.change_type;
      let newSignificance = change.significance_score;
      let newConfidence = Math.min(1.0, (change.confidence || 0.9) + 0.05);

      if (selectedStatus === 'closed') {
        updatedType = 'business_removed';
        newSignificance = Math.max(70, newSignificance);
      } else if (selectedStatus === 'open') {
        updatedType = 'business_opened';
        newConfidence = 0.99;
      }

      const updatedChange: Change = {
        ...change,
        change_type: updatedType,
        confidence: newConfidence,
        verification_status: 'confirmed',
        description: note.trim()
          ? `${change.description} [Verified on the ground: ${note.trim()}]`
          : `${change.description} [Ground truth verified by local survey contributor]`,
        new_data: change.new_data ? {
          ...change.new_data,
          metadata: {
            ...change.new_data.metadata,
            ground_verified: true,
            verified_at: new Date().toISOString()
          }
        } : null
      };

      localDB.saveChanges([updatedChange]);
      onVerified(updatedChange);
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1000);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-white relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>COMMUNITY GROUND TRUTH SURVEY</span>
          </div>
          <h3 className="text-lg font-black text-white font-sans">
            Verify &ldquo;{placeName}&rdquo;
          </h3>
          <p className="text-xs text-zinc-400 font-sans">
            Crowdsource verify this local venue to boost spatial accuracy score for your neighborhood.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-6 text-center space-y-2 bg-emerald-950/40 border border-emerald-800/80 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="font-bold text-sm text-white">Verification Recorded!</h4>
            <p className="text-xs text-emerald-300 font-sans">Confidence score updated to 99%.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Options */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">
                What is the current status on the ground?
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('open')}
                  className={`btn-interactive p-3 rounded-xl border text-center space-y-1.5 transition-all cursor-pointer ${
                    selectedStatus === 'open'
                      ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-glow'
                      : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 mx-auto text-emerald-400" />
                  <span className="text-[11px] font-bold block uppercase">Open & Active</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('construction')}
                  className={`btn-interactive p-3 rounded-xl border text-center space-y-1.5 transition-all cursor-pointer ${
                    selectedStatus === 'construction'
                      ? 'bg-amber-950/60 border-amber-500 text-white shadow-glow'
                      : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <Construction className="w-5 h-5 mx-auto text-amber-400" />
                  <span className="text-[11px] font-bold block uppercase">Under Work</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('closed')}
                  className={`btn-interactive p-3 rounded-xl border text-center space-y-1.5 transition-all cursor-pointer ${
                    selectedStatus === 'closed'
                      ? 'bg-red-950/60 border-red-500 text-white shadow-glow'
                      : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <XCircle className="w-5 h-5 mx-auto text-red-400" />
                  <span className="text-[11px] font-bold block uppercase">Closed / Gone</span>
                </button>
              </div>
            </div>

            {/* Optional notes */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase">
                Observer Notes (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Saw grand opening ribbon last weekend, new patio seating added..."
                className="w-full bg-black border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 resize-none h-18"
              />
            </div>

            {/* Submit Action */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-interactive w-full py-2.5 bg-white hover:bg-zinc-200 text-black font-black text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording Verification...' : 'Submit Ground Truth'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
