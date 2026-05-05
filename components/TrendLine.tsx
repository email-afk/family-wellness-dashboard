export function TrendLine({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 42 - ((value - min) / range) * 34;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg role="img" aria-label={label} viewBox="0 0 100 48" className="h-12 w-full">
      <polyline
        fill="none"
        stroke="#526a4e"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="4"
        points={points}
      />
    </svg>
  );
}
