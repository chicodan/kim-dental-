/**
 * Weekly Blog Post Generator for Kim Dental
 *
 * Picks the next unused topic from topics.json, calls the Anthropic API
 * to write the post, and saves it as a markdown file in src/content/blog/.
 *
 * Run: node scripts/generate-blog-post.mjs
 * Requires: ANTHROPIC_API_KEY environment variable
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌  ANTHROPIC_API_KEY environment variable is not set.');
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── helpers ──────────────────────────────────────────────────────────────────

async function getUsedSlugs() {
  const files = await fs.readdir(BLOG_DIR);
  return new Set(files.map((f) => f.replace(/\.md$/, '')));
}

function todayISODate() {
  return new Date().toISOString().split('T')[0];
}

function buildDescription(bodyMarkdown) {
  // Pull the first non-empty, non-heading sentence as the SEO description
  const lines = bodyMarkdown.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
  const firstPara = lines[0] ?? '';
  const sentence = firstPara.split('.')[0].replace(/\*\*/g, '').trim() + '.';
  return sentence.length > 160 ? sentence.slice(0, 157) + '...' : sentence;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Load topic list
  const topicsRaw = await fs.readFile(path.join(__dirname, 'topics.json'), 'utf8');
  const topics = JSON.parse(topicsRaw);

  // Find the first topic that hasn't been written yet
  const usedSlugs = await getUsedSlugs();
  const nextTopic = topics.find((t) => !usedSlugs.has(t.slug));

  if (!nextTopic) {
    console.log('✅  All topics have been written! Add more to scripts/topics.json to continue.');
    process.exit(0);
  }

  console.log(`📝  Generating post: "${nextTopic.title}"`);

  // ── call Claude ────────────────────────────────────────────────────────────
  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    system: `You are a dental health content writer for Kim Dental, a private dental practice run by Dr. Soo B Kim, DDS in Paramus, New Jersey (Bergen County).
Your writing is warm, friendly, educational, and non-alarmist. You always write for a general patient audience, avoid heavy jargon, and relate topics to the local community where natural.`,
    messages: [
      {
        role: 'user',
        content: `Write a helpful dental health blog post about this topic: "${nextTopic.title}"

Requirements:
- 550–750 words
- Use ## for section headings (2–4 sections)
- Use **bold** to highlight key terms or important facts
- Include at least one practical tip or actionable advice the reader can use today
- Reference Bergen County or Paramus NJ once where it flows naturally
- End with a short call-to-action paragraph mentioning patients can call **(201) 599-1888** or **book online** to schedule at Kim Dental in Paramus
- Do NOT include the post title or any YAML frontmatter — start directly with the opening paragraph`,
      },
    ],
  });

  const body = response.content[0].text.trim();

  // ── assemble the markdown file ─────────────────────────────────────────────
  const description = buildDescription(body);
  const tagsJson = JSON.stringify(nextTopic.tags);
  const dateStr = todayISODate();

  const fileContent = `---
title: "${nextTopic.title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
pubDate: ${dateStr}
author: "Dr. Soo B Kim, DDS"
tags: ${tagsJson}
---

${body}
`;

  const destPath = path.join(BLOG_DIR, `${nextTopic.slug}.md`);
  await fs.writeFile(destPath, fileContent, 'utf8');

  console.log(`✅  Post saved to: src/content/blog/${nextTopic.slug}.md`);
  console.log(`    Date: ${dateStr}`);
  console.log(`    Tags: ${nextTopic.tags.join(', ')}`);
}

main().catch((err) => {
  console.error('❌  Error generating post:', err);
  process.exit(1);
});
