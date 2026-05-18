import type { TournamentWithAuthority } from "../../../../convex/tournaments";
import { Discover } from "./discover";
import { YourBracket } from "./your-bracket";

type Props = {
  yours: TournamentWithAuthority[];
  discover: TournamentWithAuthority[];
};

export function TournamentListing({ yours, discover }: Props) {
  const hasYours = yours.length > 0;
  const hasDiscover = discover.length > 0;

  return (
    <div className="space-y-8">
      {hasYours && <YourBracket tournaments={yours} />}
      {hasDiscover && (
        <Discover
          tournaments={discover}
          title={hasYours ? "More tournaments" : "Open tournaments"}
        />
      )}
    </div>
  );
}
