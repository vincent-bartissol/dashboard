import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const meta = {
  title: "UI/Table",
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => (
    <Table>
      <TableHeader className="bg-ground">
        <TableRow className="hover:bg-transparent">
          <TableHead>Station</TableHead>
          <TableHead>Vélos</TableHead>
          <TableHead>Arrondissement</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>République</TableCell>
          <TableCell>12</TableCell>
          <TableCell>11e</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Bastille</TableCell>
          <TableCell>3</TableCell>
          <TableCell>4e</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Nation</TableCell>
          <TableCell>0</TableCell>
          <TableCell>12e</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
