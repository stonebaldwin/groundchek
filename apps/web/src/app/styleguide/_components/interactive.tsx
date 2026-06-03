"use client";
import { useState } from "react";
import {
  AddressInput,
  Button,
  Modal,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
  type AddressSuggestion,
} from "@groundbreak/ui";

const DEMO: AddressSuggestion[] = [
  { id: "1", label: "412 Castle St, Wilmington, NC 28401", sublabel: "New Hanover County" },
  { id: "2", label: "1100 E 5th St, Austin, TX 78702", sublabel: "Travis County" },
];

export function InteractiveShowcase() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const suggestions =
    q.trim().length > 1 ? DEMO.filter((d) => d.label.toLowerCase().includes(q.toLowerCase())) : [];

  return (
    <div className="space-y-6">
      <AddressInput
        value={q}
        onChange={setQ}
        suggestions={suggestions}
        buttonLabel="See permits"
        onSubmit={() => toast({ title: "Address submitted", description: q || "(empty)", tone: "info" })}
      />

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => toast({ title: "New permit nearby", description: "Reroof permit issued 2 doors down.", tone: "success" })}
        >
          Fire a toast
        </Button>
        <Button
          variant="outline"
          onClick={() => toast({ title: "Data looks stale", description: "This jurisdiction hasn't published in 14 months.", tone: "warning" })}
        >
          Warning toast
        </Button>
        <Button onClick={() => setOpen(true)}>Open modal</Button>
      </div>

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Permit history</TabsTrigger>
          <TabsTrigger value="area">Neighborhood</TabsTrigger>
          <TabsTrigger value="contractors">Contractors</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <p className="text-sm text-ink-soft">Every permit at the property, newest first.</p>
        </TabsContent>
        <TabsContent value="area">
          <p className="text-sm text-ink-soft">Activity trends and project-type mix for the ZIP.</p>
        </TabsContent>
        <TabsContent value="contractors">
          <p className="text-sm text-ink-soft">Who&apos;s building here, and what they pull permits for.</p>
        </TabsContent>
      </Tabs>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Watch this property"
        description="Get an email when a new permit is filed here or next door."
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setOpen(false);
                toast({ title: "Watching this property", tone: "success" });
              }}
            >
              Enable alerts
            </Button>
          </>
        }
      >
        Alerts and watchlists are wired in Phase 6.
      </Modal>
    </div>
  );
}
