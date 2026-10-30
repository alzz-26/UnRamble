// The Unramble mark: five waveform bars, the sound of you talking.
const BARS = [10, 22, 14, 26, 8];

export default function Logo({ size = 28 }: { size?: number }) {
  const scale = size / 28;
  return (
    <span className="logo" aria-hidden="true" style={{ height: size, gap: 3 * scale }}>
      {BARS.map((h, i) => (
        <span key={i} style={{ height: h * scale, width: 4 * scale, borderRadius: 2 * scale }} />
      ))}
    </span>
  );
}
