import type { TournamentStatus } from "../utils";

export type StatusFilter = TournamentStatus | "all";

export type StatusCounts = Record<StatusFilter, number>;
