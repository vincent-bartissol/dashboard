import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card, KpiCard } from "@/components/ui/card";

const meta = {
  title: "UI/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Panel: Story = {
  render: () => (
    <Card>
      <p className="text-sm text-muted">Surface papier</p>
      <p className="mt-2 font-display text-xl text-heading">Contenu de carte</p>
    </Card>
  ),
};

export const Kpi: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
      <KpiCard label="Vélib’" value="12 480" hint="vélos disponibles" />
      <KpiCard label="Arbres" value="204 321" />
      <KpiCard label="Événements" value="86" hint="aujourd’hui" />
    </div>
  ),
};
