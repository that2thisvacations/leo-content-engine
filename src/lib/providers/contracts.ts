export type ProviderCapability =
  | "content-intelligence"
  | "media-generation"
  | "workflow-orchestration"
  | "content-store"
  | "channel-publishing";

export type ProviderSlot = {
  capability: ProviderCapability;
  label: string;
  description: string;
};

export type ProviderHealth = {
  configured: boolean;
  status: "available" | "degraded" | "unavailable" | "not-configured";
};

export interface ProviderAdapter {
  readonly capability: ProviderCapability;
  health(): Promise<ProviderHealth>;
}

export interface ContentStore<TRecord extends { id: string }> extends ProviderAdapter {
  findById(id: string): Promise<TRecord | null>;
  save(record: TRecord): Promise<TRecord>;
}

export interface ContentIntelligenceProvider extends ProviderAdapter {
  generateStructuredContent<TOutput>(prompt: string): Promise<TOutput>;
}

export interface MediaGenerationProvider extends ProviderAdapter {
  createAsset(request: unknown): Promise<{ assetId: string }>;
}

export interface WorkflowProvider extends ProviderAdapter {
  enqueue(job: { type: string; payload: unknown }): Promise<{ jobId: string }>;
}

export interface PublishingProvider extends ProviderAdapter {
  publish(request: unknown): Promise<{ externalId: string; url?: string }>;
}
