import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { ArtifactDocument } from '@/lib/artifacts/types'

// Schema for document creation/update
const DocumentSchema = z.object({
  title: z.string(),
  content: z.string(),
  kind: z.enum(['text', 'code', 'chart', 'visualization', 'document', 'image', 'sheet']),
  metadata: z.object({
    language: z.string().optional(),
    description: z.string().optional(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  }).optional()
})

// In-memory storage for development (replace with database in production)
const documents = new Map<string, ArtifactDocument[]>()

/**
 * GET /api/document?id={documentId}
 * 
 * Retrieves document versions by ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    const documentVersions = documents.get(documentId) || []
    
    return NextResponse.json(documentVersions, { status: 200 })
    
  } catch (error) {
    console.error('Error retrieving document:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve document' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/document?id={documentId}
 * 
 * Creates a new document version
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = DocumentSchema.parse(body)
    
    // Get existing versions or create new array
    const existingVersions = documents.get(documentId) || []
    
    // Create new document version
    const newDocument: ArtifactDocument = {
      id: documentId,
      kind: validatedData.kind,
      title: validatedData.title,
      content: validatedData.content,
      metadata: {
        title: validatedData.title,
        description: validatedData.metadata?.description,
        language: validatedData.metadata?.language,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      status: 'completed'
    }
    
    // Add to versions
    const updatedVersions = [...existingVersions, newDocument]
    documents.set(documentId, updatedVersions)
    
    return NextResponse.json(newDocument, { status: 201 })
    
  } catch (error) {
    console.error('Error creating document:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid document data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/document/{id}
 * 
 * Updates an existing document (creates new version)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    const validatedData = DocumentSchema.partial().parse(updateData)
    
    // Get existing versions
    const existingVersions = documents.get(id) || []
    const latestVersion = existingVersions[existingVersions.length - 1]
    
    if (!latestVersion) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    // Create updated version
    const updatedDocument: ArtifactDocument = {
      ...latestVersion,
      ...validatedData,
      metadata: {
        ...latestVersion.metadata,
        title: validatedData.title || latestVersion.title,
        ...(validatedData.metadata && {
          description: validatedData.metadata.description,
          language: validatedData.metadata.language,
        }),
        updatedAt: new Date(),
      }
    }
    
    // Add to versions
    const updatedVersions = [...existingVersions, updatedDocument]
    documents.set(id, updatedVersions)
    
    return NextResponse.json(updatedDocument, { status: 200 })
    
  } catch (error) {
    console.error('Error updating document:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid document data', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/document/{id}
 * 
 * Deletes a document and all its versions
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    const existed = documents.has(documentId)
    documents.delete(documentId)
    
    if (!existed) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true }, { status: 200 })
    
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
