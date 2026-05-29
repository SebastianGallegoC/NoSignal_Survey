import { type ReactNode, useEffect } from 'react';

import { useAuthStore } from '@/store/useAuthStore';

interface AuthBootstrapProps {
  children: ReactNode;
}

export const AuthBootstrap = ({ children }: AuthBootstrapProps) => {
  const hydrate = useAuthStore((s) => s.hydrate);
  const ready = useAuthStore((s) => s.ready);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] text-slate-600">
        Cargando sesión…
      </div>
    );
  }

  return children;
};
