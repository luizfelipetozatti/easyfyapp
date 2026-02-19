"use client";

import { useState } from "react";
import { Button } from "@easyfyapp/ui";
import { Plus } from "lucide-react";
import { ServiceFormDialog } from "./service-form-dialog";

export function NewServiceButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Novo serviço
      </Button>
      <ServiceFormDialog open={open} onOpenChange={setOpen} service={null} />
    </>
  );
}
