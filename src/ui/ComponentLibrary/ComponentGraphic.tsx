import React from 'react';

interface Props {
  type: string;
  className?: string;
}

export const ComponentGraphic: React.FC<Props> = ({ type, className = 'w-full h-full' }) => {
  switch (type) {
    case 'arduino-uno':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* PCB */}
          <rect x="20" y="15" width="120" height="90" rx="6" fill="#008184" stroke="#005d5f" strokeWidth="2" />
          <path d="M20 25 L35 25 L35 15" stroke="#005d5f" strokeWidth="1.5" />
          {/* USB Port */}
          <rect x="12" y="24" width="22" height="24" rx="2" fill="#c0c7d1" stroke="#8993a4" strokeWidth="1.5" />
          <rect x="14" y="28" width="8" height="16" fill="#717d91" />
          {/* DC Barrel Jack */}
          <rect x="14" y="72" width="24" height="26" rx="2" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
          <circle cx="26" cy="85" r="4" fill="#64748b" />
          {/* ATmega328P Chip */}
          <rect x="68" y="55" width="48" height="20" rx="2" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="72" y1="53" x2="72" y2="55" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="78" y1="53" x2="78" y2="55" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="84" y1="53" x2="84" y2="55" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="90" y1="53" x2="90" y2="55" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="96" y1="53" x2="96" y2="55" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="102" y1="53" x2="102" y2="55" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="108" y1="53" x2="108" y2="55" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="72" y1="75" x2="72" y2="77" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="78" y1="75" x2="78" y2="77" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="84" y1="75" x2="84" y2="77" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="90" y1="75" x2="90" y2="77" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="96" y1="75" x2="96" y2="77" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="102" y1="75" x2="102" y2="77" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="108" y1="75" x2="108" y2="77" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Crystal */}
          <rect x="48" y="44" width="14" height="8" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
          {/* Headers Top */}
          <rect x="52" y="16" width="76" height="8" rx="1" fill="#0f172a" />
          {/* Headers Bottom */}
          <rect x="52" y="96" width="76" height="8" rx="1" fill="#0f172a" />
          {/* Silk lines & Arduino text */}
          <text x="86" y="38" fill="#ffffff" opacity="0.9" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">ARDUINO</text>
          <text x="86" y="47" fill="#ffffff" opacity="0.75" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">UNO</text>
        </svg>
      );

    case 'esp32':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Black PCB */}
          <rect x="42" y="12" width="76" height="96" rx="4" fill="#1e2430" stroke="#0f172a" strokeWidth="2" />
          {/* Gold PCB Antenna */}
          <path d="M52 14 H108 V28 H102 V20 H94 V28 H88 V20 H80 V28 H74 V20 H66 V28 H60 V20 H52 Z" fill="#d97706" />
          {/* Metal RF Shield */}
          <rect x="50" y="36" width="60" height="42" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="80" y="56" fill="#334155" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">ESP-WROOM-32</text>
          <text x="80" y="66" fill="#64748b" fontSize="6" fontFamily="sans-serif" textAnchor="middle">CE 0700</text>
          {/* Micro USB */}
          <rect x="70" y="100" width="20" height="12" rx="1.5" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />
          {/* Pin Headers Left & Right */}
          <rect x="36" y="24" width="5" height="72" rx="1" fill="#0f172a" />
          <rect x="119" y="24" width="5" height="72" rx="1" fill="#0f172a" />
          {/* Buttons */}
          <rect x="48" y="90" width="8" height="8" rx="1" fill="#94a3b8" />
          <rect x="104" y="90" width="8" height="8" rx="1" fill="#94a3b8" />
        </svg>
      );

    case 'raspberry-pi':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Green PCB */}
          <rect x="22" y="14" width="116" height="92" rx="6" fill="#15803d" stroke="#166534" strokeWidth="2" />
          {/* 40 Pin GPIO Header */}
          <rect x="28" y="18" width="70" height="10" rx="1" fill="#0f172a" />
          {/* Broadcom SoC CPU with heat sink */}
          <rect x="62" y="44" width="26" height="26" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
          <text x="75" y="59" fill="#1e293b" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">BROADCOM</text>
          {/* USB Ports on Right */}
          <rect x="116" y="24" width="26" height="22" rx="2" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />
          <rect x="116" y="52" width="26" height="22" rx="2" fill="#3b82f6" stroke="#2563eb" strokeWidth="1.5" />
          {/* Ethernet Port */}
          <rect x="116" y="80" width="26" height="20" rx="2" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />
          {/* Micro HDMI Ports Bottom */}
          <rect x="48" y="98" width="12" height="10" rx="1" fill="#94a3b8" />
          <rect x="68" y="98" width="12" height="10" rx="1" fill="#94a3b8" />
        </svg>
      );

    case 'breadboard':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Breadboard Body */}
          <rect x="16" y="20" width="128" height="80" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
          {/* Red and Blue Power Bus Lines */}
          <line x1="24" y1="28" x2="136" y2="28" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="24" y1="34" x2="136" y2="34" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 2" />
          {/* Center Ravine */}
          <rect x="22" y="58" width="116" height="4" fill="#e2e8f0" />
          {/* Red and Blue Bottom Lines */}
          <line x1="24" y1="86" x2="136" y2="86" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="24" y1="92" x2="136" y2="92" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
          {/* Holes matrix */}
          {[42, 48, 54, 66, 72, 78].map((y, rowIdx) => (
            <g key={rowIdx}>
              {[28, 38, 48, 58, 68, 78, 88, 98, 108, 118, 128].map((x, colIdx) => (
                <rect key={colIdx} x={x} y={y} width="3" height="3" rx="0.5" fill="#334155" />
              ))}
            </g>
          ))}
        </svg>
      );

    case 'led':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Leads */}
          <path d="M74 70 L74 108" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <path d="M86 70 L86 102 L86 108" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          {/* Base Rim */}
          <ellipse cx="80" cy="70" rx="20" ry="6" fill="#b91c1c" stroke="#991b1b" strokeWidth="1.5" />
          {/* Epoxy Dome */}
          <path d="M62 70 C62 36, 98 36, 98 70 Z" fill="url(#red_led_gradient)" stroke="#ef4444" strokeWidth="1.5" />
          {/* Highlight glare */}
          <ellipse cx="73" cy="50" rx="4" ry="9" transform="rotate(-20 73 50)" fill="#ffffff" fillOpacity="0.6" />
          <defs>
            <linearGradient id="red_led_gradient" x1="60" y1="40" x2="100" y2="70" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f87171" />
              <stop offset="0.5" stopColor="#dc2626" />
              <stop offset="1" stopColor="#991b1b" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'led-rgb':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 4 Leads */}
          <path d="M68 70 L68 108" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <path d="M76 70 L76 114" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M84 70 L84 108" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <path d="M92 70 L92 108" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          {/* Base Rim */}
          <ellipse cx="80" cy="70" rx="22" ry="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Epoxy Dome with Rainbow gradient */}
          <path d="M60 70 C60 34, 100 34, 100 70 Z" fill="url(#rgb_led_gradient)" stroke="#94a3b8" strokeWidth="1.5" />
          <ellipse cx="72" cy="50" rx="4" ry="10" transform="rotate(-18 72 50)" fill="#ffffff" fillOpacity="0.75" />
          <defs>
            <linearGradient id="rgb_led_gradient" x1="60" y1="50" x2="100" y2="50" gradientUnits="userSpaceOnUse">
              <stop stopColor="#f87171" stopOpacity="0.85" />
              <stop offset="0.5" stopColor="#4ade80" stopOpacity="0.85" />
              <stop offset="1" stopColor="#60a5fa" stopOpacity="0.85" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'resistor':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Leads */}
          <line x1="16" y1="60" x2="52" y2="60" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          <line x1="108" y1="60" x2="144" y2="60" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
          {/* Ceramic Body */}
          <rect x="48" y="44" width="64" height="32" rx="12" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
          {/* Color bands: Red, Red, Brown, Gold (220 Ohm) */}
          <rect x="58" y="44" width="6" height="32" fill="#ef4444" />
          <rect x="70" y="44" width="6" height="32" fill="#ef4444" />
          <rect x="82" y="44" width="6" height="32" fill="#78350f" />
          <rect x="98" y="44" width="6" height="32" fill="#eab308" />
        </svg>
      );

    case 'capacitor':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Wire Leads */}
          <line x1="72" y1="78" x2="72" y2="110" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <line x1="88" y1="78" x2="88" y2="104" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          {/* Rubber Base */}
          <ellipse cx="80" cy="78" rx="22" ry="7" fill="#0f172a" />
          {/* Cylindrical Canister Sleeve */}
          <path d="M58 28 C58 20, 102 20, 102 28 L102 78 C102 85, 58 85, 58 78 Z" fill="#1e3a8a" stroke="#172554" strokeWidth="1.5" />
          {/* Top Aluminum Vent Cap */}
          <ellipse cx="80" cy="28" rx="22" ry="7" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
          <line x1="80" y1="23" x2="80" y2="33" stroke="#64748b" strokeWidth="1" />
          <line x1="72" y1="28" x2="88" y2="28" stroke="#64748b" strokeWidth="1" />
          {/* Negative Polarity Stripe */}
          <path d="M88 28 L98 28 L98 78 L88 78 Z" fill="#f8fafc" />
          <text x="93" y="46" fill="#1e293b" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">-</text>
          <text x="93" y="62" fill="#1e293b" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">-</text>
          <text x="93" y="74" fill="#1e293b" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">-</text>
          {/* Label Rating */}
          <text x="73" y="56" fill="#ffffff" opacity="0.9" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">100µF</text>
          <text x="73" y="64" fill="#ffffff" opacity="0.75" fontSize="5.5" fontFamily="sans-serif" textAnchor="middle">25V</text>
        </svg>
      );

    case 'capacitor-ceramic':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Wire Leads */}
          <line x1="70" y1="72" x2="70" y2="108" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <line x1="90" y1="72" x2="90" y2="108" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          {/* Ceramic Disc Body */}
          <ellipse cx="80" cy="50" rx="26" ry="24" fill="#d97706" stroke="#b45309" strokeWidth="2" />
          {/* Top highlight glare */}
          <path d="M62 42 C68 34, 92 34, 98 42" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
          {/* Value Marking */}
          <text x="80" y="54" fill="#451a03" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">104</text>
          <text x="80" y="63" fill="#451a03" fontSize="6" fontFamily="sans-serif" textAnchor="middle">50V</text>
        </svg>
      );

    case 'push-button':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 4 Metal Legs */}
          <path d="M42 45 L30 45 L30 75" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <path d="M42 75 L30 75 L30 95" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <path d="M118 45 L130 45 L130 75" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <path d="M118 75 L130 75 L130 95" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          {/* Metal Housing */}
          <rect x="40" y="30" width="80" height="60" rx="6" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
          {/* 4 Corner Rivets */}
          <circle cx="48" cy="38" r="2.5" fill="#64748b" />
          <circle cx="112" cy="38" r="2.5" fill="#64748b" />
          <circle cx="48" cy="82" r="2.5" fill="#64748b" />
          <circle cx="112" cy="82" r="2.5" fill="#64748b" />
          {/* Black Actuator Plunger */}
          <circle cx="80" cy="60" r="20" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          <circle cx="80" cy="60" r="16" fill="#334155" />
        </svg>
      );

    case 'buzzer':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Bottom Pins */}
          <line x1="68" y1="85" x2="68" y2="108" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <line x1="92" y1="85" x2="92" y2="108" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          {/* Piezo Cylinder Body */}
          <circle cx="80" cy="55" r="38" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="80" cy="55" r="32" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
          {/* Sound hole */}
          <circle cx="80" cy="55" r="8" fill="#0f172a" />
          {/* Plus polarity sign */}
          <text x="64" y="42" fill="#ef4444" fontSize="14" fontWeight="bold" fontFamily="sans-serif">+</text>
        </svg>
      );

    case 'ultrasonic-sensor':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Blue PCB */}
          <rect x="25" y="30" width="110" height="60" rx="6" fill="#1e40af" stroke="#1e3a8a" strokeWidth="2" />
          {/* Left Transducer Cylinder (Transmitter "T") */}
          <circle cx="56" cy="60" r="22" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
          <circle cx="56" cy="60" r="17" fill="#94a3b8" />
          <circle cx="56" cy="60" r="8" fill="#475569" />
          <text x="56" y="63" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">T</text>
          {/* Right Transducer Cylinder (Receiver "R") */}
          <circle cx="104" cy="60" r="22" fill="#cbd5e1" stroke="#64748b" strokeWidth="2" />
          <circle cx="104" cy="60" r="17" fill="#94a3b8" />
          <circle cx="104" cy="60" r="8" fill="#475569" />
          <text x="104" y="63" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">R</text>
          {/* 4 Header Pins at Bottom */}
          <rect x="68" y="86" width="24" height="6" fill="#0f172a" />
          <line x1="72" y1="92" x2="72" y2="105" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <line x1="77" y1="92" x2="77" y2="105" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <line x1="83" y1="92" x2="83" y2="105" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          <line x1="88" y1="92" x2="88" y2="105" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          {/* Text HC-SR04 */}
          <text x="80" y="42" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">HC-SR04</text>
        </svg>
      );

    case 'temperature-sensor':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* 3 Leads */}
          <line x1="70" y1="72" x2="70" y2="108" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="80" y1="72" x2="80" y2="108" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="90" y1="72" x2="90" y2="108" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          {/* TO-92 Half Cylinder Body */}
          <path d="M64 40 C64 24, 96 24, 96 40 L96 70 C96 72, 94 74, 92 74 L68 74 C66 74, 64 72, 64 70 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          {/* Flat Face Bevel */}
          <rect x="68" y="42" width="24" height="26" fill="#334155" rx="2" />
          <text x="80" y="54" fill="#94a3b8" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">TMP</text>
          <text x="80" y="62" fill="#94a3b8" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">36</text>
        </svg>
      );

    case 'servo-motor':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Blue Servo Body */}
          <rect x="45" y="36" width="70" height="52" rx="4" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2" />
          {/* Mounting Wings with Screw Holes */}
          <rect x="35" y="44" width="10" height="36" rx="2" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5" />
          <circle cx="40" cy="50" r="2" fill="#ffffff" />
          <circle cx="40" cy="74" r="2" fill="#ffffff" />
          <rect x="115" y="44" width="10" height="36" rx="2" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1.5" />
          <circle cx="120" cy="50" r="2" fill="#ffffff" />
          <circle cx="120" cy="74" r="2" fill="#ffffff" />
          {/* Output Gear Axis */}
          <circle cx="62" cy="36" r="14" fill="#1d4ed8" />
          <circle cx="62" cy="36" r="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
          {/* White Horn (Cross / Double Arm) */}
          <path d="M52 33 H72 V39 H52 Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="56" cy="36" r="1.5" fill="#64748b" />
          <circle cx="68" cy="36" r="1.5" fill="#64748b" />
          {/* Cable Ribbon */}
          <path d="M100 88 C100 100, 110 104, 125 106" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M102 88 C102 100, 112 104, 127 106" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M104 88 C104 100, 114 104, 129 106" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <text x="80" y="64" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">SG90 9g</text>
        </svg>
      );

    case 'computer-host':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* PC Tower */}
          <rect x="46" y="16" width="68" height="88" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
          {/* Front Bezel Faceplate */}
          <rect x="52" y="22" width="56" height="76" rx="2" fill="#0f172a" />
          {/* Power Button */}
          <circle cx="64" cy="34" r="4" fill="#38bdf8" />
          <circle cx="64" cy="34" r="2" fill="#0284c7" />
          {/* USB 3.0 Port */}
          <rect x="76" y="31" width="16" height="6" rx="1" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
          {/* Vents */}
          <line x1="60" y1="50" x2="100" y2="50" stroke="#334155" strokeWidth="2" />
          <line x1="60" y1="58" x2="100" y2="58" stroke="#334155" strokeWidth="2" />
          <line x1="60" y1="66" x2="100" y2="66" stroke="#334155" strokeWidth="2" />
          <line x1="60" y1="74" x2="100" y2="74" stroke="#334155" strokeWidth="2" />
          <line x1="60" y1="82" x2="100" y2="82" stroke="#334155" strokeWidth="2" />
          <text x="80" y="94" fill="#64748b" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">PC HOST</text>
        </svg>
      );

    case 'dc-power-supply':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Wall Adapter Brick */}
          <rect x="25" y="28" width="55" height="64" rx="4" fill="#18181b" stroke="#09090b" strokeWidth="2" />
          {/* Wall Prongs */}
          <rect x="15" y="42" width="10" height="6" fill="#94a3b8" />
          <rect x="15" y="72" width="10" height="6" fill="#94a3b8" />
          {/* Green LED */}
          <circle cx="65" cy="38" r="2.5" fill="#22c55e" />
          {/* Cable */}
          <path d="M80 60 C98 60, 105 75, 115 75" stroke="#27272a" strokeWidth="4" strokeLinecap="round" />
          {/* DC Barrel Plug */}
          <rect x="115" y="71" width="16" height="8" rx="2" fill="#18181b" stroke="#09090b" strokeWidth="1" />
          <rect x="131" y="73" width="12" height="4" fill="#94a3b8" stroke="#64748b" strokeWidth="0.5" />
          <text x="52" y="66" fill="#71717a" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">9V DC</text>
        </svg>
      );

    case 'dht11-sensor':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Blue Body */}
          <rect x="50" y="20" width="60" height="60" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
          {/* Humidity Slits */}
          <line x1="58" y1="34" x2="102" y2="34" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="58" y1="44" x2="102" y2="44" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="58" y1="54" x2="102" y2="54" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="58" y1="64" x2="102" y2="64" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round" />
          {/* PCB Breakout Base */}
          <rect x="45" y="78" width="70" height="16" rx="2" fill="#15803d" stroke="#166534" strokeWidth="1.5" />
          {/* 4 Header Pins */}
          <line x1="58" y1="94" x2="58" y2="108" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="72" y1="94" x2="72" y2="108" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="86" y1="94" x2="86" y2="108" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="100" y1="94" x2="100" y2="108" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <text x="80" y="28" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">DHT11</text>
        </svg>
      );

    case 'usb-cable':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Curving Cable */}
          <path d="M36 60 C60 40, 100 80, 124 60" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
          {/* USB-A Plug (Left) */}
          <rect x="22" y="53" width="16" height="14" rx="2" fill="#334155" stroke="#1e293b" strokeWidth="1" />
          <rect x="12" y="55" width="10" height="10" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
          {/* USB-B Plug (Right) */}
          <rect x="122" y="53" width="16" height="14" rx="2" fill="#334155" stroke="#1e293b" strokeWidth="1" />
          <rect x="138" y="54" width="10" height="12" rx="1" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
          <text x="80" y="98" fill="#64748b" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">USB A-to-B CABLE</text>
        </svg>
      );

    case 'drone-quadcopter':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Carbon Fiber X-Arms */}
          <line x1="30" y1="20" x2="130" y2="100" stroke="#27272a" strokeWidth="6" strokeLinecap="round" />
          <line x1="130" y1="20" x2="30" y2="100" stroke="#27272a" strokeWidth="6" strokeLinecap="round" />
          {/* 4 Motors with spinning props */}
          <circle cx="30" cy="20" r="10" fill="#3f3f46" stroke="#dc2626" strokeWidth="1.5" />
          <ellipse cx="30" cy="20" rx="18" ry="4" fill="#0284c7" opacity="0.7" transform="rotate(30 30 20)" />
          <circle cx="130" cy="20" r="10" fill="#3f3f46" stroke="#dc2626" strokeWidth="1.5" />
          <ellipse cx="130" cy="20" rx="18" ry="4" fill="#0284c7" opacity="0.7" transform="rotate(-30 130 20)" />
          <circle cx="30" cy="100" r="10" fill="#3f3f46" stroke="#dc2626" strokeWidth="1.5" />
          <ellipse cx="30" cy="100" rx="18" ry="4" fill="#0284c7" opacity="0.7" transform="rotate(-30 30 100)" />
          <circle cx="130" cy="100" r="10" fill="#3f3f46" stroke="#dc2626" strokeWidth="1.5" />
          <ellipse cx="130" cy="100" rx="18" ry="4" fill="#0284c7" opacity="0.7" transform="rotate(30 130 100)" />
          {/* Center Carbon Frame Plate */}
          <rect x="62" y="42" width="36" height="36" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
          {/* FC Board */}
          <rect x="68" y="48" width="24" height="24" rx="2" fill="#1e3a8a" />
          <circle cx="75" cy="55" r="2" fill="#22c55e" />
          <circle cx="85" cy="55" r="2" fill="#3b82f6" />
          {/* XT60 connector at rear */}
          <rect x="74" y="80" width="12" height="8" rx="1" fill="#eab308" />
          <text x="80" y="116" fill="#64748b" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">FPV DRONE</text>
        </svg>
      );

    case 'lipo-battery':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Yellow Shrinkwrap Pack */}
          <rect x="42" y="24" width="76" height="52" rx="4" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
          <rect x="42" y="40" width="76" height="20" fill="#1e3a8a" />
          <text x="80" y="53" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">3S 2200mAh</text>
          <text x="80" y="70" fill="#18181b" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">11.1V 45C</text>
          {/* Discharge Leads */}
          <path d="M72 76 V95 H65" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
          <path d="M88 76 V95 H95" stroke="#18181b" strokeWidth="3" strokeLinecap="round" />
          {/* XT60 Male Plug */}
          <rect x="68" y="94" width="24" height="12" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
          <circle cx="75" cy="100" r="2" fill="#f59e0b" />
          <circle cx="85" cy="100" r="2" fill="#f59e0b" />
        </svg>
      );

    case 'arduino-nano':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="30" y="32" width="100" height="56" rx="4" fill="#008184" stroke="#005d5f" strokeWidth="1.5" />
          {/* Mini-USB */}
          <rect x="22" y="48" width="14" height="24" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
          {/* ATmega328P Chip */}
          <rect x="80" y="48" width="22" height="22" rx="2" fill="#18181b" transform="rotate(45 91 59)" />
          {/* Dual Pin Header Rails */}
          <rect x="36" y="34" width="88" height="6" fill="#0f172a" />
          <rect x="36" y="80" width="88" height="6" fill="#0f172a" />
          <text x="64" y="62" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="sans-serif">NANO</text>
        </svg>
      );

    case 'pir-sensor':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="40" y="24" width="80" height="72" rx="4" fill="#15803d" stroke="#166534" strokeWidth="1.5" />
          {/* Fresnel Lens Dome */}
          <circle cx="80" cy="54" r="24" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
          <circle cx="80" cy="54" r="16" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 2" />
          <circle cx="80" cy="54" r="8" stroke="#cbd5e1" strokeWidth="1" />
          {/* 3 Pins Bottom */}
          <rect x="70" y="96" width="20" height="12" rx="1" fill="#0f172a" />
          <line x1="74" y1="108" x2="74" y2="116" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="80" y1="108" x2="80" y2="116" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <line x1="86" y1="108" x2="86" y2="116" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'mpu6050-sensor':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="44" y="30" width="72" height="60" rx="3" fill="#1e40af" stroke="#1e3a8a" strokeWidth="1.5" />
          <rect x="70" y="46" width="20" height="20" rx="1" fill="#09090b" stroke="#334155" strokeWidth="1" />
          <circle cx="74" cy="50" r="1.5" fill="#e2e8f0" />
          {/* 8 Pins Bottom */}
          <rect x="48" y="82" width="64" height="6" fill="#0f172a" />
          <text x="80" y="40" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">MPU-6050</text>
        </svg>
      );

    case 'dc-motor':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Motor Body */}
          <rect x="48" y="32" width="64" height="56" rx="10" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
          {/* Brass Output Shaft */}
          <rect x="77" y="12" width="6" height="20" rx="1" fill="#eab308" />
          <circle cx="80" cy="12" r="8" fill="#f97316" />
          {/* Rear Endcap */}
          <rect x="54" y="88" width="52" height="12" rx="2" fill="#dc2626" />
          {/* Terminals */}
          <rect x="62" y="100" width="6" height="8" fill="#fbbf24" />
          <rect x="92" y="100" width="6" height="8" fill="#fbbf24" />
        </svg>
      );

    case 'relay-module':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="34" y="24" width="92" height="72" rx="4" fill="#1e3a8a" stroke="#172554" strokeWidth="1.5" />
          {/* Blue Songle Cube */}
          <rect x="40" y="32" width="46" height="42" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
          <text x="63" y="52" fill="#ffffff" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">SONGLE</text>
          <text x="63" y="60" fill="#ffffff" fontSize="5" fontFamily="sans-serif" textAnchor="middle">5V RELAY</text>
          {/* 3 Screw Terminals Left */}
          <rect x="24" y="38" width="16" height="30" rx="2" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" />
          <circle cx="32" cy="44" r="2.5" fill="#eab308" />
          <circle cx="32" cy="53" r="2.5" fill="#eab308" />
          <circle cx="32" cy="62" r="2.5" fill="#eab308" />
          {/* 3 Header Pins Right */}
          <rect x="110" y="44" width="8" height="20" fill="#0f172a" />
        </svg>
      );

    case 'oled-display':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Blue PCB */}
          <rect x="36" y="16" width="88" height="88" rx="6" fill="#1e3a8a" stroke="#172554" strokeWidth="1.5" />
          {/* 4 M2 Corner Holes */}
          <circle cx="42" cy="22" r="3" fill="#ca8a04" />
          <circle cx="118" cy="22" r="3" fill="#ca8a04" />
          <circle cx="42" cy="98" r="3" fill="#ca8a04" />
          <circle cx="118" cy="98" r="3" fill="#ca8a04" />
          {/* 4-Pin Top Header */}
          <rect x="62" y="12" width="36" height="8" rx="1" fill="#0f172a" />
          <circle cx="68" cy="16" r="1.5" fill="#eab308" />
          <circle cx="76" cy="16" r="1.5" fill="#eab308" />
          <circle cx="84" cy="16" r="1.5" fill="#eab308" />
          <circle cx="92" cy="16" r="1.5" fill="#eab308" />
          {/* OLED Glass Screen Frame */}
          <rect x="42" y="30" width="76" height="58" rx="3" fill="#05070c" stroke="#334155" strokeWidth="1" />
          {/* OLED Glowing Cyan Text & Wave */}
          <text x="50" y="44" fill="#38bdf8" fontSize="7" fontWeight="bold" fontFamily="monospace">SSD1306 OLED</text>
          <text x="50" y="55" fill="#38bdf8" fontSize="6" fontFamily="monospace">TEMP: 24.8°C</text>
          <text x="50" y="65" fill="#38bdf8" fontSize="6" fontFamily="monospace">BATT: 98% OK</text>
          <path d="M48 76 Q60 68 72 76 T96 76 T112 76" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
        </svg>
      );

    case 'lcd-1602':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Green Motherboard PCB */}
          <rect x="18" y="32" width="124" height="56" rx="4" fill="#15803d" stroke="#166534" strokeWidth="1.5" />
          {/* 16 Pin Header Top */}
          <rect x="26" y="34" width="70" height="4" fill="#cbd5e1" />
          {/* Black Metal Bezel */}
          <rect x="28" y="42" width="104" height="38" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          {/* Blue Glowing LCD Face */}
          <rect x="34" y="46" width="92" height="30" rx="1" fill="#1d4ed8" />
          {/* Dot Matrix Text White */}
          <text x="40" y="58" fill="#ffffff" fontSize="7.5" fontWeight="bold" fontFamily="monospace">VIRTUAL IOT LAB </text>
          <text x="40" y="70" fill="#ffffff" fontSize="7.5" fontWeight="bold" fontFamily="monospace">SYS OK  24.5C  </text>
        </svg>
      );

    case 'tft-screen':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Red PCB */}
          <rect x="36" y="16" width="88" height="88" rx="4" fill="#b91c1c" stroke="#991b1b" strokeWidth="1.5" />
          {/* 8-Pin Header at Bottom */}
          <rect x="46" y="94" width="68" height="6" rx="1" fill="#0f172a" />
          {/* Black IPS Screen Frame */}
          <rect x="44" y="24" width="72" height="66" rx="2" fill="#020617" stroke="#334155" strokeWidth="1" />
          {/* Colorful Gauge / Dashboard UI */}
          <circle cx="80" cy="54" r="20" stroke="#334155" strokeWidth="4" fill="none" />
          <path d="M66 68 A20 20 0 1 1 94 68" stroke="#06b6d4" strokeWidth="4" fill="none" strokeLinecap="round" />
          <text x="80" y="56" fill="#f8fafc" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">75%</text>
          <text x="80" y="64" fill="#94a3b8" fontSize="5" fontFamily="sans-serif" textAnchor="middle">SPEED</text>
          {/* Status Bar */}
          <rect x="48" y="78" width="64" height="6" rx="2" fill="#1e293b" />
          <rect x="48" y="78" width="44" height="6" rx="2" fill="#10b981" />
        </svg>
      );

    case 'tm1637-display':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Red PCB */}
          <rect x="28" y="32" width="104" height="56" rx="4" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1.5" />
          {/* 4 Header Pins Right */}
          <rect x="122" y="44" width="6" height="32" rx="1" fill="#0f172a" />
          {/* Black Acrylic LED Shell */}
          <rect x="36" y="38" width="80" height="44" rx="3" fill="#0a0a0f" stroke="#18181b" strokeWidth="1" />
          {/* Glowing Red 7-Segment Digits */}
          <text x="44" y="70" fill="#ef4444" fontSize="26" fontWeight="bold" fontFamily="monospace" letterSpacing="2">12:34</text>
        </svg>
      );

    case 'fpv-monitor':
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Matte Black Chassis */}
          <rect x="22" y="24" width="116" height="72" rx="5" fill="#18181b" stroke="#27272a" strokeWidth="2" />
          {/* Sunshade Top & Sides */}
          <polygon points="26,24 134,24 126,14 34,14" fill="#09090b" opacity="0.9" />
          {/* Rubber Duck Antenna Left */}
          <rect x="30" y="8" width="5" height="16" rx="2" fill="#27272a" />
          {/* Active Screen Area with Horizon HUD */}
          <rect x="32" y="30" width="96" height="56" rx="2" fill="#1e3a8a" />
          {/* Sky / Ground Horizon */}
          <rect x="32" y="56" width="96" height="30" fill="#14532d" />
          <line x1="32" y1="56" x2="128" y2="56" stroke="#ffffff" strokeWidth="1" />
          {/* OSD Crosshair & Telemetry */}
          <circle cx="80" cy="56" r="4" stroke="#ffffff" strokeWidth="1" fill="none" />
          <text x="36" y="38" fill="#ffffff" fontSize="5" fontFamily="monospace">R4 5800M</text>
          <text x="96" y="38" fill="#ffffff" fontSize="5" fontFamily="monospace">RSSI 99%</text>
          <text x="36" y="82" fill="#ffffff" fontSize="5" fontFamily="monospace">15.4V 4S</text>
          <text x="96" y="82" fill="#ffffff" fontSize="5" fontFamily="monospace">ACRO</text>
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 160 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="30" y="20" width="100" height="80" rx="6" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="80" cy="60" r="18" fill="#94a3b8" />
        </svg>
      );
  }
};
