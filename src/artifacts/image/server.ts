import type { DataStreamWriter } from 'ai';

export async function onCreateDocument({
  title,
  dataStream,
}: {
  title: string;
  dataStream: DataStreamWriter;
}) {
  // Generate a placeholder SVG image based on the title
  const svgContent = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#gradient)" rx="8"/>
      <rect x="20" y="20" width="360" height="260" fill="rgba(255,255,255,0.1)" rx="4"/>
      <text x="200" y="140" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="white" font-weight="500">
        Generated Image
      </text>
      <text x="200" y="170" text-anchor="middle" font-family="system-ui, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)">
        ${title}
      </text>
      <circle cx="200" cy="200" r="20" fill="rgba(255,255,255,0.2)"/>
      <rect x="180" y="190" width="40" height="20" fill="rgba(255,255,255,0.3)" rx="2"/>
    </svg>
  `;

  const base64Content = Buffer.from(svgContent.trim()).toString('base64');
  const dataUrl = `data:image/svg+xml;base64,${base64Content}`;
  
  dataStream.writeData({
    type: 'image-delta',
    content: dataUrl,
  });

  dataStream.writeData({
    type: 'metadata-update',
    metadata: {
      format: 'svg',
      width: 400,
      height: 300,
      title,
      generated: true,
    },
  });

  return dataUrl;
}

export async function onUpdateDocument({
  document,
  description,
  dataStream,
}: {
  document: { content: string };
  description: string;
  dataStream: DataStreamWriter;
}) {
  // For image updates, we'll create a new placeholder with the update description
  const svgContent = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#gradient)" rx="8"/>
      <rect x="20" y="20" width="360" height="260" fill="rgba(255,255,255,0.1)" rx="4"/>
      <text x="200" y="130" text-anchor="middle" font-family="system-ui, sans-serif" font-size="16" fill="white" font-weight="500">
        Updated Image
      </text>
      <text x="200" y="160" text-anchor="middle" font-family="system-ui, sans-serif" font-size="12" fill="rgba(255,255,255,0.8)">
        ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}
      </text>
      <text x="200" y="180" text-anchor="middle" font-family="system-ui, sans-serif" font-size="10" fill="rgba(255,255,255,0.6)">
        ${new Date().toLocaleDateString()}
      </text>
      <polygon points="200,190 210,210 190,210" fill="rgba(255,255,255,0.3)"/>
    </svg>
  `;

  const base64Content = Buffer.from(svgContent.trim()).toString('base64');
  const dataUrl = `data:image/svg+xml;base64,${base64Content}`;
  
  dataStream.writeData({
    type: 'image-delta',
    content: dataUrl,
  });

  dataStream.writeData({
    type: 'metadata-update',
    metadata: {
      format: 'svg',
      width: 400,
      height: 300,
      description,
      updated: new Date().toISOString(),
      generated: true,
    },
  });

  return dataUrl;
}
