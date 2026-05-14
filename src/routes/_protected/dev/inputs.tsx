import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/dev/inputs")({
  component: InputsWorkbenchPage,
});

function InputsWorkbenchPage() {
  return (
    <div className="border-ink bg-card rounded-xl border-2 p-8 shadow-[4px_4px_0_var(--shadow)]">
      <h2 className="font-fd-display mb-2 text-2xl font-bold">Inputs</h2>
      <p className="text-mute">TODO: input component workbench</p>
    </div>
  );
}
