import type { Metadata } from "next"

import { DesignSystemGallery } from "@/components/design-system/design-system-gallery"

export const metadata: Metadata = {
  title: "Design system",
  description: "PhilInspect CRM design-system reference and component gallery.",
}

export default function DesignSystemPage() {
  return <DesignSystemGallery />
}
