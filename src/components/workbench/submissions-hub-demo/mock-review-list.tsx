import { useMemo, useState } from "react";

import { SubmissionReviewList } from "@/components/submissions/review/submission-review-list";
import type { ReviewItem } from "@/components/submissions/review/types";

import { DEMO_REVIEW_ITEMS } from "./fixtures";

type Props = {
  filter?: "pending" | "all" | "done";
  showFilters?: boolean;
  emptyMessage?: string;
};

function filterItems(items: ReviewItem[], filter: Props["filter"]) {
  if (filter === "pending") {
    return items.filter((i) => i.data.state === "pending");
  }
  if (filter === "done") {
    return items.filter((i) => i.data.state !== "pending");
  }
  return items;
}

export function MockReviewList({
  filter = "pending",
  showFilters,
  emptyMessage,
}: Props) {
  const [items, setItems] = useState<ReviewItem[]>(DEMO_REVIEW_ITEMS);

  const filtered = useMemo(() => filterItems(items, filter), [items, filter]);

  const onApprove = async (target: ReviewItem) => {
    setItems((prev) =>
      prev.map((it) =>
        keyFor(it) === keyFor(target) ? mutateState(it, "approved") : it,
      ),
    );
  };

  const onReject = async (target: ReviewItem) => {
    setItems((prev) =>
      prev.map((it) =>
        keyFor(it) === keyFor(target) ? mutateState(it, "rejected") : it,
      ),
    );
  };

  return (
    <SubmissionReviewList
      items={filtered}
      onApprove={onApprove}
      onReject={onReject}
      showFilters={showFilters}
      emptyMessage={emptyMessage}
    />
  );
}

function keyFor(item: ReviewItem) {
  return item.type === "individual"
    ? `i-${item.data.submission._id}`
    : `g-${item.data.group._id}`;
}

function mutateState(
  item: ReviewItem,
  state: "approved" | "rejected",
): ReviewItem {
  if (item.type === "individual") {
    return {
      type: "individual",
      data: {
        ...item.data,
        state,
        submission: { ...item.data.submission, state },
      },
    };
  }
  return {
    type: "group",
    data: {
      ...item.data,
      state,
      group: { ...item.data.group, state },
    },
  };
}
