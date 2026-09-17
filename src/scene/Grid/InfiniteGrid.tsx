import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useView } from '../../state/view/viewStore';

export const InfiniteGrid: React.FC = () => {
  const viewState = useView();

  // Custom shader plane for engineering grid with radial falloff
  const isLight = viewState.theme === 'light';

  const gridMaterial = useMemo(() => {
    const majorColor = isLight ? new THREE.Color('#cbd5e1') : new THREE.Color('#1e2530');
    const minorColor = isLight ? new THREE.Color('#e2e8f0') : new THREE.Color('#151a22');
    const originColor = isLight ? new THREE.Color('#94a3b8') : new THREE.Color('#3b4252');

    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMajorColor: { value: majorColor },
        uMinorColor: { value: minorColor },
        uOriginColor: { value: originColor },
        uMinorSpacing: { value: 1.0 },
        uMajorSpacing: { value: 5.0 },
        uFadeStart: { value: 35.0 },
        uFadeEnd: { value: 65.0 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform vec3 uMajorColor;
        uniform vec3 uMinorColor;
        uniform vec3 uOriginColor;
        uniform float uMinorSpacing;
        uniform float uMajorSpacing;
        uniform float uFadeStart;
        uniform float uFadeEnd;

        varying vec3 vWorldPosition;

        void main() {
          vec2 coord = vWorldPosition.xz;
          vec2 gridMinor = abs(fract(coord / uMinorSpacing - 0.5) - 0.5) / fwidth(coord / uMinorSpacing);
          float lineMinor = min(gridMinor.x, gridMinor.y);
          float minorAlpha = 1.0 - min(lineMinor, 1.0);

          vec2 gridMajor = abs(fract(coord / uMajorSpacing - 0.5) - 0.5) / fwidth(coord / uMajorSpacing);
          float lineMajor = min(gridMajor.x, gridMajor.y);
          float majorAlpha = 1.0 - min(lineMajor, 1.0);

          // Origin axes highlighting
          vec2 originDist = abs(coord) / fwidth(coord);
          float axisLine = min(originDist.x, originDist.y);
          float axisAlpha = 1.0 - min(axisLine, 1.0);

          // Radial falloff from origin
          float dist = length(coord);
          float falloff = 1.0 - smoothstep(uFadeStart, uFadeEnd, dist);

          vec3 color = uMinorColor;
          float alpha = minorAlpha * 0.55;

          if (majorAlpha > 0.0) {
            color = mix(color, uMajorColor, majorAlpha);
            alpha = max(alpha, majorAlpha * 0.85);
          }

          if (axisAlpha > 0.0) {
            color = mix(color, uOriginColor, axisAlpha);
            alpha = max(alpha, axisAlpha * 0.95);
          }

          alpha *= falloff;

          if (alpha < 0.01) discard;

          gl_FragColor = vec4(color, alpha);
        }
      `,
    });
  }, [isLight]);

  if (!viewState.showGrid) return null;

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.001, 0]}
      material={gridMaterial}
    >
      <planeGeometry args={[200, 200]} />
    </mesh>
  );
};
