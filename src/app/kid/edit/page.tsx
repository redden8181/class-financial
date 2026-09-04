"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { KidForm } from "@/components/forms/KidForm";
import { Splash } from "@/components/ui";

export default function EditKidPage() {
  return (
    <Suspense fallback={<Splash />}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const id = useSearchParams().get("id") ?? undefined;
  return <KidForm kidId={id} />;
}
