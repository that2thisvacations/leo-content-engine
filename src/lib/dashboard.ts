export type DashboardArea = {
  id: string;
  label: string;
  description: string;
  stage: string;
  initialState: string;
};

export const dashboardAreas = [
  {
    id: "episodes",
    label: "Episodes",
    description: "Shape episode concepts, scripts, scenes, and production milestones.",
    stage: "Editorial workspace",
    initialState: "0 episodes",
  },
  {
    id: "destinations",
    label: "Destinations",
    description: "Organize the places, cultures, stories, and learning goals behind each trip.",
    stage: "Research library",
    initialState: "0 destinations",
  },
  {
    id: "production-queue",
    label: "Production Queue",
    description: "Track work from approved brief through script, media, and final assembly.",
    stage: "Workflow control",
    initialState: "Queue clear",
  },
  {
    id: "leo-assets",
    label: "LEO Assets",
    description: "Keep approved characters, scenes, audio, and brand materials organized.",
    stage: "Asset library",
    initialState: "Library ready",
  },
  {
    id: "reviews",
    label: "Reviews / Approval",
    description: "Give editors and stakeholders a clear, governed review checkpoint.",
    stage: "Quality control",
    initialState: "0 pending",
  },
  {
    id: "publishing",
    label: "Publishing",
    description: "Prepare approved content for release without connecting channels yet.",
    stage: "Distribution",
    initialState: "Adapter pending",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Reserve a focused view for audience, content, and production performance.",
    stage: "Insights",
    initialState: "No data yet",
  },
  {
    id: "settings",
    label: "Settings",
    description: "Manage future workspace policies, team access, and provider configuration.",
    stage: "Administration",
    initialState: "Defaults active",
  },
] as const satisfies readonly DashboardArea[];

export const dashboardMetrics = [
  { label: "Active episodes", value: "0" },
  { label: "In production", value: "0" },
  { label: "Awaiting review", value: "0" },
  { label: "Published", value: "0" },
] as const;
