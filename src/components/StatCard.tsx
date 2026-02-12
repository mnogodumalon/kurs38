import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  hero?: boolean;
}

export function StatCard({ label, value, icon, hero = false }: StatCardProps) {
  return (
    <div className={`stat-card ${hero ? 'stat-card-hero' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-medium ${hero ? 'opacity-80' : 'text-muted-foreground'}`}>
            {label}
          </p>
          <p className={`text-3xl font-bold mt-1 tracking-tight ${hero ? '' : 'text-foreground'}`}>
            {value}
          </p>
        </div>
        <div className={`p-2.5 rounded-lg ${hero ? 'bg-primary-foreground/20' : 'bg-primary/10'}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
