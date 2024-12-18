import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { UserPoints } from '@/types/points';

const pointsFile = path.join(process.cwd(), 'data', 'user-points.json');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');
    const token = searchParams.get('token');
    
    const data = await fs.readFile(pointsFile, 'utf-8');
    const points: UserPoints[] = JSON.parse(data);

    // Filter points by token first
    const tokenPoints = token 
      ? points.filter(p => p.token === token)
      : points;

    if (walletAddress) {
      // Get specific user points for this token
      const userPoints = tokenPoints.find(p => p.walletAddress === walletAddress) || {
        walletAddress,
        token,
        votingPoints: 0,
        pollingPoints: 0,
        totalPoints: 0
      };
      return NextResponse.json(userPoints);
    }

    // Return leaderboard for this token
    const rankedPoints = tokenPoints
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((point, index) => ({ ...point, rank: index + 1 }));

    return NextResponse.json(rankedPoints);
  } catch (error) {
    console.error('Error reading points:', error);
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { walletAddress, type, token } = await request.json();
    
    const data = await fs.readFile(pointsFile, 'utf-8');
    const points: UserPoints[] = JSON.parse(data);
    
    const userIndex = points.findIndex(p => p.walletAddress === walletAddress && p.token === token);
    
    if (userIndex >= 0) {
      if (type === 'voting') {
        points[userIndex].votingPoints += 1;
      } else if (type === 'polling') {
        points[userIndex].pollingPoints += 1;
      }
      points[userIndex].totalPoints = points[userIndex].votingPoints + points[userIndex].pollingPoints;
    } else {
      points.push({
        walletAddress,
        token,
        votingPoints: type === 'voting' ? 1 : 0,
        pollingPoints: type === 'polling' ? 1 : 0,
        totalPoints: 1
      });
    }

    const cleanedPoints = points.filter(p => p.token || p.walletAddress === "");

    await fs.writeFile(pointsFile, JSON.stringify(cleanedPoints, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating points:', error);
    return NextResponse.json({ error: 'Failed to update points' }, { status: 500 });
  }
}