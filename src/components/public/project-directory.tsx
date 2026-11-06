"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Github, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { ProjectSummary } from "@/types/portfolio";

export interface ProjectDirectoryProps {
  projects: ProjectSummary[];
}

export function ProjectDirectory({ projects }: ProjectDirectoryProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedTechnology, setSelectedTechnology] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const project of projects) {
      if (project.category) set.add(project.category);
    }
    return Array.from(set).sort();
  }, [projects]);

  const technologies = React.useMemo(() => {
    const set = new Set<string>();
    for (const project of projects) {
      for (const tech of project.technologies) {
        set.add(tech);
      }
    }
    return Array.from(set).sort();
  }, [projects]);

  const filteredProjects = React.useMemo(() => {
    return projects.filter((project) => {
      if (selectedCategory !== "all" && project.category !== selectedCategory) {
        return false;
      }
      if (
        selectedTechnology !== "all" &&
        !project.technologies.includes(selectedTechnology)
      ) {
        return false;
      }
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = project.name.toLowerCase().includes(q);
        const matchesDesc = project.description.toLowerCase().includes(q);
        const matchesTech = project.technologies.some((t) =>
          t.toLowerCase().includes(q),
        );
        return matchesName || matchesDesc || matchesTech;
      }
      return true;
    });
  }, [projects, searchQuery, selectedCategory, selectedTechnology]);

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedTechnology !== "all" ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedTechnology("all");
    setSearchQuery("");
  };

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No published projects are live yet"
        description="Initial project entries (GeoEntity, ClayCV, and SPK Bansos SAW) are currently stored in DRAFT state awaiting final case-study verification and explicit publication."
        note="Only projects with status = 'published' are exposed on public routes."
      />
    );
  }

  return (
    <div className="space-y-8" data-testid="project-directory">
      {/* Filter Controls */}
      <div className="rounded-lg border border-border-token bg-surface p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          {/* Search Input */}
          <div className="md:col-span-5">
            <label
              htmlFor="project-search-input"
              className="block font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Search Case Studies
            </label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="project-search-input"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by title, domain, or technology..."
                data-testid="project-search-input"
                className="h-10 w-full rounded-md border border-border-token bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-accent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-4">
            <label
              htmlFor="project-category-select"
              className="block font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Engineering Category
            </label>
            <select
              id="project-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              data-testid="project-category-select"
              className="mt-1.5 h-10 w-full rounded-md border border-border-token bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All Categories ({projects.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Technology Filter */}
          <div className="md:col-span-3">
            <label
              htmlFor="project-tech-select"
              className="block font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Technology
            </label>
            <select
              id="project-tech-select"
              value={selectedTechnology}
              onChange={(e) => setSelectedTechnology(e.target.value)}
              data-testid="project-tech-select"
              className="mt-1.5 h-10 w-full rounded-md border border-border-token bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All Technologies</option>
              {technologies.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex items-center justify-between border-t border-border-token pt-3 text-xs text-secondary-foreground">
            <span>
              Showing {filteredProjects.length} of {projects.length} published projects
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              data-testid="project-reset-filters"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Reset Filters
            </Button>
          </div>
        )}
      </div>

      {/* Results Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No published projects match your filter criteria"
          description="Try clearing the search query or selecting a different category or technology."
          action={
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Clear All Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {filteredProjects.map((project) => (
            <article
              key={project.id}
              data-testid={`project-card-${project.slug}`}
              className="flex flex-col justify-between rounded-lg border border-border-token bg-background p-6 transition-colors hover:border-foreground/30"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="accent">{project.category}</Badge>
                  <span className="font-mono text-xs text-muted-foreground">
                    {project.projectCompletionState}
                  </span>
                </div>
                <h2 className="type-card-heading mt-4 text-foreground">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="hover:underline"
                  >
                    {project.name}
                  </Link>
                </h2>
                <p className="type-body mt-2 text-secondary-foreground">
                  {project.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => (
                    <Badge key={tech} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border-token pt-4 text-sm">
                <Link
                  href={`/projects/${project.slug}`}
                  className="inline-flex items-center gap-1 font-medium text-foreground hover:text-accent"
                >
                  <span>Read Case Study</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>

                <div className="flex items-center gap-3">
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.name} GitHub repository`}
                      className="text-secondary-foreground hover:text-foreground"
                    >
                      <Github className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                  {project.liveDemoUrl && (
                    <a
                      href={project.liveDemoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${project.name} live demo`}
                      className="text-secondary-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
