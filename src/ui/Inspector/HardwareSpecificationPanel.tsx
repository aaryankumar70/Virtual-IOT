import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  Radio,
  FileText,
  Boxes,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Scale,
  Ruler,
  Plane,
} from 'lucide-react';
import { VirtualComponent } from '../../core/components/VirtualComponent';
import { HardwareSubcomponent } from '../../core/hardware/HardwareSpecification';
import { droneSimStore } from '../../core/drone/droneSimStore';

interface Props {
  component: VirtualComponent;
}

export const HardwareSpecificationPanel: React.FC<Props> = ({ component }) => {
  const [expandedSubcomps, setExpandedSubcomps] = useState<Record<string, boolean>>({});
  const spec = component.specification;
  const subcomponents = component.subcomponents || spec?.subcomponents || [];

  const toggleSubcomp = (id: string) => {
    setExpandedSubcomps((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategoryColor = (cat: HardwareSubcomponent['category']) => {
    switch (cat) {
      case 'ic':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'power':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'radio':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'motor':
      case 'esc':
      case 'propeller':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'sensor':
      case 'optical':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'connector':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Drone Direct Flight Simulator Launch Banner */}
      {component.type === 'drone-quad' && (
        <div className="bg-emerald-50 border border-emerald-300/80 rounded-lg p-3 flex items-center justify-between shadow-2xs">
          <div>
            <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
              <Plane size={14} className="text-emerald-600" />
              Flight Dynamics Environment
            </span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">
              Launch into full 6-DOF aerodynamic simulation with live telemetry & subcomponent testing.
            </span>
          </div>
          <button
            onClick={() => droneSimStore.enterDroneSim()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-md text-xs transition-colors shadow-xs shrink-0 ml-2"
          >
            Fly Platform →
          </button>
        </div>
      )}

      {/* 1. Hardware Identification Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Cpu size={13} className="text-blue-600" />
            Hardware Identity
          </span>
          {spec?.revision && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-100/80 text-blue-800 border border-blue-200">
              {spec.revision}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">Model / Part #</span>
            <span className="font-mono font-medium text-slate-800">
              {spec?.modelNumber || (component.metadata as any)?.partNumber || component.type}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Manufacturer</span>
            <span className="font-medium text-slate-800">
              {spec?.manufacturer || (component.metadata as any)?.manufacturer || 'Standard'}
            </span>
          </div>
        </div>

        {spec?.datasheetUrl && (
          <a
            href={spec.datasheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-white hover:bg-slate-100 border border-slate-200 text-blue-600 font-medium text-[11px] transition-colors"
          >
            <FileText size={12} />
            <span>Official Datasheet Reference</span>
            <ExternalLink size={10} className="text-slate-400" />
          </a>
        )}
      </div>

      {/* 2. Physical & Mechanical Dimensions */}
      {spec?.dimensions && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Ruler size={13} className="text-indigo-600" />
            Physical Dimensions
          </span>

          <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-[9px] text-slate-400 block font-sans">WIDTH</span>
              <span className="text-slate-800 font-bold text-[11px]">
                {spec.dimensions.widthMm.toFixed(1)} <span className="text-[9px] font-normal text-slate-500">mm</span>
              </span>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-[9px] text-slate-400 block font-sans">DEPTH</span>
              <span className="text-slate-800 font-bold text-[11px]">
                {spec.dimensions.depthMm.toFixed(1)} <span className="text-[9px] font-normal text-slate-500">mm</span>
              </span>
            </div>
            <div className="bg-white p-1.5 rounded border border-slate-200">
              <span className="text-[9px] text-slate-400 block font-sans">HEIGHT</span>
              <span className="text-slate-800 font-bold text-[11px]">
                {spec.dimensions.heightMm.toFixed(1)} <span className="text-[9px] font-normal text-slate-500">mm</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px]">
            <span className="text-slate-500 flex items-center gap-1">
              <Scale size={11} /> Mass:
            </span>
            <span className="font-mono text-slate-800 font-medium">
              {spec.dimensions.massGrams} grams
            </span>
          </div>

          {spec.dimensions.mountingHolePitchMm && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Mounting:</span>
              <span className="text-slate-700 text-right truncate max-w-[180px]">
                {spec.dimensions.mountingHolePitchMm}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. Electrical Ratings */}
      {spec?.electrical && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Zap size={13} className="text-amber-500" />
            Electrical Ratings
          </span>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[9px] text-slate-400 block">OPERATING VOLTAGE</span>
              <span className="font-mono font-bold text-amber-700">
                {spec.electrical.operatingVoltage}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Range: {spec.electrical.minVoltage}V - {spec.electrical.maxVoltage}V
              </span>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200">
              <span className="text-[9px] text-slate-400 block">LOGIC LEVEL</span>
              <span className="font-mono font-bold text-blue-700">
                {spec.electrical.logicLevel}
              </span>
              {spec.electrical.powerRatingWatts && (
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Max: {spec.electrical.powerRatingWatts}W
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-[11px]">
            <span className="text-slate-500">Peak Current Draw:</span>
            <span className="font-mono text-slate-800 font-semibold">
              {spec.electrical.maxCurrentDrawMa > 1000
                ? `${(spec.electrical.maxCurrentDrawMa / 1000).toFixed(1)} A`
                : `${spec.electrical.maxCurrentDrawMa} mA`}
            </span>
          </div>
        </div>
      )}

      {/* 4. Supported Protocols */}
      {spec?.protocols && spec.protocols.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Radio size={13} className="text-emerald-600" />
            Protocols & Signals
          </span>
          <div className="flex flex-wrap gap-1">
            {spec.protocols.map((proto) => (
              <span
                key={proto}
                className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
              >
                {proto}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. Hierarchical Hardware Subcomponents Tree */}
      {subcomponents.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Boxes size={13} className="text-purple-600" />
              Subcomponents ({subcomponents.length})
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Structural Tree</span>
          </div>

          <div className="flex flex-col gap-1.5">
            {subcomponents.map((sub) => {
              const isExpanded = Boolean(expandedSubcomps[sub.id]);

              return (
                <div
                  key={sub.id}
                  className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs"
                >
                  <button
                    onClick={() => toggleSubcomp(sub.id)}
                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {isExpanded ? (
                        <ChevronDown size={13} className="text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight size={13} className="text-slate-400 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-900 text-[11px] truncate">
                            {sub.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono border ${getCategoryColor(
                              sub.category
                            )}`}
                          >
                            {sub.category}
                          </span>
                        </div>
                        {sub.partNumber && (
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {sub.partNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <CheckCircle2 size={12} className="text-emerald-500" />
                      <span className="text-[10px] text-emerald-600 font-medium">Nominal</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-2.5 pt-1 border-t border-slate-100 bg-slate-50/60 text-[11px] space-y-1.5">
                      {sub.description && (
                        <p className="text-slate-600 leading-relaxed text-[11px]">
                          {sub.description}
                        </p>
                      )}

                      {sub.manufacturer && (
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Manufacturer:</span>
                          <span className="font-medium text-slate-700">{sub.manufacturer}</span>
                        </div>
                      )}

                      {sub.specifications && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 grid grid-cols-2 gap-1 text-[10px] font-mono">
                          {Object.entries(sub.specifications).map(([k, v]) => (
                            <div key={k} className="bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              <span className="text-slate-400 uppercase text-[9px] block">
                                {k}
                              </span>
                              <span className="text-slate-800">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Hardware Engineering Highlights */}
      {spec?.features && spec.features.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col gap-2">
          <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-blue-600" />
            Engineering Specifications
          </span>
          <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
            {spec.features.map((feat, i) => (
              <li key={i} className="leading-relaxed">
                {feat}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
