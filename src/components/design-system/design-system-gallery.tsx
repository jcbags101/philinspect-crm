"use client"

import * as React from "react"
import {
  ArrowRight,
  Bell,
  Building2,
  Inbox,
  Plus,
  SearchX,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"

import {
  DataTable,
  DataToolbar,
  DataToolbarActions,
  DataToolbarFilters,
  DataToolbarSearch,
  DescriptionList,
  EmptyState,
  InlineAlert,
  ResultSummary,
  SearchField,
  StatusBadge,
  type DataTableColumn,
  type DataTableSort,
} from "@/components/molecules"
import { PageHeader } from "@/components/page/page-header"
import { Avatar, AvatarGroup } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const colorTokens = [
  { label: "Canvas", token: "--pi-surface-canvas", value: "#FAFAFA" },
  { label: "Raised", token: "--pi-surface-raised", value: "#FFFFFF" },
  { label: "Primary", token: "--pi-content-primary", value: "#0E0E0E" },
  { label: "Secondary", token: "--pi-content-secondary", value: "#52525B" },
  { label: "Border", token: "--pi-border-default", value: "#E5E5E5" },
  { label: "Brand", token: "--pi-brand-primary", value: "#2563EB" },
  { label: "Success", token: "--pi-status-success", value: "#183923" },
  { label: "Danger", token: "--pi-status-danger", value: "#A8121D" },
] as const

const typeTokens = [
  { label: "Page title", className: "pi-page-title", sample: "Deals pipeline" },
  { label: "Section title", className: "pi-section-title", sample: "Qualified leads" },
  { label: "Body", className: "pi-body", sample: "A compact interface for daily CRM work." },
  { label: "Body medium", className: "pi-body-medium", sample: "Assigned to Alex Reyes" },
  { label: "Body strong", className: "pi-body-strong", sample: "Proposal submitted" },
  { label: "UI label", className: "pi-ui-label", sample: "Last activity" },
  { label: "Caption", className: "pi-caption", sample: "Updated 8 minutes ago" },
  { label: "Eyebrow", className: "pi-eyebrow", sample: "Foundations" },
] as const

type DemoDeal = {
  id: string
  company: string
  owner: string
  stage: "Assessment" | "Demo Proposal" | "Qualified"
  value: number
}

const demoDeals: DemoDeal[] = [
  { id: "1", company: "Northstar Logistics", owner: "Alex Reyes", stage: "Assessment", value: 480000 },
  { id: "2", company: "Bayan Retail Group", owner: "Jamie Cruz", stage: "Demo Proposal", value: 320000 },
  { id: "3", company: "Harbor Health", owner: "Sam Santos", stage: "Qualified", value: 185000 },
]

const dealColumns: DataTableColumn<DemoDeal>[] = [
  {
    id: "company",
    header: "Company",
    sortable: true,
    cell: (deal) => <span className="font-medium">{deal.company}</span>,
  },
  {
    id: "stage",
    header: "Stage",
    cell: (deal) => (
      <Badge
        appearance="soft"
        tone={
          deal.stage === "Assessment"
            ? "purple"
            : deal.stage === "Demo Proposal"
              ? "orange"
              : "brand"
        }
      >
        {deal.stage}
      </Badge>
    ),
  },
  { id: "owner", header: "Owner", cell: (deal) => deal.owner },
  {
    id: "value",
    header: "Deal value",
    align: "end",
    sortable: true,
    cell: (deal) =>
      new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        maximumFractionDigits: 0,
      }).format(deal.value),
  },
]

function GallerySection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4" aria-labelledby={`section-${eyebrow}`}>
      <div>
        <p className="pi-eyebrow">{eyebrow}</p>
        <h2 id={`section-${eyebrow}`} className="pi-section-title mt-1">
          {title}
        </h2>
        <p className="pi-body mt-1 max-w-2xl text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="pi-card p-4 sm:p-6">{children}</div>
    </section>
  )
}

function SampleGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="pi-ui-label text-muted-foreground">{label}</p>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

