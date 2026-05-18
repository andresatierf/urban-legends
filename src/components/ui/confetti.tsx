export function Confetti() {
  const dots: Array<{
    top: string;
    left: string;
    size: string;
    opacity: number;
    color: string;
    animClass?: string;
  }> = [
    {
      top: "4%",
      left: "8%",
      size: "10px",
      opacity: 0.55,
      color: "bg-grass",
      animClass:
        "[animation:confetti-drift_4s_ease-in-out_infinite] motion-reduce:animate-none",
    },
    {
      top: "7%",
      left: "22%",
      size: "7px",
      opacity: 0.4,
      color: "bg-sunset",
      animClass:
        "[animation:confetti-drift_5s_ease-in-out_0.5s_infinite] motion-reduce:animate-none",
    },
    {
      top: "3%",
      left: "45%",
      size: "12px",
      opacity: 0.5,
      color: "bg-sky",
      animClass:
        "[animation:confetti-drift_3.5s_ease-in-out_1s_infinite] motion-reduce:animate-none",
    },
    {
      top: "9%",
      left: "63%",
      size: "8px",
      opacity: 0.45,
      color: "bg-plum",
    },
    { top: "5%", left: "78%", size: "10px", opacity: 0.5, color: "bg-gold" },
    {
      top: "2%",
      left: "91%",
      size: "7px",
      opacity: 0.4,
      color: "bg-grass",
    },
    {
      top: "12%",
      left: "5%",
      size: "6px",
      opacity: 0.35,
      color: "bg-sunset",
    },
    { top: "11%", left: "35%", size: "9px", opacity: 0.4, color: "bg-sky" },
    {
      top: "13%",
      left: "55%",
      size: "7px",
      opacity: 0.45,
      color: "bg-plum",
    },
    {
      top: "10%",
      left: "72%",
      size: "11px",
      opacity: 0.5,
      color: "bg-gold",
    },
    {
      top: "15%",
      left: "88%",
      size: "8px",
      opacity: 0.4,
      color: "bg-grass",
    },
    { top: "18%", left: "15%", size: "6px", opacity: 0.3, color: "bg-sky" },
    {
      top: "17%",
      left: "50%",
      size: "9px",
      opacity: 0.35,
      color: "bg-sunset",
    },
    {
      top: "20%",
      left: "82%",
      size: "7px",
      opacity: 0.3,
      color: "bg-plum",
    },
    {
      top: "1%",
      left: "58%",
      size: "6px",
      opacity: 0.35,
      color: "bg-gold",
    },
  ];
  return (
    <>
      {dots.map((d, i) => (
        <span
          key={i}
          aria-hidden
          className={`pointer-events-none absolute z-0 rounded-full ${d.color} ${d.animClass ?? ""}`}
          style={{
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            opacity: d.opacity,
          }}
        />
      ))}
    </>
  );
}
