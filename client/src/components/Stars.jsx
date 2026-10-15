export default function Stars({ value }) {
  const n = Math.round(value);
  return (
    <span role="img" aria-label={`${value} out of 5`} className="text-[#B45309] tracking-wide">
      {'★'.repeat(n)}<span className="text-[#AEB9B6]">{'★'.repeat(5 - n)}</span>
    </span>
  );
}