import React from 'react';
import { useView } from '../../state/view/viewStore';
import { useProject } from '../../state/project/projectStore';
import { getPinColor } from '../../utils/theme';
import { validateConnection } from '../../core/connections/validateConnection';
import { Zap, AlertTriangle, CheckCircle } from 'lucide-react';

export const PinTooltip: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();

  const hovered = viewState.hoveredPin;
  const activeWiring = viewState.activeWiring;

  if (!hovered && !activeWiring) return null;

  let compName = '';
  let pinName = '';
  let pinType = '';
  let pinColor = '#3b82f6';
  let validationMessage: { text: string; severity: 'info' | 'warning' | 'error' } | null = null;

  if (hovered) {
    const comp = projectState.components.find((c) => c.id === hovered.componentId);
    const pin = comp?.pins.find((p) => p.id === hovered.pinId);
    if (comp && pin) {
      compName = comp.name;
      pinName = pin.name;
      pinType = `${pin.type} • ${pin.direction}`;
      pinColor = getPinColor(pin.type);

      // If wiring, show live validation message
      if (activeWiring && activeWiring.sourceComponentId !== hovered.componentId) {
        const sourceComp = projectState.components.find(
          (c) => c.id === activeWiring.sourceComponentId
        );
        const sourcePin = sourceComp?.pins.find((p) => p.id === activeWiring.sourcePinId);
        if (sourcePin) {
          const res = validateConnection(sourcePin, pin, sourceComp?.id, comp.id);
          validationMessage = {
            text: res.message,
            severity: res.severity,
          };
        }
      }
    }
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 pointer-events-none select-none">
      {/* Active Wiring Guidance Bar */}
      {activeWiring && (
        <div className="px-3.5 py-1.5 rounded-full bg-white/95 border border-blue-200 shadow-lg text-xs flex items-center gap-2 backdrop-blur-md">
          <Zap size={13} className="text-blue-600 animate-pulse" />
          <span className="text-slate-800">
            Wiring active: <strong className="text-blue-600 font-mono">click target pin</strong> to connect
          </span>
          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
            Esc to cancel
          </span>
        </div>
      )}

      {/* Hovered Pin Card */}
      {hovered && compName && (
        <div className="px-3 py-2 rounded-lg bg-white/95 border border-slate-200 shadow-xl backdrop-blur-md flex flex-col gap-1 min-w-[200px]">
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-slate-500 font-medium">{compName}</span>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: pinColor }}
              />
              <span className="text-slate-700 uppercase">{pinType}</span>
            </div>
          </div>

          <div className="text-sm font-bold font-mono text-slate-900 flex items-center gap-1.5">
            <span>{pinName}</span>
          </div>

          {/* Real-time validation warning or error */}
          {validationMessage && (
            <div
              className={`mt-1 pt-1 border-t border-slate-100 text-[11px] flex items-center gap-1.5 ${
                validationMessage.severity === 'error'
                  ? 'text-red-600'
                  : validationMessage.severity === 'warning'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {validationMessage.severity === 'error' && <AlertTriangle size={12} />}
              {validationMessage.severity === 'warning' && <AlertTriangle size={12} />}
              {validationMessage.severity === 'info' && <CheckCircle size={12} />}
              <span>{validationMessage.text}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
