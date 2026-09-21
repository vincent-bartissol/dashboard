import type { ComponentProps } from "react";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

function PaginationPrevious({
  className,
  text = "Previous",
  disabled,
  onClick,
  ...props
}: ComponentProps<"button"> & { text?: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn("h-9 gap-1 px-3", className)}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      <ChevronLeftIcon className="size-4" aria-hidden />
      <span className="hidden sm:inline">{text}</span>
    </Button>
  );
}

function PaginationNext({
  className,
  text = "Next",
  disabled,
  onClick,
  ...props
}: ComponentProps<"button"> & { text?: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      className={cn("h-9 gap-1 px-3", className)}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      <span className="hidden sm:inline">{text}</span>
      <ChevronRightIcon className="size-4" aria-hidden />
    </Button>
  );
}

function PaginationEllipsis({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center text-muted", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
};
