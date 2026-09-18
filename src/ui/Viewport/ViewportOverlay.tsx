import React from 'react';
import {
  Grid as GridIcon,
  Magnet,
  Ruler,
  Eye,
  Plus,
  Minus,
  Focus,
  Maximize,
  RotateCcw,
  Camera,
  AlertTriangle,
  AlertCircle,
  Cable,
  Zap,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useView, viewStore } from '../../state/view/viewStore';
import { useProject, projectStore } from '../../state/project/projectStore';
import { historyManager, Commands } from '../../editor/history/historyManager';

export const ViewportOverlay: React.FC = () => {
  const viewState = useView();
  const projectState = useProject();

  const connectorName = React.useMemo(() => {
    if (!viewState.activeConnectorWiring) return '';
    const srcComp = projectState.components.find(
      (c) => c.id === viewState.activeConnectorWiring?.sourceComponentId
    );
    const srcConn = srcComp?.connectors?.find(
      (cn) => cn.id === viewState.activeConnectorWiring?.sourceConnectorId
    );
    return srcConn?.name || 'connector';
  }, [viewState.activeConnectorWiring, projectState.components]);

  const selectedConnectionComponent = React.useMemo(() => {
    if (viewState.selectedComponentIds.length !== 1) return null;
    const comp = projectState.components.find(
      (c) => c.id === viewState.selectedComponentIds[0]
    );
    if (comp && (comp.type === 'usb-cable' || comp.type === 'dc-power-supply')) {
      return comp;
    }
    return null;
  }, [viewState.selectedComponentIds, projectState.components]);

  // Connection information for selected connection component
  const connectionDetails = React.useMemo(() => {
    if (!selectedConnectionComponent) return null;
    const comp = selectedConnectionComponent;

    if (comp.type === 'usb-cable') {
      const connA = projectState.connections.find(
        (c) =>
          (c.source.componentId === comp.id && c.source.interfaceId === 'plug_usb_a') ||
          (c.target.componentId === comp.id && c.target.interfaceId === 'plug_usb_a')
      );
      const targetEpA = connA?.source.componentId === comp.id ? connA.target : connA?.source;
      const targetCompA = projectState.components.find(
        (c) => c.id === targetEpA?.componentId
      );

      const connB = projectState.connections.find(
        (c) =>
          (c.source.componentId === comp.id && c.source.interfaceId === 'plug_usb_b') ||
          (c.target.componentId === comp.id && c.target.interfaceId === 'plug_usb_b')
      );
      const targetEpB = connB?.source.componentId === comp.id ? connB.target : connB?.source;
      const targetCompB = projectState.components.find(
        (c) => c.id === targetEpB?.componentId
      );

      // Check available target host and device in scene
      const hostCandidate = projectState.components.find((c) =>
        c.connectors?.some(
          (cn) =>
            cn.interfaceType === 'usb' &&
            cn.gender === 'female' &&
            cn.connectorType.includes('usb-a')
        )
      );
      const hostPort = hostCandidate?.connectors?.find(
        (cn) =>
          cn.interfaceType === 'usb' &&
          cn.gender === 'female' &&
          cn.connectorType.includes('usb-a')
      );

      const devCandidate = projectState.components.find((c) =>
        c.connectors?.some(
          (cn) =>
            cn.interfaceType === 'usb' &&
            cn.gender === 'female' &&
            cn.connectorType.includes('usb-b')
        )
      );
      const devPort = devCandidate?.connectors?.find(
        (cn) =>
          cn.interfaceType === 'usb' &&
          cn.gender === 'female' &&
          cn.connectorType.includes('usb-b')
      );

      return {
        type: 'usb-cable',
        connA,
        targetCompA,
        connB,
        targetCompB,
        canQuickConnect: (!connA && !!hostCandidate) || (!connB && !!devCandidate),
        hostCandidate,
        hostPort,
        devCandidate,
        devPort,
      };
    }

    if (comp.type === 'dc-power-supply') {
      const connDC = projectState.connections.find(
        (c) =>
          (c.source.componentId === comp.id && c.source.interfaceId === 'plug_dc_barrel') ||
          (c.target.componentId === comp.id && c.target.interfaceId === 'plug_dc_barrel')
      );
      const targetEp = connDC?.source.componentId === comp.id ? connDC.target : connDC?.source;
      const targetComp = projectState.components.find((c) => c.id === targetEp?.componentId);

      const mcuCandidate = projectState.components.find((c) =>
        c.connectors?.some((cn) => cn.interfaceType === 'dc-power' && cn.gender === 'female')
      );
      const mcuPort = mcuCandidate?.connectors?.find(
        (cn) => cn.interfaceType === 'dc-power' && cn.gender === 'female'
      );

      return {
        type: 'dc-power-supply',
        connDC,
        targetComp,
        canQuickConnect: !connDC && !!mcuCandidate,
        mcuCandidate,
        mcuPort,
      };
    }

    return null;
  }, [selectedConnectionComponent, projectState.connections, projectState.components]);

  const handleStartConnectPlug = (plugId: string) => {
    if (!selectedConnectionComponent) return;
    const worldPos = projectStore.getEndpointWorldPosition(
      selectedConnectionComponent.id,
      plugId
    );
    if (worldPos) {
      viewStore.startConnectorWiring(selectedConnectionComponent.id, plugId, worldPos);
    }
  };

  const handleQuickConnectUsb = () => {
    if (!selectedConnectionComponent || !connectionDetails) return;
    const comp = selectedConnectionComponent;
    const { connA, connB, hostCandidate, hostPort, devCandidate, devPort } = connectionDetails;

    if (!connA && hostCandidate && hostPort) {
      historyManager.execute(
        Commands.addConnection(
          {
            componentId: comp.id,
            interfaceId: 'plug_usb_a',
            type: 'connector',
            pinId: 'plug_usb_a',
          },
          {
            componentId: hostCandidate.id,
            interfaceId: hostPort.id,
            type: 'connector',
            pinId: hostPort.id,
          },
          'usb',
          '#38bdf8'
        )
      );
    }

    if (!connB && devCandidate && devPort) {
      historyManager.execute(
        Commands.addConnection(
          {
            componentId: comp.id,
            interfaceId: 'plug_usb_b',
            type: 'connector',
            pinId: 'plug_usb_b',
          },
          {
            componentId: devCandidate.id,
            interfaceId: devPort.id,
            type: 'connector',
            pinId: devPort.id,
          },
          'usb',
          '#38bdf8'
        )
      );
    }

    viewStore.setConnectionFeedback({
      message: `USB Cable connected successfully!`,
      severity: 'info',
    });
  };

  const handleQuickConnectDC = () => {
    if (!selectedConnectionComponent || !connectionDetails) return;
    const comp = selectedConnectionComponent;
    const { mcuCandidate, mcuPort } = connectionDetails;

    if (mcuCandidate && mcuPort) {
      historyManager.execute(
        Commands.addConnection(
          {
            componentId: comp.id,
            interfaceId: 'plug_dc_barrel',
            type: 'connector',
            pinId: 'plug_dc_barrel',
          },
          {
            componentId: mcuCandidate.id,
            interfaceId: mcuPort.id,
            type: 'connector',
            pinId: mcuPort.id,
          },
          'dc-power',
          '#f59e0b'
        )
      );
      viewStore.setConnectionFeedback({
        message: `9V DC Power connected to ${mcuCandidate.name}!`,
        severity: 'info',
      });
    }
  };

  const handleDisconnect = (conn: any) => {
    if (conn) {
      historyManager.execute(Commands.deleteConnection(conn));
    }
  };

  return (
    <>
      {/* Top Center Floating Workbench Controls Bar */}
      <div
        id="workbench-top-controls"
        className="absolute top-3 left-1/2 -translate-x-1/2 z-10 select-none pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-slate-200/90 shadow-xs px-3 py-1.5 rounded-lg text-xs text-slate-700"
      >
        {/* Camera Mode */}
        <button
          onClick={() =>
            viewStore.setCameraMode(
              viewState.cameraMode === 'perspective' ? 'orthographic' : 'perspective'
            )
          }
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 font-medium text-slate-800 transition-colors"
          title="Toggle Perspective / Orthographic view"
        >
          <Camera size={13} className="text-slate-500" />
          <span className="capitalize">{viewState.cameraMode}</span>
        </button>

        <div className="w-[1px] h-4 bg-slate-200" />

        {/* Grid Toggle */}
        <label
          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-slate-100 cursor-pointer font-medium text-slate-700 transition-colors"
          title="Toggle 3D Grid"
        >
          <input
            type="checkbox"
            checked={viewState.showGrid}
            onChange={() => viewStore.toggleGrid()}
            className="rounded border-slate-300 text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
          />
          <GridIcon size={13} className="text-slate-500" />
          <span>Grid</span>
        </label>

        {/* Snap to Grid Toggle */}
        <label
          className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-slate-100 cursor-pointer font-medium text-slate-700 transition-colors"
          title="Toggle Grid Snapping"
        >
          <input
            type="checkbox"
            checked={viewState.snapToGrid}
            onChange={() => viewStore.toggleSnap()}
            className="rounded border-slate-300 text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
          />
          <Magnet size={13} className="text-slate-500" />
          <span>Snap</span>
        </label>

        <div className="w-[1px] h-4 bg-slate-200" />

        {/* Measure Mode */}
        <button
          onClick={() => viewStore.toggleMeasure()}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${
            viewState.measureMode
              ? 'bg-blue-50 text-blue-600 font-semibold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
          title="Measurement Tool"
        >
          <Ruler size={13} className={viewState.measureMode ? 'text-blue-600' : 'text-slate-500'} />
          <span>Measure</span>
        </button>

        {/* View Options */}
        <button
          onClick={() => viewStore.triggerCamera('reset')}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 text-slate-700 transition-colors"
          title="Reset View"
        >
          <Eye size={13} className="text-slate-500" />
          <span>View</span>
        </button>
      </div>

      {/* Wire / Connector Mode Active Banner */}
      {(viewState.wireModeActive || viewState.activeWiring || viewState.activeConnectorWiring) && (
        <div
          id="wire-mode-banner"
          className="absolute top-13 left-1/2 -translate-x-1/2 z-10 select-none pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-blue-200/90 shadow-xs px-3.5 py-1.5 rounded-full text-xs text-slate-800"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
          <span className="font-medium text-[11.5px]">
            {viewState.activeConnectorWiring
              ? `Connecting ${connectorName} — click a compatible port to finish (Esc to cancel)`
              : viewState.activeWiring
              ? 'Wiring in progress — click target pin, or Esc to cancel'
              : 'Wire Mode — click a pin to start connection (Esc to exit)'}
          </span>
          <button
            onClick={() => {
              if (viewState.activeConnectorWiring) {
                viewStore.cancelConnectorWiring();
              } else {
                viewStore.cancelWiring();
              }
            }}
            className="ml-1 text-slate-400 hover:text-slate-700 text-[11px] px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            title="Exit Connection Mode (Esc)"
          >
            Esc
          </button>
        </div>
      )}

      {/* Real-time Connection Feedback Toast */}
      {viewState.connectionFeedback && (
        <div
          id="connection-feedback-toast"
          role="alert"
          className={`absolute ${
            viewState.wireModeActive || viewState.activeWiring || viewState.activeConnectorWiring || viewState.isFreeMoving
              ? 'top-22'
              : 'top-13'
          } left-1/2 -translate-x-1/2 z-20 select-none pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-sm shadow-xs px-3.5 py-1.5 rounded-full text-xs transition-all animate-in fade-in duration-150 ${
            viewState.connectionFeedback.severity === 'warning'
              ? 'border border-amber-300 text-amber-900 bg-amber-50/95'
              : viewState.connectionFeedback.severity === 'info'
              ? 'border border-sky-300 text-sky-900 bg-sky-50/95'
              : 'border border-red-300 text-red-900 bg-red-50/95'
          }`}
        >
          {viewState.connectionFeedback.severity === 'warning' ? (
            <AlertTriangle size={13} className="text-amber-600 shrink-0" />
          ) : viewState.connectionFeedback.severity === 'info' ? (
            <CheckCircle2 size={13} className="text-sky-600 shrink-0" />
          ) : (
            <AlertCircle size={13} className="text-red-600 shrink-0" />
          )}
          <span className="font-medium text-[11.5px] max-w-lg text-center">
            {viewState.connectionFeedback.message}
          </span>
        </div>
      )}

      {/* Free Move Mode Active Banner */}
      {viewState.isFreeMoving && (
        <div
          id="free-move-banner"
          className="absolute top-13 left-1/2 -translate-x-1/2 z-10 select-none pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-emerald-300 shadow-xs px-3.5 py-1.5 rounded-full text-xs text-slate-800"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
          <span className="font-medium text-[11.5px] text-emerald-900">
            Shift + Move: Free Moving Object (Release Shift or Click to Place, Esc to Cancel)
          </span>
        </div>
      )}

      {/* Connection Component Guidance & Action Card */}
      {selectedConnectionComponent && connectionDetails && !viewState.activeConnectorWiring && (
        <div
          id="connection-component-guide-card"
          className="absolute top-14 left-4 z-20 select-none pointer-events-auto w-84 bg-white/95 backdrop-blur-md border border-sky-200/90 shadow-lg rounded-xl p-3.5 flex flex-col gap-3 transition-all animate-in fade-in slide-in-from-left-2 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Cable size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-800">
                  {selectedConnectionComponent.name}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {connectionDetails.type === 'usb-cable'
                    ? 'Molded A-to-B Physical Cable'
                    : 'External 9V DC Power Adapter'}
                </p>
              </div>
            </div>
            <button
              onClick={() => viewStore.clearSelection()}
              className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
              title="Deselect"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body: USB Cable End Plugs */}
          {connectionDetails.type === 'usb-cable' && (
            <div className="flex flex-col gap-2">
              {/* USB-A End (PC Host) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-700">
                      USB-A Plug (Host)
                    </span>
                    {connectionDetails.connA ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full font-medium">
                        <CheckCircle2 size={10} />
                        Connected
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded-full">
                        Unplugged
                      </span>
                    )}
                  </div>
                  <span className="text-[10.5px] text-slate-500 truncate max-w-[160px]">
                    {connectionDetails.connA
                      ? `To: ${connectionDetails.targetCompA?.name || 'PC Host'}`
                      : 'Connect to Workstation PC'}
                  </span>
                </div>

                {connectionDetails.connA ? (
                  <button
                    onClick={() => handleDisconnect(connectionDetails.connA)}
                    className="text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded font-medium transition-colors cursor-pointer"
                  >
                    Unplug
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartConnectPlug('plug_usb_a')}
                    className="text-[11px] bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 rounded font-medium shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Connect
                    <ArrowRight size={11} />
                  </button>
                )}
              </div>

              {/* USB-B End (Device / Arduino Uno) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-700">
                      USB-B Plug (Device)
                    </span>
                    {connectionDetails.connB ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full font-medium">
                        <CheckCircle2 size={10} />
                        Connected
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded-full">
                        Unplugged
                      </span>
                    )}
                  </div>
                  <span className="text-[10.5px] text-slate-500 truncate max-w-[160px]">
                    {connectionDetails.connB
                      ? `To: ${connectionDetails.targetCompB?.name || 'Arduino Uno'}`
                      : 'Connect to Arduino Uno USB-B Port'}
                  </span>
                </div>

                {connectionDetails.connB ? (
                  <button
                    onClick={() => handleDisconnect(connectionDetails.connB)}
                    className="text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded font-medium transition-colors cursor-pointer"
                  >
                    Unplug
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartConnectPlug('plug_usb_b')}
                    className="text-[11px] bg-sky-600 hover:bg-sky-700 text-white px-2.5 py-1 rounded font-medium shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Connect
                    <ArrowRight size={11} />
                  </button>
                )}
              </div>

              {/* Quick Auto-Connect Shortcut */}
              {connectionDetails.canQuickConnect && (
                <button
                  onClick={handleQuickConnectUsb}
                  className="w-full mt-1 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-[11.5px] font-medium py-1.5 px-3 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap size={13} className="text-sky-200 fill-sky-200" />
                  Auto-Connect PC ↔ Arduino Uno
                </button>
              )}
            </div>
          )}

          {/* Body: DC Power Supply */}
          {connectionDetails.type === 'dc-power-supply' && (
            <div className="flex flex-col gap-2">
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-slate-700">
                      2.1mm DC Barrel Plug
                    </span>
                    {connectionDetails.connDC ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full font-medium">
                        <CheckCircle2 size={10} />
                        Connected
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded-full">
                        Unplugged
                      </span>
                    )}
                  </div>
                  <span className="text-[10.5px] text-slate-500 truncate max-w-[160px]">
                    {connectionDetails.connDC
                      ? `To: ${connectionDetails.targetComp?.name || 'Arduino Uno'}`
                      : 'Connect to 2.1mm DC Barrel Jack'}
                  </span>
                </div>

                {connectionDetails.connDC ? (
                  <button
                    onClick={() => handleDisconnect(connectionDetails.connDC)}
                    className="text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded font-medium transition-colors cursor-pointer"
                  >
                    Unplug
                  </button>
                ) : (
                  <button
                    onClick={() => handleStartConnectPlug('plug_dc_barrel')}
                    className="text-[11px] bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded font-medium shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    Connect
                    <ArrowRight size={11} />
                  </button>
                )}
              </div>

              {connectionDetails.canQuickConnect && (
                <button
                  onClick={handleQuickConnectDC}
                  className="w-full mt-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-[11.5px] font-medium py-1.5 px-3 rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Zap size={13} className="text-amber-200 fill-amber-200" />
                  Connect to Arduino Uno DC Jack
                </button>
              )}
            </div>
          )}

          {/* Footer Tip */}
          <div className="pt-1.5 border-t border-slate-100 text-[10.5px] text-slate-500 flex items-center gap-1">
            <span className="text-sky-600 font-semibold">Tip:</span>
            <span>You can also click directly on the 3D plugs in the scene to connect.</span>
          </div>
        </div>
      )}

      {/* Bottom Left Status Pill */}
      <div className="absolute bottom-3 left-3 z-10 select-none pointer-events-none flex items-center gap-2 bg-white/90 backdrop-blur-xs border border-slate-200 shadow-2xs px-2.5 py-1 rounded-md text-[11px] text-slate-500 font-mono">
        <span>Grid: 1.0mm</span>
        <span>·</span>
        <span>Snap: {viewState.snapToGrid ? 'On' : 'Off'}</span>
        {viewState.isFreeMoving && (
          <>
            <span>·</span>
            <span className="text-emerald-600 font-semibold">Free Move</span>
          </>
        )}
        {viewState.wireModeActive && (
          <>
            <span>·</span>
            <span className="text-blue-600 font-medium">Wire Mode</span>
          </>
        )}
        {viewState.activeConnectorWiring && (
          <>
            <span>·</span>
            <span className="text-sky-600 font-medium">Connector Active</span>
          </>
        )}
        {viewState.measureMode && (
          <>
            <span>·</span>
            <span className="text-blue-600 font-medium">Measure Active</span>
          </>
        )}
      </div>

      {/* Bottom Right Floating Quick Camera Navigation */}
      <div className="absolute bottom-3 right-3 z-10 select-none pointer-events-auto flex flex-col gap-1 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xs p-1 rounded-lg">
        <button
          onClick={() => viewStore.triggerCamera('frameAll')}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          title="Frame All (A)"
        >
          <Maximize size={15} />
        </button>
        <button
          onClick={() => viewStore.triggerCamera('focusSelected')}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          title="Focus Selected (F)"
        >
          <Focus size={15} />
        </button>
        <button
          onClick={() => viewStore.triggerCamera('reset')}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
          title="Reset Camera View"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </>
  );
};
