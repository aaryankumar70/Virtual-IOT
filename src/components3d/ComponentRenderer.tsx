import React from 'react';
import { VirtualComponent } from '../core/components/VirtualComponent';
import { ArduinoUnoMesh } from './ArduinoUno/ArduinoUnoMesh';
import { ESP32Mesh } from './ESP32/ESP32Mesh';
import { BreadboardMesh } from './Breadboard/BreadboardMesh';
import { LEDMesh } from './LED/LEDMesh';
import { ResistorMesh } from './Resistor/ResistorMesh';
import { PushButtonMesh } from './PushButton/PushButtonMesh';
import { BuzzerMesh } from './Buzzer/BuzzerMesh';
import {
  RaspberryPiMesh,
  LEDRGBMesh,
  UltrasonicSensorMesh,
  TemperatureSensorMesh,
  ServoMotorMesh,
} from './ExtraMeshes';

interface Props {
  component: VirtualComponent;
}

export const ComponentRenderer: React.FC<Props> = ({ component }) => {
  switch (component.type) {
    case 'arduino-uno':
      return <ArduinoUnoMesh component={component} />;
    case 'esp32':
      return <ESP32Mesh component={component} />;
    case 'raspberry-pi':
      return <RaspberryPiMesh component={component} />;
    case 'breadboard':
      return <BreadboardMesh component={component} />;
    case 'led':
      return <LEDMesh component={component} />;
    case 'led-rgb':
      return <LEDRGBMesh component={component} />;
    case 'resistor':
      return <ResistorMesh component={component} />;
    case 'push-button':
      return <PushButtonMesh component={component} />;
    case 'buzzer':
      return <BuzzerMesh component={component} />;
    case 'ultrasonic-sensor':
      return <UltrasonicSensorMesh component={component} />;
    case 'temperature-sensor':
      return <TemperatureSensorMesh component={component} />;
    case 'servo-motor':
      return <ServoMotorMesh component={component} />;
    default:
      return (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>
      );
  }
};
