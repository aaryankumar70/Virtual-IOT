/**
 * Virtual IoT Lab — Build Workbench View
 *
 * Physical machine hierarchy, mounting sockets, component inspection,
 * dynamic mass/inertia calculations, and component swaps.
 */

import React, { useState } from 'react';
import { useLabStore, labStore } from '../../core/labStore';
import { assemblyGraph } from '../../core/assemblyEngine/AssemblyGraph';
import { HARDWARE_DATABASE } from '../../core/hardwareEngine/hardwareDatabase';
import { HardwareEntity } from '../../core/hardwareEngine/HardwareEntity';
import {
  Wrench,
  Layers,
  Info,
  Scale,
  RotateCw,
  Cpu,
  Battery,
  Disc,
  Video,
  Radio,
  Navigation,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
} from 'lucide-react';

export const BuildBenchView: React.FC = () => {
  const { selectedEntityId, explodedOffset } = useLabStore();
  const [, setTick] = useState(0);

  // Re-render when assembly changes
  React.useEffect(() => {
    return assemblyGraph.subscribe(() => setTick((t) => t + 1));
  }, []);

  const aggregateProps = assemblyGraph.computeAggregatePhysicalProperties();
  const selectedEntity = labStore.getSelectedEntity();

  const handleToggleMount = (entityId: string) => {
    if (assemblyGraph.isMounted(entityId)) {
      assemblyGraph.unmountEntity(entityId);
    } else {
      // Find where it mounts by default
      const defaultEntity = HARDWARE_DATABASE[entityId];
      if (defaultEntity && defaultEntity.physical.mountingInterfaces.length > 0) {
        // Auto-mount to appropriate socket
        if (entityId.includes('motor')) {
          const idx = entityId.slice(-1);
          assemblyGraph.mountEntity(entityId, `mount_motor_${idx}`, 'part_frame_geprc_mark4');
        } else if (entityId.includes('prop')) {
          const idx = entityId.slice(-1);
          assemblyGraph.mountEntity(entityId, `mount_prop_shaft_${idx}`, `part_motor_emax_2207_1950kv_${idx}`);
        } else if (entityId.includes('esc')) {
          assemblyGraph.mountEntity(entityId, 'mount_esc_stack', 'part_frame_geprc_mark4');
        } else if (entityId.includes('fc')) {
          assemblyGraph.mountEntity(entityId, 'mount_fc_stack', 'part_frame_geprc_mark4');
        } else if (entityId.includes('battery')) {
          assemblyGraph.mountEntity(entityId, 'mount_battery_pad', 'part_frame_geprc_mark4');
        } else if (entityId.includes('camera')) {
          assemblyGraph.mountEntity(entityId, 'mount_fpv_camera', 'part_frame_geprc_mark4');
        } else if (entityId.includes('rx')) {
          assemblyGraph.mountEntity(entityId, 'mount_rx_tray', 'part_frame_geprc_mark4');
        } else if (entityId.includes('gps')) {
          assemblyGraph.mountEntity(entityId, 'mount_gps_mast', 'part_frame_geprc_mark4');
        }
      }
    }
  };

  const allDbEntities = Object.values(HARDWARE_DATABASE);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
      {/* Left Column: Physical Assembly Tree & Mounting Hierarchy */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-semibold text-zinc-100">Physical Assembly Tree</h2>
          </div>
          <button
            onClick={() => assemblyGraph.resetToDefaultDrone()}
            className="text-xs px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Reset Factory
          </button>
        </div>

        {/* Exploded View Slider */}
        <div className="my-3 px-3 py-2 bg-zinc-950/80 rounded-lg border border-zinc-800/80">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Exploded Inspection Layer
            </span>
            <span className="font-mono text-zinc-200">{(explodedOffset * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1.5"
            step="0.05"
            value={explodedOffset}
            onChange={(e) => labStore.setExplodedOffset(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Components List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {allDbEntities.map((ent) => {
            const isMounted = assemblyGraph.isMounted(ent.id);
            const isSel = selectedEntityId === ent.id;

            return (
              <div
                key={ent.id}
                onClick={() => labStore.selectEntity(ent.id)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  isSel
                    ? 'bg-sky-950/40 border-sky-500/60 shadow-sm shadow-sky-500/10'
                    : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 p-1.5 rounded bg-zinc-800 text-zinc-300">
                      {ent.identity.category === 'airframe' && <Layers className="w-4 h-4 text-emerald-400" />}
                      {ent.identity.category === 'motor-brushless' && <Disc className="w-4 h-4 text-sky-400" />}
                      {ent.identity.category === 'propeller' && <RotateCw className="w-4 h-4 text-cyan-400" />}
                      {ent.identity.category === 'esc' && <Cpu className="w-4 h-4 text-purple-400" />}
                      {ent.identity.category === 'flight-controller' && <Sliders className="w-4 h-4 text-blue-400" />}
                      {ent.identity.category === 'battery-pack' && <Battery className="w-4 h-4 text-amber-400" />}
                      {ent.identity.category === 'fpv-camera' && <Video className="w-4 h-4 text-red-400" />}
                      {ent.identity.category === 'radio-receiver' && <Radio className="w-4 h-4 text-green-400" />}
                      {ent.identity.category === 'gps-module' && <Navigation className="w-4 h-4 text-orange-400" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-100">{ent.identity.model}</div>
                      <div className="text-xs text-zinc-400">{ent.identity.manufacturer}</div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-1">
                        Mass: {(ent.physical.massKg * 1000).toFixed(0)}g • Interfaces: {ent.physical.mountingInterfaces.length}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                        isMounted
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {isMounted ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Mounted
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-zinc-400" />
                          Detached
                        </>
                      )}
                    </span>

                    {ent.id !== 'part_frame_geprc_mark4' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleMount(ent.id);
                        }}
                        className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                          isMounted
                            ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60'
                            : 'bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-800/60'
                        }`}
                      >
                        {isMounted ? 'Unmount' : 'Mount to Frame'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center Column: Component Engineering Datasheet Inspector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <Info className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-zinc-100">Component Engineering Specification</h2>
        </div>

        {selectedEntity ? (
          <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 custom-scrollbar">
            {/* Header Badge */}
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
                  {selectedEntity.identity.category}
                </span>
                <span className="text-xs font-mono text-zinc-400">ID: {selectedEntity.id}</span>
              </div>
              <h3 className="text-lg font-bold text-zinc-100 mt-1">{selectedEntity.identity.model}</h3>
              <p className="text-xs text-zinc-400">{selectedEntity.identity.manufacturer}</p>
            </div>

            {/* Physical Specs */}
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                Physical & Structural Characteristics
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800/80">
                  <div className="text-zinc-400">Total Mass</div>
                  <div className="font-mono text-zinc-200 text-sm font-medium mt-0.5">
                    {(selectedEntity.physical.massKg * 1000).toFixed(1)} g
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800/80">
                  <div className="text-zinc-400">Total Mass</div>
                  <div className="font-mono text-zinc-200 text-sm font-medium mt-0.5">
                    {(selectedEntity.physical.massKg * 1000).toFixed(1)} g
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800/80">
                  <div className="text-zinc-400">Mount Sockets</div>
                  <div className="font-mono text-zinc-200 text-sm font-medium mt-0.5">
                    {selectedEntity.physical.mountingInterfaces.length} interfaces
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800/80 col-span-2">
                  <div className="text-zinc-400">Dimensions (X × Y × Z)</div>
                  <div className="font-mono text-zinc-200 text-xs font-medium mt-0.5">
                    {selectedEntity.physical.dimensionsMm.width} × {selectedEntity.physical.dimensionsMm.height} ×{' '}
                    {selectedEntity.physical.dimensionsMm.depth} mm
                  </div>
                </div>
                <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800/80 col-span-2">
                  <div className="text-zinc-400">Moment of Inertia (Ixx, Iyy, Izz)</div>
                  <div className="font-mono text-zinc-300 text-[11px] mt-0.5">
                    {selectedEntity.physical.momentOfInertiaKgM2.Ixx.toExponential(2)},{' '}
                    {selectedEntity.physical.momentOfInertiaKgM2.Iyy.toExponential(2)},{' '}
                    {selectedEntity.physical.momentOfInertiaKgM2.Izz.toExponential(2)} kg·m²
                  </div>
                </div>
              </div>
            </div>

            {/* Electrical Ratings */}
            {selectedEntity.electrical && (
              <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Battery className="w-3.5 h-3.5 text-amber-400" />
                  Electrical Specifications
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800/80">
                    <div className="text-zinc-400">Operating Voltage</div>
                    <div className="font-mono text-zinc-200 text-sm font-medium mt-0.5">
                      {selectedEntity.electrical.voltageRange.minV}V - {selectedEntity.electrical.voltageRange.maxV}V
                    </div>
                  </div>
                  <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800/80">
                    <div className="text-zinc-400">Continuous Current Limit</div>
                    <div className="font-mono text-zinc-200 text-sm font-medium mt-0.5">
                      {selectedEntity.electrical.maxCurrentA} A
                    </div>
                  </div>
                  <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800/80">
                    <div className="text-zinc-400">Quiescent Current</div>
                    <div className="font-mono text-amber-300 text-sm font-medium mt-0.5">
                      {(selectedEntity.electrical.quiescentCurrentA * 1000).toFixed(0)} mA
                    </div>
                  </div>
                  <div className="bg-zinc-900/80 p-2 rounded border border-zinc-800/80">
                    <div className="text-zinc-400">Internal Resistance</div>
                    <div className="font-mono text-zinc-200 text-sm font-medium mt-0.5">
                      {selectedEntity.electrical.internalResistanceOhm
                        ? `${(selectedEntity.electrical.internalResistanceOhm * 1000).toFixed(1)} mΩ`
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mounting Interfaces */}
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Mounting Interfaces & Sockets
              </h4>
              <div className="space-y-1.5">
                {selectedEntity.physical.mountingInterfaces.map((m) => (
                  <div
                    key={m.id}
                    className="p-2 rounded bg-zinc-900 border border-zinc-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-zinc-200">{m.name}</div>
                      <div className="text-[11px] text-zinc-400">Standard: {m.standard}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded">
                      Pos: ({m.localPosition.x.toFixed(2)}, {m.localPosition.y.toFixed(2)},{' '}
                      {m.localPosition.z.toFixed(2)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 text-sm p-4 text-center">
            <Eye className="w-8 h-8 text-zinc-400 mb-2" />
            Select an entity from the assembly tree to inspect its real hardware parameters.
          </div>
        )}
      </div>

      {/* Right Column: Live Calculated Aggregations (Mass, COM, Inertia) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
          <Scale className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-zinc-100">Live Dynamic Aggregation</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 custom-scrollbar">
          {/* AUW Card */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-medium">All-Up Weight (AUW)</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-300 rounded border border-emerald-800/60 font-mono">
                {aggregateProps.mountedEntityCount} entities mounted
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold font-mono text-zinc-100">
                {(aggregateProps.totalMassKg * 1000).toFixed(0)}
              </span>
              <span className="text-sm font-medium text-zinc-400">grams ({aggregateProps.totalMassKg.toFixed(3)} kg)</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Re-calculated automatically when parts are attached or removed.
            </div>
          </div>

          {/* Center of Mass Shift */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="text-xs text-zinc-400 font-medium mb-1.5">Dynamic Center of Mass Offset (COM)</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-900 p-2 rounded border border-zinc-800 text-center">
                <div className="text-[11px] text-zinc-400">X (Lateral)</div>
                <div className="font-mono text-xs font-semibold text-zinc-200 mt-0.5">
                  {(aggregateProps.centerOfMass.x * 1000).toFixed(1)} mm
                </div>
              </div>
              <div className="bg-zinc-900 p-2 rounded border border-zinc-800 text-center">
                <div className="text-[11px] text-zinc-400">Y (Vertical)</div>
                <div className="font-mono text-xs font-semibold text-zinc-200 mt-0.5">
                  {(aggregateProps.centerOfMass.y * 1000).toFixed(1)} mm
                </div>
              </div>
              <div className="bg-zinc-900 p-2 rounded border border-zinc-800 text-center">
                <div className="text-[11px] text-zinc-400">Z (Longitudinal)</div>
                <div className="font-mono text-xs font-semibold text-zinc-200 mt-0.5">
                  {(aggregateProps.centerOfMass.z * 1000).toFixed(1)} mm
                </div>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Note: Asymmetrical battery or camera placement shifts COM away from the geometric center, affecting PID
              trim and motor torque allocation.
            </p>
          </div>

          {/* Moment of Inertia Tensor (Parallel Axis Theorem) */}
          <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800">
            <div className="text-xs text-zinc-400 font-medium mb-1.5">
              Moment of Inertia Tensor (Parallel Axis Theorem)
            </div>
            <div className="space-y-1.5 font-mono text-xs">
              <div className="p-2 bg-zinc-900 rounded border border-zinc-800 flex justify-between">
                <span className="text-zinc-400">I_xx (Roll Inertia):</span>
                <span className="text-indigo-300 font-semibold">
                  {aggregateProps.momentOfInertia.Ixx.toExponential(3)} kg·m²
                </span>
              </div>
              <div className="p-2 bg-zinc-900 rounded border border-zinc-800 flex justify-between">
                <span className="text-zinc-400">I_yy (Yaw Inertia):</span>
                <span className="text-sky-300 font-semibold">
                  {aggregateProps.momentOfInertia.Iyy.toExponential(3)} kg·m²
                </span>
              </div>
              <div className="p-2 bg-zinc-900 rounded border border-zinc-800 flex justify-between">
                <span className="text-zinc-400">I_zz (Pitch Inertia):</span>
                <span className="text-teal-300 font-semibold">
                  {aggregateProps.momentOfInertia.Izz.toExponential(3)} kg·m²
                </span>
              </div>
            </div>
            <div className="text-[11px] text-zinc-400 mt-2">
              Integrated in 6-DOF simulation: higher rotational inertia reduces roll/pitch responsiveness for given motor
              torques.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
