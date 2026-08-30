import path from 'path';
import dotenv from 'dotenv';

// Load variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const GITLAB_URL = process.env.GITLAB_URL || 'https://git.poligon.crmgenesis.com';
const PROJECT_ID = process.env.GITLAB_PROJECT_ID;
const ACCESS_TOKEN = process.env.GITLAB_ACCESS_TOKEN;

/**
 * Creates an Issue in GitLab
 */
export async function createGitLabIssue(
  title: string,
  steps: string,
  severity: string = 'Medium',
  preconditions: string = '',
  expectedResult: string = '',
  comments: string = '',
  photoLink: string = ''
): Promise<any> {
  if (!PROJECT_ID || !ACCESS_TOKEN) {
    throw new Error('GITLAB_PROJECT_ID or GITLAB_ACCESS_TOKEN is not configured in .env file.');
  }

  // Format issue description in Markdown
  let description = `## Опис помилки\n${title}\n\n`;

  if (preconditions) {
    description += `### Передумови\n- **Посилання на сторінку:** ${preconditions}\n\n`;
  }

  description += `### Кроки для відтворення\n${steps}\n\n`;

  if (expectedResult) {
    description += `### Очікуваний результат\n${expectedResult}\n\n`;
  }

  if (photoLink) {
    description += `### Скриншот\n- [Скриншот Screencast](${photoLink})\n\n`;
  }

  if (comments) {
    description += `### Коментарі / Нотатки\n${comments}\n`;
  }

  const url = `${GITLAB_URL}/api/v4/projects/${PROJECT_ID}/issues`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'PRIVATE-TOKEN': ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `[Bug] ${title}`,
      description,
      labels: `Bug, ${severity} Priority`,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GitLab API error (${response.status}): ${errText}`);
  }

  const data = await response.json() as any;
  console.log(`Successfully created issue in GitLab! URL: ${data.web_url}`);
  return data;
}
