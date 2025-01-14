import fs from 'fs';
import path from 'path';
import { generateDashboardContent } from '../lib/templates/generateDashboard';

async function generateDashboards() {
  try {
    // Read dynamic-tokens.json
    const tokensPath = path.join(process.cwd(), 'data', 'dynamic-tokens.json');
    const tokensData = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
    
    // Create dashboards directory if it doesn't exist
    const dashboardsDir = path.join(process.cwd(), 'src/app/dashboards');
    if (!fs.existsSync(dashboardsDir)) {
      fs.mkdirSync(dashboardsDir, { recursive: true });
    }

    // Generate dashboard for each token
    for (const token of tokensData) {
      const tokenDirName = token.name.toLowerCase().replace(/•/g, '-');
      const tokenDir = path.join(dashboardsDir, tokenDirName);
      
      // Skip moon-dragon dashboard
      if (tokenDirName === 'moon-dragon') {
        console.log('Skipping MOON DRAGON dashboard (custom implementation)');
        continue;
      }

      // Create token directory if it doesn't exist
      if (!fs.existsSync(tokenDir)) {
        fs.mkdirSync(tokenDir, { recursive: true });
      }

      // Generate dashboard content
      const content = generateDashboardContent(token.name);
      
      // Write dashboard file
      const filePath = path.join(tokenDir, 'page.tsx');
      fs.writeFileSync(filePath, content);
      
      console.log(`Generated dashboard for ${token.name}`);
    }

    console.log('Dashboard generation completed successfully!');
  } catch (error) {
    console.error('Error generating dashboards:', error);
    process.exit(1);
  }
}

generateDashboards(); 