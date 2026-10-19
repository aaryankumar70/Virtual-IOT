import React, { useMemo } from 'react';
import {
  DecodedPacket,
  ProtocolType,
} from '../../core/logicAnalyzer/logicAnalyzerTypes';
import { logicAnalyzerStore } from '../../state/logicAnalyzer/logicAnalyzerStore';
import { Search, Filter, ExternalLink, Copy, Check, ChevronRight, Binary, FileText } from 'lucide-react';

interface Props {
  packets: DecodedPacket[];
  selectedPacketId: string | null;
  selectedProtocolTab: 'all' | 'i2c' | 'spi' | 'uart';
  searchFilter: string;
}

export const PacketTableView: React.FC<Props> = ({
  packets,
  selectedPacketId,
  selectedProtocolTab,
  searchFilter,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  // Filter packets by protocol and search keyword
  const filteredPackets = useMemo(() => {
    return packets.filter((p) => {
      // Protocol tab filter
      if (selectedProtocolTab !== 'all' && p.protocol !== selectedProtocolTab) {
        return false;
      }

      // Text search filter
      if (!searchFilter) return true;
      const q = searchFilter.toLowerCase().trim();
      return (
        p.hex.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        (p.ascii && p.ascii.toLowerCase().includes(q)) ||
        p.protocol.toLowerCase().includes(q)
      );
    });
  }, [packets, selectedProtocolTab, searchFilter]);

  const selectedPacket = useMemo(() => {
    return packets.find((p) => p.id === selectedPacketId) || null;
  }, [packets, selectedPacketId]);

  const handleCopyPacket = (pkg: DecodedPacket) => {
    const text = `[${pkg.protocol.toUpperCase()}] ${pkg.hex} (${pkg.dec}) | ${pkg.description} @ ${pkg.timestampUs}µs`;
    navigator.clipboard.writeText(text);
    setCopiedId(pkg.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0c1222] text-xs font-mono">
      {/* 1. Main Packet Table */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
        {/* Table Header Controls */}
        <div className="px-3 py-2 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            {/* Protocol Tabs */}
            {(['all', 'i2c', 'spi', 'uart'] as const).map((tab) => {
              const count =
                tab === 'all'
                  ? packets.length
                  : packets.filter((p) => p.protocol === tab).length;
              const isActive = selectedProtocolTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => logicAnalyzerStore.setProtocolTab(tab)}
                  className={`px-2.5 py-1 rounded text-[11px] font-sans font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className="uppercase">{tab}</span>
                  <span
                    className={`text-[9.5px] px-1 py-0.2 rounded font-mono ${
                      isActive ? 'bg-blue-800 text-blue-100' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative flex items-center w-56">
            <Search size={12} className="absolute left-2.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter hex, ASCII, device..."
              value={searchFilter}
              onChange={(e) => logicAnalyzerStore.setSearchFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 text-[11px] text-white pl-7 pr-3 py-1 rounded outline-none placeholder-slate-500 transition-colors"
            />
          </div>
        </div>

        {/* Scrollable Packet Table Rows */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead className="sticky top-0 bg-[#0f172a] text-slate-400 border-b border-slate-800 z-10 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2 px-3 w-12 text-slate-400">#</th>
                <th className="py-2 px-3 w-24">Time (µs)</th>
                <th className="py-2 px-3 w-20">Protocol</th>
                <th className="py-2 px-3 w-20">Type</th>
                <th className="py-2 px-3 w-20">Hex</th>
                <th className="py-2 px-3 w-14">ASCII</th>
                <th className="py-2 px-3">Decoded Transaction / Description</th>
                <th className="py-2 px-2 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredPackets.map((pkg, idx) => {
                const isSelected = selectedPacketId === pkg.id;

                let protoBadge = 'bg-cyan-950 text-cyan-400 border-cyan-800';
                if (pkg.protocol === 'spi') {
                  protoBadge = 'bg-purple-950 text-purple-400 border-purple-800';
                } else if (pkg.protocol === 'uart') {
                  protoBadge = 'bg-amber-950 text-amber-400 border-amber-800';
                }

                let typeBadge = 'text-slate-300';
                if (pkg.type === 'start') typeBadge = 'text-emerald-400 font-bold';
                else if (pkg.type === 'stop') typeBadge = 'text-rose-400 font-bold';
                else if (pkg.type === 'address') typeBadge = 'text-cyan-300 font-semibold';
                else if (pkg.type === 'cs-assert' || pkg.type === 'cs-deassert') typeBadge = 'text-orange-300 font-semibold';

                return (
                  <tr
                    key={pkg.id}
                    onClick={() => logicAnalyzerStore.selectPacket(pkg.id)}
                    className={`transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-blue-900/40 text-white font-semibold'
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <td className="py-1.5 px-3 text-slate-400 text-[10px]">{idx + 1}</td>
                    <td className="py-1.5 px-3 text-slate-300 font-mono">
                      {pkg.timestampUs >= 1000 ? `${(pkg.timestampUs / 1000).toFixed(2)}ms` : `${pkg.timestampUs}µs`}
                    </td>
                    <td className="py-1.5 px-3">
                      <span className={`px-1.5 py-0.2 rounded border text-[9.5px] uppercase font-bold ${protoBadge}`}>
                        {pkg.protocol}
                      </span>
                    </td>
                    <td className={`py-1.5 px-3 uppercase text-[10px] ${typeBadge}`}>
                      {pkg.type}
                    </td>
                    <td className="py-1.5 px-3 font-bold text-yellow-300">
                      {pkg.hex}
                    </td>
                    <td className="py-1.5 px-3 text-emerald-400 font-bold">
                      {pkg.ascii && pkg.ascii !== '·' ? `'${pkg.ascii}'` : '—'}
                    </td>
                    <td className="py-1.5 px-3 text-slate-300 truncate max-w-[280px]">
                      {pkg.description}
                    </td>
                    <td className="py-1.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleCopyPacket(pkg)}
                        title="Copy packet details"
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        {copiedId === pkg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredPackets.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No protocol packets matching query &ldquo;{searchFilter}&rdquo;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Packet Inspector Details Side Card */}
      <div className="w-72 shrink-0 bg-[#0d1424] p-3 flex flex-col gap-3 overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
            <Binary size={13} className="text-blue-400" />
            Packet Inspector
          </span>
          {selectedPacket && (
            <span className="text-[10px] text-slate-400 font-mono">
              @{selectedPacket.timestampUs}µs
            </span>
          )}
        </div>

        {selectedPacket ? (
          <div className="flex flex-col gap-3 font-sans">
            {/* Header Tag */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                  {selectedPacket.protocol} Protocol Frame
                </span>
                <span className="font-mono text-sm font-bold text-yellow-300">
                  {selectedPacket.hex}
                </span>
              </div>
              <p className="text-xs font-semibold text-white leading-tight">
                {selectedPacket.description}
              </p>
            </div>

            {/* Binary Bit-Level Breakdown */}
            <div className="flex flex-col gap-1 font-mono">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">
                Binary Bits (MSB → LSB)
              </span>
              <div className="grid grid-cols-8 gap-0.5 text-center text-[10px]">
                {['b7', 'b6', 'b5', 'b4', 'b3', 'b2', 'b1', 'b0'].map((b) => (
                  <div key={b} className="text-[8.5px] text-slate-400">{b}</div>
                ))}
                {selectedPacket.bin.split('').map((bit, idx) => (
                  <div
                    key={idx}
                    className={`py-1 rounded border ${
                      bit === '1'
                        ? 'bg-blue-600/30 border-blue-500 text-blue-200 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {bit}
                  </div>
                ))}
              </div>
            </div>

            {/* Numeric Conversions */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[9.5px] text-slate-400 font-semibold uppercase">Decimal</div>
                <div className="text-sm font-bold text-white mt-0.5">{selectedPacket.dec}</div>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <div className="text-[9.5px] text-slate-400 font-semibold uppercase">ASCII Char</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {selectedPacket.ascii ? `'${selectedPacket.ascii}'` : 'N/A'}
                </div>
              </div>
            </div>

            {/* Timing Metrics */}
            <div className="p-2 rounded bg-slate-900 border border-slate-800 flex flex-col gap-1 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Start Time:</span>
                <span className="text-white">{selectedPacket.timestampUs} µs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="text-white">{selectedPacket.durationUs} µs</span>
              </div>
              {selectedPacket.protocol === 'i2c' && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Acknowledge:</span>
                  <span className={selectedPacket.ack ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {selectedPacket.ack ? 'ACK (0)' : 'NACK (1)'}
                  </span>
                </div>
              )}
              {selectedPacket.protocol === 'spi' && selectedPacket.misoHex && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">MISO Response:</span>
                  <span className="text-purple-300 font-bold">
                    {selectedPacket.misoHex} ('{selectedPacket.misoAscii}')
                  </span>
                </div>
              )}
            </div>

            {/* Jump to Waveform Action Button */}
            <button
              onClick={() => logicAnalyzerStore.selectPacket(selectedPacket.id)}
              className="w-full py-1.5 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <ExternalLink size={13} />
              <span>Center in Waveform View</span>
            </button>
          </div>
        ) : (
          <div className="p-4 text-center text-slate-400 text-xs font-sans">
            Click any transaction packet row in the table or bubble on the timeline to inspect its full bit-level decodes and hardware register parameters.
          </div>
        )}
      </div>
    </div>
  );
};
