/**
 * Virtual IoT Lab — Engineering Laboratory Master Workbench
 *
 * Mounts the appropriate active workflow view:
 * Build | Connect | Configure | Simulate | Measure | Experiment
 */

import React from 'react';
import { useLabStore } from '../../core/labStore';
import { BuildBenchView } from './BuildBenchView';
import { ConnectionsView } from './ConnectionsView';
import { FirmwareConfigView } from './FirmwareConfigView';
import { SimulationView } from './SimulationView';
import { InstrumentBenchView } from './InstrumentBenchView';
import { ExperimentLabView } from './ExperimentLabView';

export const EngineeringLabWorkbench: React.FC = () => {
  const { currentMode } = useLabStore();

  return (
    <div className="flex-1 w-full h-[calc(100vh-3.5rem)] p-3 bg-zinc-950 overflow-hidden">
      {currentMode === 'build' && <BuildBenchView />}
      {currentMode === 'connect' && <ConnectionsView />}
      {currentMode === 'code' && <FirmwareConfigView />}
      {currentMode === 'simulate' && <SimulationView />}
      {currentMode === 'measure' && <InstrumentBenchView />}
      {currentMode === 'experiment' && <ExperimentLabView />}
    </div>
  );
};
