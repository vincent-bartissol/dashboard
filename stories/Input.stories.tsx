import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input, Label, Select } from "@/components/ui/input";

const meta = {
  title: "UI/Input",
  component: Input,
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextField: Story = {
  render: () => (
    <div className="max-w-sm space-y-1">
      <Label htmlFor="email">E-mail</Label>
      <Input id="email" type="email" placeholder="vous@exemple.fr" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Lecture seule",
  },
};

export const NativeSelect: Story = {
  render: () => (
    <div className="max-w-sm space-y-1">
      <Label htmlFor="arr">Arrondissement</Label>
      <Select id="arr" defaultValue="">
        <option value="">Toute Paris</option>
        <option value="11">11e</option>
        <option value="20">20e</option>
      </Select>
    </div>
  ),
};
