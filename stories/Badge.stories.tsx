import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@/components/ui/badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  args: { children: "Actif" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>default</Badge>
      <Badge variant="secondary">admin</Badge>
      <Badge variant="destructive">banni</Badge>
      <Badge variant="outline">user</Badge>
      <Badge variant="ghost">non vérifié</Badge>
    </div>
  ),
};
