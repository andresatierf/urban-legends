import { Button } from "./ui/button";

type Props = {
  text: string;
  children?: React.ReactNode;
};

export function SectionHeader({ text, children }: Props) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-semibold text-gray-800 text-lg">{text}</h2>
      {children}
    </div>
  );
}
