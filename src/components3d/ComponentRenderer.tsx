import React from 'react';
import { VirtualComponent } from '../core/components/VirtualComponent';
import { ArduinoUnoMesh } from './ArduinoUno/ArduinoUnoMesh';
import { ESP32Mesh } from './ESP32/ESP32Mesh';
import { BreadboardMesh } from './Breadboard/BreadboardMesh';
import { LEDMesh } from './LED/LEDMesh';
import { ResistorMesh } from './Resistor/ResistorMesh';
import { PushButtonMesh } from './PushButton/PushButtonMesh';
import { BuzzerMesh } from './Buzzer/BuzzerMesh';
import { RaspberryPiMesh } from './RaspberryPi/RaspberryPiMesh';
import { LEDRGBMesh } from './LEDRGB/LEDRGBMesh';
import { UltrasonicSensorMesh } from './UltrasonicSensor/UltrasonicSensorMesh';
import { TemperatureSensorMesh } from './TemperatureSensor/TemperatureSensorMesh';
import { ServoMotorMesh } from './ServoMotor/ServoMotorMesh';
import {
  ComputerHostMesh,
  DCPowerSupplyMesh,
  DHT11SensorMesh,
  USBCableMesh,
} from './PhysicalAccessories';
import { DroneMesh } from './Drone/DroneMesh';
import { LiPoBatteryMesh } from './LiPoBattery/LiPoBatteryMesh';
import { ArduinoNanoMesh } from './ArduinoNano/ArduinoNanoMesh';
import { PIRSensorMesh } from './PIRSensor/PIRSensorMesh';
import { MPU6050Mesh } from './MPU6050/MPU6050Mesh';
import { DCMotorMesh } from './DCMotor/DCMotorMesh';
import { RelayModuleMesh } from './RelayModule/RelayModuleMesh';

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
    case 'computer-host':
      return <ComputerHostMesh component={component} />;
    case 'dc-power-supply':
      return <DCPowerSupplyMesh component={component} />;
    case 'dht11-sensor':
      return <DHT11SensorMesh component={component} />;
    case 'usb-cable':
      return <USBCableMesh component={component} />;
    case 'drone-quadcopter':
      return <DroneMesh component={component} />;
    case 'lipo-battery':
      return <LiPoBatteryMesh component={component} />;
    case 'arduino-nano':
      return <ArduinoNanoMesh component={component} />;
    case 'pir-sensor':
      return <PIRSensorMesh component={component} />;
    case 'mpu6050-sensor':
      return <MPU6050Mesh component={component} />;
    case 'dc-motor':
      return <DCMotorMesh component={component} />;
    case 'relay-module':
      return <RelayModuleMesh component={component} />;
    default:
      return (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#4a5568" />
        </mesh>
      );
  }
};
