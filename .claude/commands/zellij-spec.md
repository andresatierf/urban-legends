---
description: Create Zellij tab with 3-pane layout for working on a spec
---

You are setting up a Zellij environment for working on a feature specification. This command creates a new Zellij tab with a 3-pane layout optimized for development.

## Step 1: Parse the Spec Argument

The user will provide a spec name or path as an argument. Extract it:

- If argument is a short name (e.g., `team-joining`), that's the feature name
- If argument is a full path (e.g., `specs/team-joining.md`), extract the feature name from the filename
- If no argument provided, ask the user which spec to set up

The feature name will be used for:

- Branch name: `andre/feat/[feature-name]`
- Worktree directory: `../urban-legends-[feature-name]`
- Zellij tab name: `[feature-name]`

## Step 2: Verify Worktree Exists

Check if the worktree directory exists:

```bash
# Check if worktree directory exists
ls -d ../urban-legends-[feature-name]
```

If it doesn't exist, inform the user and ask if they want to create it using `/implement-spec` instead.

If it exists, proceed to set up the Zellij environment.

## Step 3: Calculate Unique Ports

To avoid port conflicts when working on multiple features simultaneously, calculate unique ports based on the feature name:

**Port Strategy:**

- Base Next.js port: 3000
- Base Convex port: 3210 (Convex dev dashboard default)
- Calculate offset from feature name hash

Use this bash command to calculate ports:

```bash
# Calculate port offset from feature name (0-99 range)
OFFSET=$(echo -n "[feature-name]" | cksum | awk '{print $1 % 100}')
NEXT_PORT=$((3000 + OFFSET))
CONVEX_PORT=$((3210 + OFFSET))

echo "Next.js port: $NEXT_PORT"
echo "Convex port: $CONVEX_PORT"
```

Example port assignments:

- `team-joining`: Next.js → 3084, Convex → 3294
- `leaderboard`: Next.js → 3042, Convex → 3252
- `admin-roles`: Next.js → 3067, Convex → 3277

## Step 4: Create Zellij Tab with Layout File

Set up a new Zellij tab using the `dev-spec` layout file with calculated ports:

```bash
# Calculate ports
OFFSET=$(echo -n "[feature-name]" | cksum | awk '{print $1 % 100}')
NEXT_PORT=$((3000 + OFFSET))
CONVEX_PORT=$((3210 + OFFSET))

# Get the worktree path
WORKTREE_PATH="$PWD/../urban-legends-[feature-name]"

# Create new Zellij tab named after the feature
zellij action new-tab --name "[feature-name]" --cwd "$WORKTREE_PATH"
zellij action write-chars "cd $WORKTREE_PATH"
zellij action write 10

# Split right to create upper-right pane
zellij action new-pane --direction right --cwd "$WORKTREE_PATH" --start-suspended -- PORT=$NEXT_PORT bun --bun run dev

# Split the right pane down to create lower-right pane
zellij action new-pane --direction down --cwd "$WORKTREE_PATH" --start-suspended -- CONVEX_SITE_PORT=$CONVEX_PORT bun --bun convex dev

# Focus back to left pane for coding
zellij action focus-next-pane

# Open nvim in the editor pane
zellij action write-chars "nvim"
zellij action write 10

# Resize
zellij action resize + right
zellij action resize + right
zellij action resize + right
zellij action resize + right
zellij action resize + right
```

## Step 5: Confirm Setup

After setting up the Zellij environment, inform the user with the calculated ports:

```
✓ Zellij tab "[feature-name]" created with 3-pane layout

Layout:
- Left pane: Code workspace (current focus)
- Upper-right pane: Next.js dev server (http://localhost:[NEXT_PORT])
- Lower-right pane: Convex backend (http://localhost:[CONVEX_PORT])

Working directory: /home/andre/dev/urban-legends-[feature-name]
Branch: andre/feat/[feature-name]

Ports assigned:
- Next.js: [NEXT_PORT]
- Convex: [CONVEX_PORT]

Both development servers are starting in the right panes.
You can access the app at http://localhost:[NEXT_PORT]
```

**Important:** Make sure to replace `[NEXT_PORT]` and `[CONVEX_PORT]` with the actual calculated port numbers.

## Example Usage

User runs: `/zellij-spec team-joining`

You would:

1. Parse `team-joining` as the feature name
2. Check if `../urban-legends-team-joining` exists
3. Calculate ports:
   - `OFFSET=$(echo -n "team-joining" | cksum | awk '{print $1 % 100}')` → 84
   - Next.js port: 3084
   - Convex port: 3294
4. Create Zellij tab named "team-joining"
5. Set up 3 panes with the layout described above
6. Start `PORT=3084 bun --bun run dev` in upper-right
7. Start `CONVEX_SITE_PORT=3294 bun --bun convex dev` in lower-right
8. Focus left pane for coding
9. Confirm setup to user with port information

## Important Notes

- This command assumes the worktree already exists (created via `/implement-spec` or manually)
- If the worktree doesn't exist, suggest using `/implement-spec` instead
- The left pane is where you (Claude) will work on code
- The right panes run the development servers automatically
- All panes are set to the worktree directory
