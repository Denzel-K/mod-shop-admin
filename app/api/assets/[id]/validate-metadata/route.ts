import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Asset from '@/models/Asset';
import type { MetadataCategory } from '@/models/Asset';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const contentLength = req.headers.get('content-length');
    if (!contentLength || contentLength === '0') {
      return NextResponse.json({ message: 'Empty request body' }, { status: 400 });
    }

    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { category, validated } = body as { category: MetadataCategory; validated: boolean };

    if (!category || typeof validated !== 'boolean') {
      return NextResponse.json(
        { message: 'Invalid request: category and validated fields required' },
        { status: 400 }
      );
    }

    // Valid categories
    const validCategories: MetadataCategory[] = [
      'wrappableSurfaces',
      'rims',
      'windows',
      'doors',
      'tyres',
      'interior',
      'lights',
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { message: `Invalid category: ${category}` },
        { status: 400 }
      );
    }

    // Update the specific category validation
    const updatePath = `progress.metadataValidation.${category}`;
    const asset = await Asset.findByIdAndUpdate(
      id,
      { $set: { [updatePath]: validated } },
      { new: true, runValidators: true }
    ).select('progress.metadataValidation');

    if (!asset) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Metadata validation updated successfully',
      metadataValidation: asset.progress?.metadataValidation || {},
    });
  } catch (error) {
    console.error('Error updating metadata validation:', error);
    return NextResponse.json(
      { message: 'Failed to update metadata validation' },
      { status: 500 }
    );
  }
}
