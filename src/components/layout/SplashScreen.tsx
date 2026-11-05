// components/SplashScreen.tsx
import React from 'react';
import { Logo } from '../ui/Logo';

/** Shown while the session is restored: the letterhead on a blank sheet. */
const SplashScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-desk animate-fade" role="status" aria-label="Cargando ibPulse">
            <Logo className="h-10 sm:h-12" />
            <div className="h-0.5 w-40 overflow-hidden rounded-full bg-rule" aria-hidden="true">
                <div className="h-full w-1/3 animate-[splash-line_1.1s_ease-in-out_infinite] bg-brand" />
            </div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-3">BY IBSYSTEMS.SRL</p>
        </div>
    );
};

export default SplashScreen;