export function DesignSystemGallery() {
  const [search, setSearch] = React.useState("")
  const [sort, setSort] = React.useState<DataTableSort>({
    id: "value",
    direction: "desc",
  })

  const visibleDeals = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const filtered = normalizedSearch
      ? demoDeals.filter((deal) =>
          [deal.company, deal.owner, deal.stage].some((value) =>
            value.toLowerCase().includes(normalizedSearch)
          )
        )
      : demoDeals

    return [...filtered].sort((a, b) => {
      const aValue = a[sort.id as keyof DemoDeal]
      const bValue = b[sort.id as keyof DemoDeal]
      const comparison =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue))
      return sort.direction === "asc" ? comparison : -comparison
    })
  }, [search, sort])

  return (
    <div className="space-y-10 pb-12">
      <PageHeader
        eyebrow="Internal reference"
        title="PhilInspect design system"
        description="A coded reference for the read-only Figma foundations, atoms, molecules, and CRM shell."
        meta={<Badge appearance="soft" tone="brand">Figma aligned</Badge>}
        actions={
          <Button variant="outline" iconStart={<Sparkles />}>
            Default mode
          </Button>
        }
      />

      <GallerySection
        eyebrow="01-foundations"
        title="Color and type"
        description="The product defaults to a restrained light canvas, compact type, an eight-pixel rhythm, and a 240-pixel navigation rail."
      >
        <div className="grid gap-8 xl:grid-cols-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {colorTokens.map((color) => (
              <div key={color.token} className="min-w-0">
                <div
                  className="aspect-[4/3] rounded-[var(--pi-radius-md)] border border-border shadow-[var(--pi-shadow-card)]"
                  style={{ background: `var(${color.token})` }}
                />
                <p className="pi-body-medium mt-2">{color.label}</p>
                <p className="pi-caption font-mono">{color.value}</p>
              </div>
            ))}
          </div>
          <div className="divide-y divide-border rounded-[var(--pi-radius-md)] border border-border">
            {typeTokens.map((type) => (
              <div key={type.label} className="grid gap-1 p-3 sm:grid-cols-[7rem_1fr] sm:items-baseline">
                <p className="pi-caption">{type.label}</p>
                <p className={type.className}>{type.sample}</p>
              </div>
            ))}
          </div>
        </div>
      </GallerySection>

      <GallerySection
        eyebrow="02-atoms"
        title="Buttons, badges, avatars, and keyboard hints"
        description="Compact controls match the Figma state matrix while retaining accessible focus, disabled, loading, and pressed states."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <SampleGroup label="Buttons">
              <Button iconStart={<Plus />}>Create lead</Button>
              <Button variant="outline">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Delete</Button>
              <Button loading loadingText="Saving">Save</Button>
              <Button disabled>Disabled</Button>
            </SampleGroup>
            <SampleGroup label="Icon buttons">
              <IconButton label="Notifications" icon={<Bell />} />
              <IconButton label="Filter results" icon={<SlidersHorizontal />} variant="outline" />
              <IconButton label="Open inbox" icon={<Inbox />} size="sm" variant="ghost" />
            </SampleGroup>
            <SampleGroup label="Keyboard">
              <Kbd>/</Kbd>
              <KbdGroup keys={["⌘", "K"]} label="Command plus K" />
              <KbdGroup keys={["Shift", "Enter"]} />
            </SampleGroup>
          </div>
          <div className="space-y-5">
            <SampleGroup label="Status and category badges">
              <Badge appearance="soft" tone="brand" dot>Active</Badge>
              <Badge appearance="soft" tone="success">Won</Badge>
              <Badge appearance="soft" tone="danger">Overdue</Badge>
              <Badge appearance="soft" tone="purple">Assessment</Badge>
              <Badge appearance="soft" tone="orange">Demo Proposal</Badge>
              <Badge appearance="segment" tone="neutral" size="segment">Enterprise</Badge>
            </SampleGroup>
            <SampleGroup label="Avatars">
              <Avatar name="Alex Reyes" size="xs" />
              <Avatar name="Jamie Cruz" size="sm" status="online" />
              <Avatar name="Sam Santos" status="away" />
              <Avatar name="Morgan Lee" size="lg" shape="rounded" />
              <AvatarGroup max={3} size="sm">
                <Avatar name="Alex Reyes" size="sm" />
                <Avatar name="Jamie Cruz" size="sm" />
                <Avatar name="Sam Santos" size="sm" />
                <Avatar name="Morgan Lee" size="sm" />
              </AvatarGroup>
            </SampleGroup>
          </div>
        </div>
      </GallerySection>

      <GallerySection
        eyebrow="03-molecules"
        title="Tabs, search, status, and alerts"
        description="Reusable combinations cover the most common CRM filtering and feedback patterns."
      >
        <div className="grid gap-8 xl:grid-cols-2">
          <Tabs defaultValue="active">
            <TabsList variant="segmented">
              <TabsTrigger value="active" count={12}>Active</TabsTrigger>
              <TabsTrigger value="won" count={4}>Won</TabsTrigger>
              <TabsTrigger value="lost" count={2}>Lost</TabsTrigger>
              <TabsTrigger value="disabled" disabled>Archived</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="pi-body rounded-[var(--pi-radius-md)] border border-border bg-muted/40 p-4">
              Twelve active opportunities are moving through the pipeline.
            </TabsContent>
            <TabsContent value="won" className="pi-body rounded-[var(--pi-radius-md)] border border-border bg-muted/40 p-4">
              Four opportunities closed successfully.
            </TabsContent>
            <TabsContent value="lost" className="pi-body rounded-[var(--pi-radius-md)] border border-border bg-muted/40 p-4">
              Two opportunities are available for review.
            </TabsContent>
          </Tabs>
          <div className="space-y-3">
            <SearchField
              value={search}
              onValueChange={setSearch}
              label="Search example deals"
              placeholder="Search deals or owners"
              resultCount={visibleDeals.length}
            />
            <div className="flex flex-wrap gap-2">
              <StatusBadge label="New" tone="info" dot />
              <StatusBadge label="On track" tone="success" dot />
              <StatusBadge label="At risk" tone="warning" dot />
              <StatusBadge label="Blocked" tone="danger" dot />
            </div>
            <InlineAlert tone="info" title="Component contract">
              Use semantic tokens so every state remains consistent in both supported themes.
            </InlineAlert>
          </div>
        </div>
      </GallerySection>

      <GallerySection
        eyebrow="04-data-display"
        title="Toolbar and CRM table"
        description="The table pattern supports sorting, filtering, density, empty states, and contextual actions."
      >
        <div className="overflow-hidden rounded-[var(--pi-radius-md)] border border-border">
          <DataToolbar>
            <DataToolbarSearch>
              <SearchField
                value={search}
                onValueChange={setSearch}
                label="Filter deals"
                placeholder="Filter deals"
                resultCount={visibleDeals.length}
              />
            </DataToolbarSearch>
            <DataToolbarFilters>
              <Button variant="outline" iconStart={<SlidersHorizontal />}>Filters</Button>
            </DataToolbarFilters>
            <DataToolbarActions>
              <Button iconStart={<Plus />}>Add deal</Button>
            </DataToolbarActions>
          </DataToolbar>
          <DataTable
            rows={visibleDeals}
            columns={dealColumns}
            getRowId={(deal) => deal.id}
            caption="Example CRM deals"
            density="compact"
            sort={sort}
            onSortChange={setSort}
            empty={{
              icon: SearchX,
              title: "No matching deals",
              description: "Clear the search to restore the example data.",
              primaryAction: <Button variant="outline" onClick={() => setSearch("")}>Clear search</Button>,
            }}
            className="rounded-none border-0 shadow-none"
            footer={
              <>
                <ResultSummary shown={visibleDeals.length} total={demoDeals.length} noun="deal" />
                <Button variant="ghost" size="sm" iconEnd={<ArrowRight />}>View pipeline</Button>
              </>
            }
          />
        </div>
      </GallerySection>

      <GallerySection
        eyebrow="05-detail-patterns"
        title="Structured detail and empty state"
        description="Detail surfaces and zero-data states use the same compact hierarchy as the Figma operational pages."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <DescriptionList
            divided
            columns={2}
            items={[
              { id: "company", label: "Company", value: "Northstar Logistics", hint: "Enterprise account" },
              { id: "owner", label: "Account manager", value: "Alex Reyes" },
              { id: "stage", label: "Pipeline stage", value: <StatusBadge label="Assessment" tone="info" /> },
              { id: "value", label: "Estimated value", value: "₱480,000" },
            ]}
          />
          <EmptyState
            icon={Building2}
            title="No linked resources"
            description="Resources associated with this deal will appear here."
            primaryAction={<Button iconStart={<Plus />}>Link resource</Button>}
            secondaryAction={<Button variant="ghost">Learn more</Button>}
            size="sm"
            className="border border-dashed border-border"
          />
        </div>
      </GallerySection>
    </div>
  )
}
