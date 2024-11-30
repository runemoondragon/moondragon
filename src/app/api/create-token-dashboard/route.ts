import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { generateDashboardContent } from '@/lib/templates/generateDashboard';

export async function POST(request: Request) {
  try {
    const { tokenName } = await request.json();
    
    // Create a URL-friendly version of the token name
    const dashboardName = tokenName.toLowerCase().replace(/[•]/g, '-');
    
    // Generate the dashboard content
    const dashboardContent = generateDashboardContent(tokenName);
    
    // Create the new dashboard file
    const dashboardDir = path.join(process.cwd(), `src/app/dashboards/${dashboardName}`);
    const dashboardPath = path.join(dashboardDir, 'page.tsx');
    
    // Create directory if it doesn't exist
    await fs.mkdir(dashboardDir, { recursive: true });
    
    // Write the new dashboard file
    await fs.writeFile(dashboardPath, dashboardContent);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard' },
      { status: 500 }
    );
  }
} 