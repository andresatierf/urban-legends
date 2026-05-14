import { MedalSvg } from "./svg-icons";

export function Podium({
  teams,
}: {
  teams: Array<{ team: { name: string; points: number }; userRole: string }>;
}) {
  const order = [teams[1] ?? null, teams[0] ?? null, teams[2] ?? null];
  const heights = [120, 160, 90];
  const medals: Array<"gold" | "silver" | "bronze"> = [
    "silver",
    "gold",
    "bronze",
  ];
  const positions = ["2nd", "1st", "3rd"];

  return (
    <div className="flex items-end justify-center gap-0">
      {order.map((team, i) =>
        team ? (
          <div
            key={team.team.name}
            className="flex max-w-[200px] flex-1 flex-col items-center"
          >
            <MedalSvg type={medals[i]} />
            <div className="mb-[0.2rem] px-[0.3rem] text-center font-[Funnel_Display] text-[0.85rem] leading-[1.2] font-bold">
              {team.team.name}
            </div>
            <div className="text-fd-mute mb-2 font-[DM_Mono] text-[1.1rem] font-medium [font-variant-numeric:tabular-nums]">
              {team.team.points}
            </div>
            <div
              className={`border-fd-ink flex w-full items-start justify-center rounded-t-[8px] border-2 border-b-0 pt-[0.6rem] ${medals[i] === "gold" ? "bg-[rgba(255,200,71,0.35)]" : medals[i] === "silver" ? "bg-[rgba(197,205,214,0.4)]" : "bg-[rgba(205,147,82,0.3)]"}`}
              style={{ height: `${heights[i]}px` }}
            >
              <span className="text-fd-ink font-[DM_Mono] text-[0.7rem] font-medium tracking-[0.1em] opacity-70">
                {positions[i]}
              </span>
            </div>
          </div>
        ) : null,
      )}
    </div>
  );
}
