// Vercel serverless entry: every /api/* request is rewritten here (see vercel.json) and handled by the Express app.
import { app, finishApp } from '../server/app.ts';

export default finishApp(app);
