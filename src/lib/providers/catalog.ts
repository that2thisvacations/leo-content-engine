import type { ProviderSlot } from "@/lib/providers/contracts";

export const providerSlots = [
  {
    capability: "content-intelligence",
    label: "Content intelligence",
    description: "Research and structured writing adapter",
  },
  {
    capability: "media-generation",
    label: "Media generation",
    description: "Image, animation, voice, and assembly adapters",
  },
  {
    capability: "workflow-orchestration",
    label: "Workflow orchestration",
    description: "Durable production job adapter",
  },
  {
    capability: "content-store",
    label: "Data persistence",
    description: "Repository and object storage adapters",
  },
  {
    capability: "channel-publishing",
    label: "Channel publishing",
    description: "Approved release destination adapters",
  },
] as const satisfies readonly ProviderSlot[];
