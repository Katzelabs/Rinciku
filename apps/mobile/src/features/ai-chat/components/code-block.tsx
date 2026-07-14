import { createLowlight } from 'lowlight';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

// Explicit grammar list, NOT lowlight's `common`. `common` registers 37
// grammars (~1.8MB of the RN bundle, all evaluated at module scope because
// Metro does not tree-shake), and auto-detect below walks every registered one.
// These are the languages an assistant reply in a finance app actually emits.
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

import { Fonts, Radius, Spacing, type CodeScope } from '@/constants/theme';
import { useCodeSyntax, useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import { CopyButton } from './copy-button';

const lowlight = createLowlight({
  bash,
  css,
  javascript,
  json,
  markdown,
  plaintext,
  python,
  sql,
  typescript,
  xml,
  yaml,
});

// Auto-detection walks every registered grammar, so skip it for very long
// blocks — they still render, just without highlighting.
const AUTO_DETECT_LIMIT = 4000;

type Span = { text: string; scope?: CodeScope };

// highlight.js scope (its span class, minus the `hljs-` prefix and any trailing
// `_` sublanguage marker) → our palette key. Unmapped scopes render as plain ink.
function scopeToKey(scope: string): CodeScope | undefined {
  switch (scope) {
    case 'comment':
    case 'quote':
      return 'comment';
    case 'keyword':
    case 'literal':
    case 'selector-tag':
    case 'name':
    case 'tag':
      return 'keyword';
    case 'string':
    case 'regexp':
    case 'symbol':
    case 'char':
      return 'string';
    case 'number':
      return 'number';
    case 'title':
    case 'function':
    case 'section':
    case 'selector-id':
    case 'selector-class':
      return 'title';
    case 'type':
    case 'class':
    case 'built_in':
      return 'type';
    case 'attr':
    case 'attribute':
    case 'property':
    case 'variable':
    case 'params':
      return 'attr';
    case 'meta':
    case 'doctag':
      return 'meta';
    default:
      return undefined;
  }
}

type HastNode = {
  type?: string;
  value?: string;
  properties?: { className?: string[] };
  children?: HastNode[];
};

// Flatten a hast tree into a flat list of colored spans. The deepest hljs class
// on the path wins (a keyword inside a function keeps the keyword color).
function collect(node: HastNode, scope: CodeScope | undefined, out: Span[]) {
  if (node.type === 'text') {
    if (node.value) out.push({ text: node.value, scope });
    return;
  }
  if (node.type === 'element') {
    const classes = node.properties?.className;
    let next = scope;
    if (Array.isArray(classes) && classes.length > 0) {
      const raw = String(classes[classes.length - 1])
        .replace(/^hljs-/, '')
        .replace(/_$/, '');
      next = scopeToKey(raw) ?? scope;
    }
    node.children?.forEach((child) => collect(child, next, out));
  }
}

function tokenize(code: string, lang: string): Span[] {
  try {
    const tree =
      lang && lowlight.registered(lang)
        ? lowlight.highlight(lang, code)
        : code.length <= AUTO_DETECT_LIMIT
          ? lowlight.highlightAuto(code)
          : null;
    if (!tree) return [{ text: code }];
    const out: Span[] = [];
    (tree.children as HastNode[]).forEach((child) =>
      collect(child, undefined, out)
    );
    return out.length > 0 ? out : [{ text: code }];
  } catch {
    return [{ text: code }];
  }
}

// A fenced code block: syntax-highlighted (highlight.js via lowlight, mapped to
// the brand syntax palette), horizontally scrollable, with the language label
// and a copy-to-clipboard button in the header. The code text stays `selectable`
// so a snippet can also be hand-selected.
export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const c = useTheme();
  const syntax = useCodeSyntax();
  const spans = useMemo(() => tokenize(code, lang), [code, lang]);

  return (
    <View
      style={[
        styles.block,
        { backgroundColor: withAlpha(c.muted, 'AA'), borderColor: c.border },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.lang, { color: c.mutedForeground }]}>
          {lang || 'code'}
        </Text>
        <CopyButton value={code} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text selectable style={[styles.code, { color: c.foreground }]}>
          {spans.map((span, i) => (
            <Text
              key={i}
              style={span.scope ? { color: syntax[span.scope] } : undefined}
            >
              {span.text}
            </Text>
          ))}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.two,
    gap: Spacing.one,
    marginVertical: Spacing.half,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lang: {
    fontFamily: Fonts.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  code: { fontFamily: Fonts.mono, fontSize: 13, lineHeight: 19 },
});
