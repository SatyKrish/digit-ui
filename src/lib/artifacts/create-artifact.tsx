import type { ComponentType, Dispatch, ReactNode, SetStateAction } from 'react';
import type { 
  ArtifactKind, 
  UIArtifact, 
  StreamPart, 
  ArtifactContent,
  ArtifactActionContext,
  ArtifactToolbarContext,
  ArtifactToolbarAction
} from './types';

export type ArtifactAction<M = any> = {
  icon: ReactNode;
  label?: string;
  description: string;
  onClick: (context: ArtifactActionContext<M> & ArtifactToolbarContext) => Promise<void> | void;
  isDisabled?: (context: ArtifactActionContext<M>) => boolean;
};

export type InitializeParameters = {
  documentId: string;
  setMetadata: Dispatch<SetStateAction<any>>;
};

export interface ArtifactConfig<T extends string, M = any> {
  kind: T;
  description: string;
  content: ComponentType<ArtifactContent<M>>;
  actions?: Array<ArtifactAction<M>>;
  toolbar?: Array<ArtifactToolbarAction>;
  initialize?: (parameters: InitializeParameters) => Promise<void> | void;
  onStreamPart: (args: {
    setMetadata: Dispatch<SetStateAction<M>>;
    setArtifact: Dispatch<SetStateAction<UIArtifact>>;
    streamPart: StreamPart;
  }) => void;
}

/**
 * Artifact class following the official Vercel AI Chatbot pattern
 * This allows for extensible artifact types with custom streaming and UI behavior
 */
export class Artifact<T extends string, M = any> {
  readonly kind: T;
  readonly description: string;
  readonly content: ComponentType<ArtifactContent<M>>;
  readonly actions: Array<ArtifactAction<M>>;
  readonly toolbar: Array<ArtifactToolbarAction>;
  readonly initialize?: (parameters: InitializeParameters) => Promise<void> | void;
  readonly onStreamPart: (args: {
    setMetadata: Dispatch<SetStateAction<M>>;
    setArtifact: Dispatch<SetStateAction<UIArtifact>>;
    streamPart: StreamPart;
  }) => void;

  constructor(config: ArtifactConfig<T, M>) {
    this.kind = config.kind;
    this.description = config.description;
    this.content = config.content;
    this.actions = config.actions || [];
    this.toolbar = config.toolbar || [];
    this.initialize = config.initialize;
    this.onStreamPart = config.onStreamPart;
  }
}

// Helper function to create artifact instances
export function createArtifact<T extends ArtifactKind, M = any>(
  config: ArtifactConfig<T, M>
): Artifact<T, M> {
  return new Artifact(config);
}
