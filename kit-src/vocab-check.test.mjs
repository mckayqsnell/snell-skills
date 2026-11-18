// Tests for vocab-check.mjs: the engineer word list, the reader switch, hover-term cards,
// acronyms and the CODETOKEN passive fix.   node --test kit-src/vocab-check.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { score, prepare, pullCards } from './vocab-check.mjs';

const page = (body, head = '') => `<html><head>${head}</head><body><main>${body}</main></body></html>`;

test('engineer reader counts everyday software words as common', () => {
  const html = page('<p>The customer opens the app and files a ticket by email.</p>');
  const eng = score(html, { reader: 'engineer' }), gen = score(html, { reader: 'general' });
  assert.equal(eng.reader, 'engineer');
  assert.ok(!eng.detail.hard.includes('ticket'), 'ticket is common for an engineer');
  assert.ok(gen.detail.hard.includes('ticket'), 'ticket is hard for a general reader');
});

test('the vocab-reader meta works with name and content in either order', () => {
  const body = '<p>The customer files a ticket.</p>';
  assert.equal(score(page(body, '<meta name="vocab-reader" content="general">')).reader, 'general');
  assert.equal(score(page(body, '<meta content="general" name="vocab-reader">')).reader, 'general');
});

test('a card with a span inside is pulled out whole', () => {
  const cards = [];
  const out = pullCards('<abbr class="term">TTL<span class="term-def">How long a <span class="x">copy</span> stays.</span></abbr> after', cards);
  assert.equal(cards.length, 1);
  assert.match(cards[0], /copy<\/span> stays\.$/);
  assert.equal(out.replace(/\s+/g, ' ').trim(), '<abbr class="term">TTL </abbr> after');
});

test('a span.term with a card glosses only the word, not the card', () => {
  const { glossed } = prepare(page('<p>Writes need a <span class="term">quorum<span class="term-def">Most of the nodes agree.</span></span>.</p>'));
  assert.ok(glossed.has('quorum'));
  assert.ok(!glossed.has('nodes'), 'card words gloss nothing');
});

test('acronyms not every engineer knows are listed until spelled out', () => {
  const bare = score(page('<p>The API checks the JWT on every call.</p>'));
  assert.deepEqual(bare.detail.acronyms, ['JWT']);
  const spelled = score(page('<p>The API checks the <abbr class="term">JWT<span class="term-def"><b>JSON Web Token.</b> A signed login pass.</span></abbr> on every call.</p>'));
  assert.deepEqual(spelled.detail.acronyms, []);
});

test('"is <code>…</code>" is not passive voice', () => {
  const res = score(page('<p>The default is <code>30</code> seconds.</p><p>The file was written by the build.</p>'));
  assert.equal(res.detail.passiveSents.length, 1);
  assert.match(res.detail.passiveSents[0], /written/);
});
