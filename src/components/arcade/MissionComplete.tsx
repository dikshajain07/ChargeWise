import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AwardIcon } from 'lucide-react';
import { ArcadeButton } from './ArcadeButton';
import type { BadgeDef } from '../../types/user';

interface MissionCompleteProps {
  open: boolean;
  onClose: () => void;
  stats: Array<{label: string;value: string;}>;
  xp: number;
  badges: BadgeDef[];
  savedNote?: string;
  secondaryAction?: {label: string;onClick: () => void;};
}

export function MissionComplete({ open, onClose, stats, xp, badges, savedNote, secondaryAction }: MissionCompleteProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open &&
      <motion.div
        className="fixed inset-0 z-[80] grid place-items-center bg-void/80 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
        onClick={onClose}>
        
          <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mission-title"
          className="hud-panel hud-go w-full max-w-md p-6 sm:p-8"
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          onClick={(e) => e.stopPropagation()}>
          
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-muted">Feasible plan locked in</p>
            <h2 id="mission-title" className="pixel-glow-go mt-3 font-pixel text-xl leading-snug text-go sm:text-2xl">
              MISSION COMPLETE
            </h2>
            <dl className="mt-6 grid grid-cols-2 gap-4">
              {stats.map((s) =>
            <div key={s.label}>
                  <dt className="cw-label">{s.label}</dt>
                  <dd className="mt-1 font-mono text-lg font-bold">{s.value}</dd>
                </div>
            )}
            </dl>
            <div className="mt-6 flex items-center justify-between rounded-md border border-xp/40 bg-xp/10 px-4 py-3">
              <span className="text-sm font-semibold">XP earned</span>
              <span className="font-pixel text-sm text-xp">+{xp}</span>
            </div>
            {badges.length > 0 &&
          <ul className="mt-3 space-y-2" aria-label="New badges">
                {badges.map((b) =>
            <li key={b.id} className="flex items-start gap-3 rounded-md border border-line px-3 py-2">
                    <AwardIcon className="mt-0.5 h-4 w-4 shrink-0 text-xp" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold">{b.name}</p>
                      <p className="text-xs text-muted">{b.description}</p>
                    </div>
                  </li>
            )}
              </ul>
          }
            {savedNote && <p className="mt-4 text-xs text-muted">{savedNote}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              {secondaryAction &&
            <ArcadeButton variant="ghost" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </ArcadeButton>
            }
              <ArcadeButton ref={closeRef} variant="go" onClick={onClose}>
                Continue
              </ArcadeButton>
            </div>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}