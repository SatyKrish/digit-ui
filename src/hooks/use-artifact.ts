'use client';

import useSWR from 'swr';
import { UIArtifact } from '@/lib/artifacts/types';
import { useCallback, useMemo } from 'react';

export const initialArtifactData: UIArtifact = {
  documentId: 'init',
  content: '',
  kind: 'text',
  title: '',
  status: 'idle',
  isVisible: false,
  boundingBox: {
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  },
};

type Selector<T> = (state: UIArtifact) => T;

export function useArtifactSelector<Selected>(selector: Selector<Selected>) {
  const { data: artifact } = useSWR<UIArtifact>('ui-artifact', null, {
    fallbackData: initialArtifactData,
  });

  return useMemo(() => selector(artifact!), [artifact, selector]);
}

export function useArtifact() {
  const { data: artifact, mutate } = useSWR<UIArtifact>('ui-artifact', null, {
    fallbackData: initialArtifactData,
  });

  const setArtifact = useCallback(
    (updater: UIArtifact | ((current: UIArtifact) => UIArtifact)) => {
      mutate(
        (current) => {
          const newArtifact = typeof updater === 'function' ? updater(current!) : updater;
          return newArtifact;
        },
        { revalidate: false }
      );
    },
    [mutate]
  );

  const [metadata, setMetadata] = useSWR<any>('artifact-metadata', null, {
    fallbackData: {},
  })[0] ? useSWR<any>('artifact-metadata') : { data: {}, mutate: () => {} };

  const setMetadataState = useCallback(
    (updater: any | ((current: any) => any)) => {
      metadata.mutate(
        (current) => {
          const newMetadata = typeof updater === 'function' ? updater(current || {}) : updater;
          return newMetadata;
        },
        { revalidate: false }
      );
    },
    [metadata]
  );

  return {
    artifact: artifact!,
    setArtifact,
    metadata: metadata.data || {},
    setMetadata: setMetadataState,
  };
}
