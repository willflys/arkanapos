"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui";

export function ReceiptActions() {
  return (
    <Button size="sm" onClick={() => window.print()}>
      <Printer size={14} /> Cetak Struk
    </Button>
  );
}
