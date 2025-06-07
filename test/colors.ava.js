import {PUNCTUATION, TEXT, color, xmlEscape} from '../lib/colors.js';
import test from 'ava';

test('colors', t => {
  t.is(color('foo', 'fofoooffooo'), 'foo');
  t.is(color('foo', 'fofoooffooo', {colors: true}), 'foo');
  t.is(color('<a', PUNCTUATION, {colors: true, html: true}), "<span style='font-weight:bold'>&lt;a</span>");
  t.is(color('.', TEXT, {colors: true, html: true}), "<span style='color:magenta'>.</span>");
  t.is(color('.', 'fofoooffooo', {colors: true, html: true}), '.');
});

test('xmlEscape', t => {
  t.is(xmlEscape('\'"', true), '&apos;&quot;');
});
