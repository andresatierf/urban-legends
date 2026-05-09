import { cn } from "@/lib/utils";

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
};

export function Image({
  fill,
  sizes: _sizes,
  className,
  loading = "lazy",
  decoding = "async",
  alt,
  ...props
}: ImageProps) {
  return (
    <img
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
      {...props}
    />
  );
}
