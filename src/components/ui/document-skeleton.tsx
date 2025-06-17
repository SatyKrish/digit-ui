"use client"

import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

type ArtifactKind = "text" | "code" | "chart" | "visualization" | "document" | "image" | "sheet"

interface DocumentSkeletonProps {
  artifactKind: ArtifactKind
  className?: string
}

export function DocumentSkeleton({ artifactKind, className }: DocumentSkeletonProps) {
  const getSkeletonContent = () => {
    switch (artifactKind) {
      case 'text':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        )
      
      case 'code':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-32 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-5/6" />
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        )
      
      case 'image':
        return (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        )
      
      case 'sheet':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="grid grid-cols-4 gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        )
      
      case 'chart':
      case 'visualization':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        )
      
      case 'document':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-32 w-full" />
          </div>
        )
    }
  }

  return (
    <div className={cn("animate-pulse p-6", className)}>
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      
      {getSkeletonContent()}
      
      <div className="mt-6 flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

export default DocumentSkeleton
