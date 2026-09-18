import React from 'react';
import { useView } from '../../state/view/viewStore';
import { useProject } from '../../state/project/projectStore';
import { getPinColor } from '../../utils/theme';
import { validateConnection } from '../../core/connections/validateConnection';
import { validateConnectorConnection } from '../../core/connections/validateConnector';
import { Zap, AlertTriangle, CheckCircle, Cable } from 'lucide-react';

export const PinTooltip: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();

  const hoveredPin = viewState.hoveredPin;
  const hoveredConnector = viewState.hoveredConnector;
  const activeWiring = viewState.activeWiring;
  const activeConnectorWiring = viewState.activeConnectorWiring;

  if (!hoveredPin && !hoveredConnector && !activeWiring && !activeConnectorWiring) return null;

  let compName = '';
  let titleName = '';
  let subType = '';
  let dotColor = '#3b82f6';
  let hintText: string | null = null;
  let validationMessage: { text: string; severity: 'info' | 'warning' | 'error' } | null = null;

  if (hoveredPin) {
    const comp = projectState.components.find((c) => c.id === hoveredPin.componentId);
    const pin = comp?.pins.find((p) => p.id === hoveredPin.pinId);
    if (comp && pin) {
      compName = comp.name;
      titleName = pin.name;
      subType = `${pin.type} • ${pin.direction}`;
      dotColor = getPinColor(pin.type);

      // If pin wiring, show live validation message
      if (activeWiring && activeWiring.sourceComponentId !== hoveredPin.componentId) {
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
  } else if (hoveredConnector) {
    const comp = projectState.components.find((c) => c.id === hoveredConnector.componentId);
    const connector = comp?.connectors?.find((cn) => cn.id === hoveredConnector.connectorId);
    if (comp && connector) {
      compName = comp.name;
      const requiresUsbCable =
        connector.interfaceType === 'usb' && !connector.connectorType.includes('plug');

      titleName = requiresUsbCable
        ? `${connector.name} — requires USB cable`
        : connector.name;

      subType = `${connector.interfaceType.toUpperCase()}${connector.gender ? ` • ${connector.gender.toUpperCase()}` : ''}`;
      dotColor =
        connector.interfaceType === 'usb'
          ? '#38bdf8'
          : connector.interfaceType === 'dc-power'
          ? '#f59e0b'
          : '#a855f7';

      if (requiresUsbCable) {
        hintText = 'Drag a USB Cable from the library to connect this port to a host';
      }

      // If connector wiring is in progress, show live validation
      if (activeConnectorWiring && activeConnectorWiring.sourceComponentId !== hoveredConnector.componentId) {
        const sourceComp = projectState.components.find(
          (c) => c.id === activeConnectorWiring.sourceComponentId
        );
        const sourceConnector = sourceComp?.connectors?.find(
          (cn) => cn.id === activeConnectorWiring.sourceConnectorId
        );
        if (sourceConnector) {
          const res = validateConnectorConnection(
            sourceConnector,
            connector,
            sourceComp.id,
            comp.id,
            projectState.connections.map((c) => ({
              source: { componentId: c.source.componentId, interfaceId: c.source.interfaceId },
              target: { componentId: c.target.componentId, interfaceId: c.target.interfaceId },
            }))
          );
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
      {/* Active Pin Wiring Guidance Bar */}
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

      {/* Active Connector Wiring Guidance Bar */}
      {activeConnectorWiring && (
        <div className="px-3.5 py-1.5 rounded-full bg-white/95 border border-sky-200 shadow-lg text-xs flex items-center gap-2 backdrop-blur-md">
          <Cable size={13} className="text-sky-600 animate-pulse" />
          <span className="text-slate-800">
            Cable wiring active: <strong className="text-sky-600 font-mono">click compatible port</strong> to connect
          </span>
          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
            Esc to cancel
          </span>
        </div>
      )}

      {/* Hovered Pin / Connector Card */}
      {(hoveredPin || hoveredConnector) && compName && (
        <div className="px-3 py-2 rounded-lg bg-white/95 border border-slate-200 shadow-xl backdrop-blur-md flex flex-col gap-1 min-w-[210px] max-w-[340px]">
          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-slate-500 font-medium">{compName}</span>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: dotColor }}
              />
              <span className="text-slate-700 uppercase">{subType}</span>
            </div>
          </div>

          <div className="text-sm font-bold font-mono text-slate-900 flex items-center gap-1.5">
            <span>{titleName}</span>
          </div>

          {hintText && !validationMessage && (
            <div className="text-[10.5px] text-slate-500 font-normal mt-0.5">
              {hintText}
            </div>
          )}

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
              {validationMessage.severity === 'error' && <AlertTriangle size={12} className="shrink-0" />}
              {validationMessage.severity === 'warning' && <AlertTriangle size={12} className="shrink-0" />}
              {validationMessage.severity === 'info' && <CheckCircle size={12} className="shrink-0" />}
              <span>{validationMessage.text}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
