import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { VirtualComponent } from '../../core/components/VirtualComponent';

interface Props {
  component: VirtualComponent;
}

export const HardwareDebugOverlay: React.FC<Props> = ({ component }) => {
  // Compute world transform helper
  const matrix = useMemo(() => {
    const mat = new THREE.Matrix4();
    const pos = new THREE.Vector3(
      component.transform.position.x,
      component.transform.position.y,
      component.transform.position.z
    );
    const eul = new THREE.Euler(
      component.transform.rotation.x,
      component.transform.rotation.y,
      component.transform.rotation.z
    );
    const scl = new THREE.Vector3(
      component.transform.scale.x,
      component.transform.scale.y,
      component.transform.scale.z
    );
    mat.compose(pos, new THREE.Quaternion().setFromEuler(eul), scl);
    return mat;
  }, [component.transform]);

  const getWorldPos = (local: { x: number; y: number; z: number }) => {
    const v = new THREE.Vector3(local.x, local.y, local.z);
    v.applyMatrix4(matrix);
    return v;
  };

  return (
    <group>
      {/* Component Origin Axes Cross */}
      <primitive object={new THREE.AxesHelper(1.2)} />

      {/* Pin Overlay Beacons */}
      {component.pins.map((pin) => {
        const worldPos = getWorldPos(pin.localPosition);

        return (
          <group
            key={`debug-pin-${pin.id}`}
            position={[pin.localPosition.x, pin.localPosition.y, pin.localPosition.z]}
          >
            {/* Visual 3D Locator crosshair/sphere */}
            <mesh>
              <sphereGeometry args={[0.06, 12, 12]} />
              <meshBasicMaterial color="#06b6d4" />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.08, 0.11, 16]} />
              <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} />
            </mesh>

            {/* Engineering Monospace HUD Label */}
            <Html
              position={[0, 0.18, 0]}
              distanceFactor={18}
              center
              zIndexRange={[100, 0]}
              className="pointer-events-none select-none"
            >
              <div className="bg-slate-950/90 text-slate-100 border border-cyan-500/60 rounded px-2 py-1 shadow-xl backdrop-blur-sm text-[10px] whitespace-nowrap leading-tight">
                <div className="flex items-center gap-1.5 pb-0.5 border-b border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="font-mono font-bold text-cyan-300">{pin.id}</span>
                  <span className="text-slate-400 font-sans">({pin.name})</span>
                </div>
                <div className="font-mono text-[9px] text-slate-300 mt-0.5 space-y-0.5">
                  <div className="text-cyan-200/80">
                    type: <span className="text-white">{pin.type}</span> | dir:{' '}
                    <span className="text-white">{pin.direction}</span>
                  </div>
                  <div>
                    local: (
                    <span className="text-emerald-300">
                      {pin.localPosition.x.toFixed(2)},{' '}
                      {pin.localPosition.y.toFixed(2)},{' '}
                      {pin.localPosition.z.toFixed(2)}
                    </span>
                    )
                  </div>
                  <div>
                    world: (
                    <span className="text-amber-300">
                      {worldPos.x.toFixed(2)}, {worldPos.y.toFixed(2)},{' '}
                      {worldPos.z.toFixed(2)}
                    </span>
                    )
                  </div>
                </div>
              </div>
            </Html>
          </group>
        );
      })}

      {/* Connector Overlay Beacons */}
      {component.connectors?.map((conn) => {
        const worldPos = getWorldPos(conn.localPosition);
        const dir = conn.direction || { x: 0, y: 0, z: 1 };

        return (
          <group
            key={`debug-conn-${conn.id}`}
            position={[conn.localPosition.x, conn.localPosition.y, conn.localPosition.z]}
          >
            {/* Visual 3D Locator */}
            <mesh>
              <sphereGeometry args={[0.1, 14, 14]} />
              <meshBasicMaterial color="#f59e0b" />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.13, 0.17, 16]} />
              <meshBasicMaterial color="#f59e0b" side={THREE.DoubleSide} />
            </mesh>

            {/* Direction Pointer Cone */}
            <mesh
              position={[dir.x * 0.25, dir.y * 0.25, dir.z * 0.25]}
              rotation={[
                dir.z !== 0 ? (dir.z > 0 ? Math.PI / 2 : -Math.PI / 2) : 0,
                0,
                dir.x !== 0 ? (dir.x > 0 ? -Math.PI / 2 : Math.PI / 2) : 0,
              ]}
            >
              <coneGeometry args={[0.07, 0.18, 12]} />
              <meshBasicMaterial color="#fbbf24" />
            </mesh>

            {/* Engineering Monospace HUD Label */}
            <Html
              position={[0, 0.26, 0]}
              distanceFactor={18}
              center
              zIndexRange={[100, 0]}
              className="pointer-events-none select-none"
            >
              <div className="bg-slate-950/90 text-slate-100 border border-amber-500/60 rounded px-2 py-1 shadow-xl backdrop-blur-sm text-[10px] whitespace-nowrap leading-tight">
                <div className="flex items-center gap-1.5 pb-0.5 border-b border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="font-mono font-bold text-amber-300">{conn.id}</span>
                  <span className="text-slate-400 font-sans">({conn.name})</span>
                </div>
                <div className="font-mono text-[9px] text-slate-300 mt-0.5 space-y-0.5">
                  <div className="text-amber-200/80">
                    iface: <span className="text-white">{conn.interfaceType}</span> | gender:{' '}
                    <span className="text-white">{conn.gender}</span>
                  </div>
                  <div>
                    local: (
                    <span className="text-emerald-300">
                      {conn.localPosition.x.toFixed(2)},{' '}
                      {conn.localPosition.y.toFixed(2)},{' '}
                      {conn.localPosition.z.toFixed(2)}
                    </span>
                    )
                  </div>
                  <div>
                    world: (
                    <span className="text-amber-300">
                      {worldPos.x.toFixed(2)}, {worldPos.y.toFixed(2)},{' '}
                      {worldPos.z.toFixed(2)}
                    </span>
                    )
                  </div>
                  <div>
                    dir: ({dir.x}, {dir.y}, {dir.z})
                  </div>
                </div>
              </div>
            </Html>
          </group>
        );
      })}

      {/* Subcomponents Overlay Beacons */}
      {(component.subcomponents || component.specification?.subcomponents)?.map((sub) => {
        if (!sub.localPosition) return null;
        const worldPos = getWorldPos(sub.localPosition);

        return (
          <group
            key={`debug-sub-${sub.id}`}
            position={[sub.localPosition.x, sub.localPosition.y, sub.localPosition.z]}
          >
            {/* Visual 3D Locator Diamond / Box */}
            <mesh>
              <octahedronGeometry args={[0.07, 0]} />
              <meshBasicMaterial color="#a855f7" wireframe />
            </mesh>

            {/* Engineering Subcomponent HUD Label */}
            <Html
              position={[0, 0.2, 0]}
              distanceFactor={18}
              center
              zIndexRange={[100, 0]}
              className="pointer-events-none select-none"
            >
              <div className="bg-slate-950/90 text-slate-100 border border-purple-500/60 rounded px-2 py-1 shadow-xl backdrop-blur-sm text-[10px] whitespace-nowrap leading-tight">
                <div className="flex items-center gap-1.5 pb-0.5 border-b border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span className="font-mono font-bold text-purple-300">{sub.name}</span>
                  <span className="text-purple-400/80 font-mono text-[9px]">[{sub.category}]</span>
                </div>
                {sub.partNumber && (
                  <div className="font-mono text-[9px] text-slate-400 mt-0.5">
                    part: <span className="text-white">{sub.partNumber}</span>
                  </div>
                )}
                <div className="font-mono text-[9px] text-slate-400 mt-0.5">
                  local: (
                  <span className="text-purple-300">
                    {sub.localPosition.x.toFixed(2)}, {sub.localPosition.y.toFixed(2)},{' '}
                    {sub.localPosition.z.toFixed(2)}
                  </span>
                  )
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
};
