import fs from 'fs/promises';
import path from 'path';

async function initializeDataFiles() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });

    // Set current time and 1 hour from now
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

    // Initialize questions file with current timestamps
    const questionsData = {
      questions: [
        {
          id: "q1",
          question: "Do you like RUNE?",
          startTime: now.toISOString(),
          endTime: oneHourLater.toISOString(),
          createdBy: "bc1pcl39n752txp0p2w5aywvxdfwxsgvgrxken3twrnvlu7gzgd6cqeqmvzcf6",
          minimumTokensRequired: 400000
        }
      ],
      activeQuestionId: "q1"
    };

    // Write files
    await fs.writeFile(
      path.join(dataDir, 'voting-questions.json'),
      JSON.stringify(questionsData, null, 2)
    );
    
    console.log('Questions file updated successfully');
    console.log('New question timing:', {
      start: now.toISOString(),
      end: oneHourLater.toISOString()
    });

  } catch (error) {
    console.error('Error updating data files:', error);
  }
}

// Run the initialization
initializeDataFiles(); 