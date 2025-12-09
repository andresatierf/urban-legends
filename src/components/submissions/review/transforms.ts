import type { ReviewItem } from "./types";

/**
 * Filter review items based on search query
 * Searches in team name, tournament name, submitter name, and description
 */
export function filterReviewItems(
  items: ReviewItem[],
  searchQuery: string,
): ReviewItem[] {
  if (!searchQuery.trim()) {
    return items;
  }

  const query = searchQuery.toLowerCase();

  return items.filter((item) => {
    if (item.type === "individual") {
      const { team, tournament, submitter, submission } = item.data;
      return (
        team.name.toLowerCase().includes(query) ||
        tournament.name.toLowerCase().includes(query) ||
        submitter.name.toLowerCase().includes(query) ||
        submission.description?.toLowerCase().includes(query) ||
        false
      );
    } else {
      const { team, tournament, submitters } = item.data;
      return (
        team.name.toLowerCase().includes(query) ||
        tournament.name.toLowerCase().includes(query) ||
        submitters.some((s) => s.name.toLowerCase().includes(query))
      );
    }
  });
}

/**
 * Sort review items based on the specified criteria
 */
export function sortReviewItems(
  items: ReviewItem[],
  sortBy: "date-desc" | "date-asc" | "points-desc" | "points-asc",
): ReviewItem[] {
  const sorted = [...items];

  sorted.sort((a, b) => {
    // Get date and points for comparison
    const dateA =
      a.type === "individual" ? a.data.submission.date : a.data.group.date;
    const dateB =
      b.type === "individual" ? b.data.submission.date : b.data.group.date;
    const pointsA =
      a.type === "individual"
        ? a.data.submission.pointsEarned
        : a.data.group.pointsEarned;
    const pointsB =
      b.type === "individual"
        ? b.data.submission.pointsEarned
        : b.data.group.pointsEarned;

    if (sortBy === "date-desc") {
      return dateB.localeCompare(dateA);
    } else if (sortBy === "date-asc") {
      return dateA.localeCompare(dateB);
    } else if (sortBy === "points-desc") {
      return pointsB - pointsA;
    } else {
      // points-asc
      return pointsA - pointsB;
    }
  });

  return sorted;
}
