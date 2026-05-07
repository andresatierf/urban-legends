# Rename team `visibility` to `joinPolicy` with values `open`/`closed`

The `teams` table previously carried a `visibility` field with values `"public"` and `"private"`. The name implied a concealment distinction — private = hidden — that the system never actually provided. Every team, regardless of this flag, was listed in all browse and detail views and its roster was visible. The flag had exactly one effect: gating user-initiated **JoinRequests**. Calling it `visibility` described the wrong thing.

The field is renamed to `joinPolicy` with values `"open"` and `"closed"` to name what the flag actually controls. `open` permits user-initiated join requests; `closed` rejects them. Captain-initiated invites bypass `joinPolicy` in either state. No team is hidden from any listing or roster view as a result of this field — those are separate concerns, not scoped to this PR.

The card-level roster preview that was previously gated on `visibility === "public"` is removed as a consequence: it was security theater. The same roster is visible on the team detail page regardless of the old flag, so the gate was not a real privacy boundary.

## Considered options

- **`open` / `invite-only`** — rejected: `invite-only` is a longer badge label and an awkward enum value in code.
- **`public` / `invite-only`** — rejected: retains the misleading `public` term alongside the cleaner alternative.
- **Keep `visibility` with new values `open`/`closed`** — rejected: the field name itself is the friction; renaming values alone does not fix it.
- **`joinPolicy: "open" | "closed"`** — chosen: the field name describes its purpose (authorisation gate on one side of the JoinRequest model) rather than a surface label.
