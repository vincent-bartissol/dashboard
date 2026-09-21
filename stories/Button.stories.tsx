import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@/components/ui/button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Action",
    variant: "primary",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Secondaire" },
};

export const Ghost: Story = {
  args: { variant: "ghost", children: "Ghost" },
};

export const Disabled: Story = {
  args: { disabled: true, children: "Désactivé" },
};
