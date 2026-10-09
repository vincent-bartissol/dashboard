"use client";

import {
  Bike,
  CalendarDays,
  Droplets,
  Landmark,
  Store,
  TrafficCone,
  Trees,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { HoverLift, RevealItem, RevealList } from "@/components/ui/reveal";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/ui/heading";

const ICONS: Record<string, LucideIcon> = {
  montreuil: Landmark,
  velib: Bike,
  nature: Trees,
  air: Wind,
  amenities: Droplets,
  events: CalendarDays,
  traffic: TrafficCone,
  markets: Store,
};

export function ThemeCardGrid({
  items,
}: Readonly<{
  items: { id: string; href: string; title: string; body: string }[];
}>) {
  return (
    <RevealList className="mt-8 grid gap-4 md:grid-cols-2">
      {items.map((item) => {
        const Icon = ICONS[item.id] ?? Landmark;
        return (
          <RevealItem key={item.id} className="h-full">
            <HoverLift className="h-full">
              <Link href={item.href} className="block h-full focus-field">
                <Card className="flex h-full flex-col transition hover:border-heading/40">
                  <Icon className="h-5 w-5 text-accent" aria-hidden />
                  <SectionTitle className="mt-3">{item.title}</SectionTitle>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.body}</p>
                </Card>
              </Link>
            </HoverLift>
          </RevealItem>
        );
      })}
    </RevealList>
  );
}
