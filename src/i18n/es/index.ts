// The es catalog: every namespace of src/i18n/en, translated (see docs/TRANSLATING.md). Loaded on demand.
import type { Catalog } from '../core.ts';
import common from './common.ts';
import nav from './nav.ts';
import app from './app.ts';
import home from './home.ts';
import courses from './courses.ts';
import course from './course.ts';
import quiz from './quiz.ts';
import lesson from './lesson.ts';
import review from './review.ts';
import practice from './practice.ts';
import games from './games.ts';
import sims from './sims.ts';
import map from './map.ts';
import insights from './insights.ts';
import thinking from './thinking.ts';
import roadmap from './roadmap.ts';
import profile from './profile.ts';
import auth from './auth.ts';
import cert from './cert.ts';
import email from './email.ts';
import content from './content.ts';
import api from './api.ts';

const catalog: Catalog = {
  ...common,
  ...nav,
  ...app,
  ...home,
  ...courses,
  ...course,
  ...quiz,
  ...lesson,
  ...review,
  ...practice,
  ...games,
  ...sims,
  ...map,
  ...insights,
  ...thinking,
  ...roadmap,
  ...profile,
  ...auth,
  ...cert,
  ...email,
  ...content,
  ...api,
};

export default catalog;
