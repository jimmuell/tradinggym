import { Keyboard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const shortcuts = [
  { key: 'H', description: 'Place horizontal line' },
  { key: 'T', description: 'Place trend line' },
  { key: 'R', description: 'Draw rectangle' },
  { key: 'L', description: 'Place text label' },
  { key: 'Escape', description: 'Deactivate current tool' },
  { key: 'Delete', description: 'Remove selected drawing' },
  { key: 'Space', description: 'Play / pause replay' },
  { key: '→', description: 'Step forward one bar' },
  { key: '←', description: 'Step back one bar' },
];

export default function KeyboardShortcutsModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground" title="Keyboard Shortcuts">
          <Keyboard size={14} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <table className="w-full text-sm">
            <tbody>
              {shortcuts.map(({ key, description }) => (
                <tr key={key} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-4">
                    <kbd className="px-2 py-1 text-xs font-mono bg-muted border border-border rounded">{key}</kbd>
                  </td>
                  <td className="py-2.5 text-muted-foreground">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogClose asChild>
          <Button variant="outline" className="mt-2 w-full">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
