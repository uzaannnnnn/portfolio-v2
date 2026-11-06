import { ArrowRight, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ArchitectureDiagramData, ArchitectureNode } from "@/types/portfolio";

const LAYER_LABELS: Record<ArchitectureNode["layer"], string> = {
  client: "Client / Presentation Layer",
  application: "Application / API Boundary",
  service: "Domain & Service Layer",
  data: "Persistence & Data Layer",
  infrastructure: "Infrastructure & Delivery",
};

export interface ArchitectureDiagramViewProps {
  diagram: ArchitectureDiagramData;
}

export function ArchitectureDiagramView({ diagram }: ArchitectureDiagramViewProps) {
  const nodeLabelById = new Map<string, string>(
    diagram.nodes.map((node) => [node.id, node.label]),
  );

  return (
    <section
      aria-label={`System architecture diagram: ${diagram.title}`}
      data-testid="architecture-diagram-view"
      className="rounded-lg border border-border-token bg-surface p-6 md:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-token pb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-accent" aria-hidden="true" />
          <h3 className="type-card-heading text-foreground">{diagram.title}</h3>
        </div>
        <Badge variant="accent" className="font-mono uppercase">
          System Topology
        </Badge>
      </div>

      <p className="type-body mt-3 text-secondary-foreground">{diagram.summary}</p>

      {/* Nodes Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {diagram.nodes.map((node) => (
          <div
            key={node.id}
            data-testid={`arch-node-${node.id}`}
            className="flex flex-col justify-between rounded-md border border-border-token bg-background p-4"
          >
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-accent">
                {LAYER_LABELS[node.layer]}
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {node.label}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-secondary-foreground">
                {node.description}
              </p>
            </div>

            {node.technologies && node.technologies.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border-token pt-3">
                {node.technologies.map((tech) => (
                  <Badge key={tech} variant="outline" className="font-mono text-[10px]">
                    {tech}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Data & Control Flow Connections */}
      {diagram.connections.length > 0 && (
        <div className="mt-6 border-t border-border-token pt-5">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Component Interactions & Data Flow
          </p>
          <ul className="mt-3 space-y-2">
            {diagram.connections.map((conn) => (
              <li
                key={conn.id}
                data-testid={`arch-connection-${conn.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-token bg-background px-3.5 py-2 text-xs"
              >
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <span>{nodeLabelById.get(conn.from) ?? conn.from}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <span>{nodeLabelById.get(conn.to) ?? conn.to}</span>
                </div>
                <span className="font-mono text-muted-foreground">
                  {conn.protocolOrAction}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
