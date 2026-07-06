import { useMemo, type ReactNode } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppText, Divider } from '@/components/ui';
import { Fonts, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

// Minimal, dependency-free markdown renderer for assistant replies. Covers the
// full set the model actually emits — paragraphs, `#`..`###` headings, ordered +
// unordered (and nested) lists, fenced code blocks, blockquotes, horizontal
// rules, pipe tables, and inline **bold** / *italic* / ~~strike~~ / `code` /
// [links](url). We render with the app's own `AppText` type scale + theme tokens
// instead of pulling a markdown library (which carries React 19 / Expo SDK 56
// peer-dep risk under pnpm and wouldn't match the brand typography).

type ListItem = { ordered: boolean; marker: string; text: string; level: number };
type TableCell = { text: string; align: 'left' | 'center' | 'right' };

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'list'; items: ListItem[] }
  | { kind: 'code'; lang: string | null; code: string }
  | { kind: 'quote'; text: string }
  | { kind: 'hr' }
  | { kind: 'table'; header: TableCell[]; rows: string[][] }
  | { kind: 'p'; text: string };

const HEADING = /^(#{1,6})\s+(.*)$/;
const ORDERED = /^(\s*)(\d+)\.\s+(.*)$/;
const UNORDERED = /^(\s*)[-*]\s+(.*)$/;
const FENCE = /^```(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const HR = /^(-{3,}|\*{3,}|_{3,})$/;

// Two spaces (or a tab, normalized to two) of leading indent = one nesting level.
function indentLevel(spaces: string): number {
  return Math.min(Math.floor(spaces.replace(/\t/g, '  ').length / 2), 4);
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
}

// A `|---|:--:|` style separator row — every cell is dashes with optional colons.
function isTableSeparator(line: string): boolean {
  if (!line.includes('-')) return false;
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-+:?$/.test(cell));
}

function alignOf(cell: string): TableCell['align'] {
  const left = cell.startsWith(':');
  const right = cell.endsWith(':');
  if (left && right) return 'center';
  if (right) return 'right';
  return 'left';
}

// Split source text into block-level nodes. Blank lines separate paragraphs;
// runs of list / quote / table lines coalesce into a single block.
function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length) {
      blocks.push({ kind: 'p', text: paragraph.join(' ') });
      paragraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (line === '') {
      flush();
      continue;
    }

    // Fenced code block — parse first so its contents are never re-interpreted.
    const fence = FENCE.exec(line);
    if (fence) {
      flush();
      const lang = fence[1].trim();
      const body: string[] = [];
      let j = i + 1;
      for (; j < lines.length; j++) {
        if (FENCE.test(lines[j].trim())) break;
        body.push(lines[j]);
      }
      blocks.push({ kind: 'code', lang: lang || null, code: body.join('\n') });
      i = j; // skip the closing fence
      continue;
    }

    if (HR.test(line)) {
      flush();
      blocks.push({ kind: 'hr' });
      continue;
    }

    // Pipe table: a `|`-bearing header line immediately followed by a separator.
    if (
      line.includes('|') &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1].trim())
    ) {
      flush();
      const headerCells = splitTableRow(line);
      const aligns = splitTableRow(lines[i + 1].trim()).map(alignOf);
      const header: TableCell[] = headerCells.map((text, k) => ({
        text,
        align: aligns[k] ?? 'left',
      }));
      const rows: string[][] = [];
      let j = i + 2;
      for (; j < lines.length; j++) {
        if (!lines[j].includes('|') || lines[j].trim() === '') break;
        rows.push(splitTableRow(lines[j]));
      }
      blocks.push({ kind: 'table', header, rows });
      i = j - 1;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }

    const quote = QUOTE.exec(line);
    if (quote) {
      flush();
      const body: string[] = [quote[1]];
      let j = i + 1;
      for (; j < lines.length; j++) {
        const m = QUOTE.exec(lines[j].trim());
        if (!m) break;
        body.push(m[1]);
      }
      blocks.push({ kind: 'quote', text: body.join('\n') });
      i = j - 1;
      continue;
    }

    // Lists — coalesce consecutive ordered/unordered lines (mixed + nested).
    if (ORDERED.test(raw) || UNORDERED.test(raw)) {
      flush();
      const items: ListItem[] = [];
      let j = i;
      for (; j < lines.length; j++) {
        const o = ORDERED.exec(lines[j]);
        const u = UNORDERED.exec(lines[j]);
        if (o) {
          items.push({
            ordered: true,
            marker: `${o[2]}.`,
            text: o[3],
            level: indentLevel(o[1]),
          });
        } else if (u) {
          items.push({
            ordered: false,
            marker: '•',
            text: u[2],
            level: indentLevel(u[1]),
          });
        } else {
          break;
        }
      }
      blocks.push({ kind: 'list', items });
      i = j - 1;
      continue;
    }

    paragraph.push(line);
  }
  flush();
  return blocks;
}

type InlineOpts = { codeBg: string; codeColor: string; linkColor: string };

// Tokenize inline spans. `**bold**` wins over `*italic*` (checked first in the
// alternation); bold/italic/strike/link text recurse so nesting works.
const INLINE =
  /(\*\*|__)(.+?)\1|(~~)(.+?)\3|(\*|_)(.+?)\5|`([^`]+?)`|\[([^\]]+)\]\(([^)]+)\)/g;

function renderInline(text: string, opts: InlineOpts): ReactNode[] {
  const nodes: ReactNode[] = [];
  const regex = new RegExp(INLINE.source, 'g');
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(<Text key={key++}>{text.slice(last, m.index)}</Text>);

    if (m[1] !== undefined) {
      nodes.push(
        <Text key={key++} style={styles.bold}>
          {renderInline(m[2], opts)}
        </Text>
      );
    } else if (m[3] !== undefined) {
      nodes.push(
        <Text key={key++} style={styles.strike}>
          {renderInline(m[4], opts)}
        </Text>
      );
    } else if (m[5] !== undefined) {
      nodes.push(
        <Text key={key++} style={styles.italic}>
          {renderInline(m[6], opts)}
        </Text>
      );
    } else if (m[7] !== undefined) {
      nodes.push(
        <Text
          key={key++}
          style={[styles.code, { backgroundColor: opts.codeBg, color: opts.codeColor }]}
        >
          {` ${m[7]} `}
        </Text>
      );
    } else if (m[8] !== undefined) {
      const url = m[9];
      nodes.push(
        <Text
          key={key++}
          style={[styles.link, { color: opts.linkColor }]}
          onPress={() => Linking.openURL(url).catch(() => {})}
        >
          {renderInline(m[8], opts)}
        </Text>
      );
    }
    last = regex.lastIndex;
  }
  if (last < text.length) nodes.push(<Text key={key}>{text.slice(last)}</Text>);
  return nodes;
}

