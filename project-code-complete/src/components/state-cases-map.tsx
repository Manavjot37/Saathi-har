import { useMemo, useState } from 'react';
import { allIndiaFeatures } from '@/lib/india-map-data';
import { useLanguage } from '@/lib/i18n';
import { DistrictDetailsModal } from '@/components/district-details-modal';
import { ExternalLink } from 'lucide-react';

interface StateCasesMapProps {
  stateId: string;
  className?: string;
  onSelectDistrict?: (districtName: string) => void;
}

export function StateCasesMap({ stateId, className, onSelectDistrict }: StateCasesMapProps) {
  const { t } = useLanguage();
  const [selectedDistrictModal, setSelectedDistrictModal] = useState<{
    name: string;
    totalCases?: number;
  } | null>(null);

  const state = useMemo(() => allIndiaFeatures.find((s) => s.id === stateId), [stateId]);

  if (!state) {
    return <div className="p-4 text-muted-foreground">{t('stateNotFound')}</div>;
  }

  const { pathD, bounds, districts } = state;
  const b = bounds && typeof bounds.minX === 'number' && bounds.width ? bounds : { minX: 0, minY: 0, width: 612, height: 696 };

  const handleDistrictClick = (d: { name: string; totalCases?: number }) => {
    if (onSelectDistrict) {
      onSelectDistrict(d.name);
    } else {
      setSelectedDistrictModal(d);
    }
  };

  return (
    <div className={`saathi-panel p-4 sm:p-6 space-y-6 ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-display text-xl font-bold text-foreground">{state.name}</h2>
        <span className="text-sm text-muted-foreground">({state.code})</span>
      </div>

      {/* SVG map for the state */}
      <div className="relative w-full h-[400px] bg-muted/15 rounded-xl border border-border/50 flex items-center justify-center overflow-hidden">
        <svg viewBox={`${b.minX} ${b.minY} ${b.width} ${b.height}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full p-4">
          <path d={pathD} fill="oklch(0.65 0.22 250)" stroke="oklch(0.3 0.05 250 / 0.5)" strokeWidth={1} />
        </svg>
      </div>

      {/* District list */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-muted-foreground">{t('districts')} ({districts?.length ?? 0})</h3>
          <span className="text-xs text-muted-foreground italic">Click any district to view live analytics</span>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-foreground">
          {(districts || []).map((d) => (
            <li
              key={d.name}
              onClick={() => handleDistrictClick(d)}
              className="border border-border/50 hover:border-brand hover:bg-brand/10 rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer transition-colors group"
            >
              <span className="font-medium text-foreground group-hover:text-brand flex items-center gap-1">
                {d.name}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand" />
              </span>
              {d.totalCases !== undefined && (
                <span className="text-xs font-semibold text-muted-foreground group-hover:text-brand">
                  {d.totalCases} cases
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {selectedDistrictModal && (
        <DistrictDetailsModal
          isOpen={Boolean(selectedDistrictModal)}
          onClose={() => setSelectedDistrictModal(null)}
          districtName={selectedDistrictModal.name}
          totalCases={selectedDistrictModal.totalCases}
        />
      )}
    </div>
  );
}
