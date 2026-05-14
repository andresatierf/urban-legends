import { Link, type LinkProps } from "@tanstack/react-router";
import { type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ComposedCardAction = {
  label?: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
  align?: "start" | "end";
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  to?: LinkProps["to"];
  params?: LinkProps["params"];
  slot?: React.ReactNode;
};

type ComposedCardProps = Omit<React.ComponentProps<typeof Card>, "title"> & {
  title?: React.ReactNode;
  eyebrow?: React.ReactNode;
  badge?: BadgeProps | BadgeProps[];
  actions?: ComposedCardAction[];
  bodyClassName?: string;
};

export function ComposedCard({
  className,
  title,
  eyebrow,
  badge,
  actions,
  bodyClassName,
  children,
  ...props
}: ComposedCardProps) {
  const badges = badge && (Array.isArray(badge) ? badge : [badge]);
  const hasHeader =
    title !== undefined || eyebrow !== undefined || badges !== undefined;
  return (
    <Card
      className={cn(
        "border-ink shadow-fd-lg gap-0 overflow-visible rounded-2xl border-2 p-0",
        className,
      )}
      {...props}
    >
      {hasHeader && (
        <header className="border-ink bg-paper-deep flex flex-wrap items-center justify-between gap-3 rounded-t-[14px] border-b-2 px-4 py-3">
          <div className="flex min-w-0 flex-col gap-[0.15rem]">
            {eyebrow}
            {title}
          </div>
          {badges && (
            <div className="flex flex-wrap items-center gap-2">
              {badges.map((b, i) => (
                <Badge size="default" {...b} key={i} />
              ))}
            </div>
          )}
        </header>
      )}
      <div
        className={cn("flex flex-1 flex-col gap-3 px-4 py-3", bodyClassName)}
      >
        {children}
      </div>
      {actions && actions.length > 0 && (
        <div className="-mb-3.5 flex items-center gap-2 px-4">
          {actions.map((action, i) => {
            const prev = actions[i - 1];
            const needsSpacer = action.align === "end" && prev?.align !== "end";
            return (
              <ActionItem
                key={i}
                {...action}
                className={cn(needsSpacer && "ml-auto", action.className)}
              />
            );
          })}
        </div>
      )}
    </Card>
  );
}

function ActionItem({
  slot,
  label,
  icon,
  iconPosition = "start",
  variant,
  size = "sm",
  className,
  disabled,
  onClick,
  to,
  params,
}: ComposedCardAction) {
  if (slot !== undefined) {
    return <div className={cn("flex items-center", className)}>{slot}</div>;
  }
  const content = (
    <>
      {iconPosition === "start" && icon}
      {label}
      {iconPosition === "end" && icon}
    </>
  );
  if (to) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled}
        asChild
      >
        <Link to={to} params={params}>
          {content}
        </Link>
      </Button>
    );
  }
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {content}
    </Button>
  );
}
