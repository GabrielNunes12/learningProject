// English UI strings: app. The app shell (src/App.tsx). English is the source of truth; translations mirror
// these keys (see docs/TRANSLATING.md).
import type { Message } from '../core.ts';

export default {
  // Red banner shown above the page when a course file is malformed (mostly seen by course authors).
  'app.contentErrors': 'Some course files have problems and were skipped:',
  'app.notFound': 'Page not found',
  'app.notFoundLead': "That link doesn't lead anywhere.",
} satisfies Record<string, Message>;
