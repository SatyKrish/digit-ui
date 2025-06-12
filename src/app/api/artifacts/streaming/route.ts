import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createStreamingArtifact, updateStreamingArtifact } from '@/app/actions/artifacts';

/**
 * POST /api/artifacts/streaming
 * 
 * Creates a new artifact with streaming UI updates
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kind, title, description } = body;

    // Validate required fields
    if (!kind || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: kind and title' },
        { status: 400 }
      );
    }

    // Generate a unique ID for the artifact
    const artifactId = nanoid();

    // Create the artifact using server action
    const result = await createStreamingArtifact({
      kind,
      title
    });

    return NextResponse.json({
      success: true,
      artifactId,
      message: 'Artifact creation started',
      streamingUI: result
    });

  } catch (error) {
    console.error('Error in streaming artifact creation:', error);
    return NextResponse.json(
      { error: 'Failed to create artifact' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/artifacts/streaming/:id
 * 
 * Updates an existing artifact with streaming UI updates
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { document, description } = body;

    // Validate required fields
    if (!document || !document.id) {
      return NextResponse.json(
        { error: 'Missing required field: document with id' },
        { status: 400 }
      );
    }

    // Update the artifact using server action
    const result = await updateStreamingArtifact(
      document.id,
      description || 'Updated artifact',
      document
    );

    return NextResponse.json({
      success: true,
      artifactId: document.id,
      message: 'Artifact update started',
      streamingUI: result
    });

  } catch (error) {
    console.error('Error in streaming artifact update:', error);
    return NextResponse.json(
      { error: 'Failed to update artifact' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/artifacts/streaming/status/:id
 * 
 * Gets the current status of a streaming artifact operation
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const artifactId = url.pathname.split('/').pop();

    if (!artifactId) {
      return NextResponse.json(
        { error: 'Missing artifact ID' },
        { status: 400 }
      );
    }

    // In a real implementation, you would check the status from your database
    // For now, we'll return a simple status
    return NextResponse.json({
      artifactId,
      status: 'completed',
      message: 'Artifact operation completed'
    });

  } catch (error) {
    console.error('Error getting artifact status:', error);
    return NextResponse.json(
      { error: 'Failed to get artifact status' },
      { status: 500 }
    );
  }
}
