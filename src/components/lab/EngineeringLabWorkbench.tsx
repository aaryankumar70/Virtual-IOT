/**
 * Virtual IoT Lab — Engineering Laboratory Master Workbench
 *
 * Mounts the appropriate active workflow view:
 * BUILD | CONNECT | CODE | SIMULATE | MEASURE | FLY | EXPERIMENT
 */

import React from 'react';
import { useLabStore } from '../../core/labStore';
import { BuildBenchView } from './BuildBenchView';
import { ConnectionsView } from './ConnectionsView';
import { FirmwareLabView } from './FirmwareLabView';
import { HardwareSimWorkbenchView } from './HardwareSimWorkbenchView';
import { InstrumentBenchView } from './InstrumentBenchView';
import { FlightArenaView } from './FlightArenaView';
import { ExperimentLabView } from './ExperimentLabView';

export const EngineeringLabWorkbench: React.FC = () => {
  const { currentMode } = useLabStore();

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] p-3 bg-zinc-950 overflow-hidden">
      {currentMode === 'build' && <BuildBenchView />}
      {currentMode === 'connect' && <ConnectionsView />}
      {currentMode === 'code' && <FirmwareLabView />}
      {currentMode === 'simulate' && <HardwareSimWorkbenchView />}
      {currentMode === 'measure' && <InstrumentBenchView />}
      {currentMode === 'fly' && <FlightArenaView />}
      {currentMode === 'experiment' && <ExperimentLabView />}
    </div>
  );
};

