import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageTitle, SectionTitle } from "@/components/ui/heading";

const meta = {
  title: "UI/Heading",
  component: PageTitle,
} satisfies Meta<typeof PageTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Page: Story = {
  args: {
    children: "Vue d’ensemble",
    size: "lg",
  },
};

export const Section: Story = {
  render: () => (
    <div className="space-y-3">
      <SectionTitle size="lg">Nature</SectionTitle>
      <SectionTitle as="h3">Espaces verts</SectionTitle>
    </div>
  ),
};

export const Invert: Story = {
  render: () => (
    <div className="bg-navy p-6">
      <SectionTitle invert>Espace privé</SectionTitle>
    </div>
  ),
};
