export function FlameMark({ size = 64 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700 shadow-[0_10px_30px_rgba(37,99,235,0.45),inset_0_1px_1px_rgba(255,255,255,0.4)]"
      style={{ width: size, height: size, borderRadius: size * 0.32 }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 2.5c.6 3-1.3 4.4-2.8 5.9C7.4 10.2 6 11.9 6 14.6 6 18.1 8.7 21 12 21s6-2.9 6-6.4c0-2.1-1-3.7-2.2-5.2-.5 1-1.2 1.6-2 1.9.8-2.4.2-5.6-1.8-8.8Z"
          fill="#fff"
        />
      </svg>
    </div>
  );
}