function headingVariant(level: number): 'title' | 'heading' | 'bodyMedium' {
  if (level <= 1) return 'title';
  if (level === 2) return 'heading';
  return 'bodyMedium';
}

export function Markdown({
  content,
  color = 'foreground',
}: {
  content: string;
  /** Theme token for the text color. Defaults to `foreground`. */
  color?: ThemeColor;
}) {
  const c = useTheme();
  const blocks = useMemo(() => parseBlocks(content), [content]);
  const inline: InlineOpts = {
    codeBg: withAlpha(c.muted, 'AA'),
    codeColor: c.foreground,
    linkColor: c.primary,
  };

  return (
    <View style={styles.container}>
      {blocks.map((block, i) => {
        if (block.kind === 'heading') {
          return (
            <AppText
              key={i}
              variant={headingVariant(block.level)}
              color={color}
              selectable
              style={[
                i > 0 ? styles.headingSpaced : undefined,
                block.level >= 3 ? styles.subHeading : undefined,
              ]}
            >
              {renderInline(block.text, inline)}
            </AppText>
          );
        }

        if (block.kind === 'code') {
          return (
            <View
              key={i}
              style={[
                styles.codeBlock,
                { backgroundColor: withAlpha(c.muted, 'AA'), borderColor: c.border },
              ]}
            >
              {block.lang ? (
                <AppText variant='overline' color='mutedForeground'>
                  {block.lang}
                </AppText>
              ) : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text selectable style={[styles.codeText, { color: c.foreground }]}>
                  {block.code}
                </Text>
              </ScrollView>
            </View>
          );
        }

        if (block.kind === 'quote') {
          return (
            <View key={i} style={[styles.quote, { borderLeftColor: c.primary }]}>
              <AppText variant='body' color='mutedForeground' selectable>
                {renderInline(block.text, inline)}
              </AppText>
            </View>
          );
        }

        if (block.kind === 'hr') {
          return (
            <View key={i} style={styles.hr}>
              <Divider />
            </View>
          );
        }

        if (block.kind === 'table') {
          return (
            <ScrollView
              key={i}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tableScroll}
            >
              <View style={[styles.table, { borderColor: c.border }]}>
                <View style={[styles.tableRow, { backgroundColor: withAlpha(c.muted, '66') }]}>
                  {block.header.map((cell, k) => (
                    <View key={k} style={[styles.tableCell, { borderColor: c.border }]}>
                      <AppText
                        variant='label'
                        color={color}
                        selectable
                        style={{ textAlign: cell.align }}
                      >
                        {renderInline(cell.text, inline)}
                      </AppText>
                    </View>
                  ))}
                </View>
                {block.rows.map((row, r) => (
                  <View
                    key={r}
                    style={[styles.tableRow, styles.tableBodyRow, { borderColor: c.border }]}
                  >
                    {block.header.map((cell, k) => (
                      <View key={k} style={[styles.tableCell, { borderColor: c.border }]}>
                        <AppText
                          variant='body'
                          color={color}
                          selectable
                          style={{ textAlign: cell.align }}
                        >
                          {renderInline(row[k] ?? '', inline)}
                        </AppText>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          );
        }

        if (block.kind === 'list') {
          return (
            <View key={i} style={styles.list}>
              {block.items.map((item, j) => (
                <View
                  key={j}
                  style={[styles.listRow, { paddingLeft: item.level * Spacing.four }]}
                >
                  <AppText
                    variant='body'
                    color={color}
                    style={item.ordered ? styles.orderedMarker : styles.bulletMarker}
                  >
                    {item.marker}
                  </AppText>
                  <AppText variant='body' color={color} selectable style={styles.listText}>
                    {renderInline(item.text, inline)}
                  </AppText>
                </View>
              ))}
            </View>
          );
        }

        return (
          <AppText key={i} variant='body' color={color} selectable>
            {renderInline(block.text, inline)}
          </AppText>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  headingSpaced: { marginTop: Spacing.two },
  subHeading: { fontFamily: Fonts.semibold },
  list: { gap: Spacing.one },
  listRow: { flexDirection: 'row', gap: Spacing.two },
  orderedMarker: { fontFamily: Fonts.semibold, minWidth: 20 },
  bulletMarker: { minWidth: 14 },
  listText: { flex: 1 },
  codeBlock: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: 'continuous',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  codeText: { fontFamily: Fonts.mono, fontSize: 13, lineHeight: 19 },
  quote: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.three,
    paddingVertical: Spacing.half,
  },
  hr: { marginVertical: Spacing.one },
  tableScroll: { flexGrow: 0 },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  tableRow: { flexDirection: 'row' },
  tableBodyRow: { borderTopWidth: StyleSheet.hairlineWidth },
  tableCell: {
    minWidth: 96,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  bold: { fontFamily: Fonts.bold },
  italic: { fontStyle: 'italic' },
  strike: { textDecorationLine: 'line-through' },
  link: { textDecorationLine: 'underline' },
  code: { fontFamily: Fonts.mono, fontSize: 14 },
});
