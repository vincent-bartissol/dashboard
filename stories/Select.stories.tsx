import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  UiSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const meta = {
  title: "UI/Select",
  component: UiSelect,
} satisfies Meta<typeof UiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Headless: Story = {
  render: () => (
    <UiSelect defaultValue="11">
      <SelectTrigger className="min-w-56" aria-label="Arrondissement">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Toute Paris</SelectItem>
        <SelectItem value="11">11e arrondissement</SelectItem>
        <SelectItem value="20">20e arrondissement</SelectItem>
      </SelectContent>
    </UiSelect>
  ),
};
