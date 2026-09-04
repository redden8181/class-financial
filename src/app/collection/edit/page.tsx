"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CollectionForm } from "@/components/forms/CollectionForm";
import { Splash } from "@/components/ui";

export default function EditCollectionPage() {
  return (
    <Suspense fallback={<Splash />}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const id = useSearchParams().get("id") ?? undefined;
  return <CollectionForm collectionId={id} />;
}
