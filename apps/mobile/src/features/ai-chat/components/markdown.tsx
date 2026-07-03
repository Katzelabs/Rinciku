import { useMemo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/ui';
import { Fonts, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';

// Minimal, dependency-free markdown renderer for assistant replies. Covers the
// subset the model actually emits — paragraphs, `#`/`##`/`###` headings,
// ordered + unordered lists, and inline **bold** / *italic* / `code`. We render
// with the app's own `AppText` type scale + theme tokens instead of pulling a
// markdown library (which carries React 19 / Expo SDK 56 peer-dep risk under
// pnpm and wouldn't match the brand typography).

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'ol'; items: { marker: string; text: string }[] }
  | { kind: 'ul'; items: string[] }
  | { kind: 'p'; text: string };

const HEADING = /^(#{1,3})\s+(.*)$/;
const ORDERED = /^(\d+)\.\s+(.*)$/;
const UNORDERED = /^[-*]\s+(.*)$/;

// Split source text into block-level nodes. Blank lines separate paragraphs;
// runs of list lines coalesce into a single list block.
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
    const line = lines[i].trim();

    if (line === '') {
      flush();
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flush();
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }

    if (ORDERED.test(line)) {
      flush();
      const items: { marker: string; text: string }[] = [];
      let j = i;
      for (; j < lines.length; j++) {
        const m = ORDERED.exec(lines[j].trim());
        if (!m) break;
        items.push({ marker: `${m[1]}.`, text: m[2] });
      }
      blocks.push({ kind: 'ol', items });
      i = j - 1;
      continue;
    }

    if (UNORDERED.test(line)) {
      flush();
      const items: string[] = [];
      let j = i;
      for (; j < lines.length; j++) {
        const m = UNORDERED.exec(lines[j].trim());
        if (!m) break;
        items.push(m[1]);
      }
      blocks.push({ kind: 'ul', items });
      i = j - 1;
      continue;
    }

    paragraph.push(line);
  }
  flush();
  return blocks;
}

// Tokenize inline spans. `**bold**`/`__bold__` win over `*italic*`/`_italic_`
// (checked first in the alternation), and bold/italic recurse so nesting works.
const INLINE = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3|`([^`]+?)`/g;

function renderInline(
  text: string,
  codeBg: string,
  codeColor: string
): ReactNode[] {
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
          {renderInline(m[2], codeBg, codeColor)}
        </Text>
      );
    } else if (m[3] !== undefined) {
      nodes.push(
        <Text key={key++} style={styles.italic}>
          {renderInline(m[4], codeBg, codeColor)}
        </Text>
      );
    } else if (m[5] !== undefined) {
      nodes.push(
        <Text
          key={key++}
          style={[styles.code, { backgroundColor: codeBg, color: codeColor }]}
        >
          {` ${m[5]} `}
        </Text>
      );
    }
    last = regex.lastIndex;
  }
  if (last < text.length) nodes.push(<Text key={key}>{text.slice(last)}</Text>);
  return nodes;
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
  const codeBg = withAlpha(c.muted, 'AA');

  return (
    <View style={styles.container}>
      {blocks.map((block, i) => {
        if (block.kind === 'heading') {
          return (
            <AppText
              key={i}
              variant='heading'
              color={color}
              selectable
              style={i > 0 ? styles.headingSpaced : undefined}
            >
              {renderInline(block.text, codeBg, c.foreground)}
            </AppText>
          );
        }
        if (block.kind === 'ol') {
          return (
            <View key={i} style={styles.list}>
              {block.items.map((item, j) => (
                <View key={j} style={styles.listRow}>
                  <AppText variant='body' color={color} style={styles.orderedMarker}>
                    {item.marker}
                  </AppText>
                  <AppText variant='body' color={color} selectable style={styles.listText}>
                    {renderInline(item.text, codeBg, c.foreground)}
                  </AppText>
                </View>
              ))}
            </View>
          );
        }
        if (block.kind === 'ul') {
          return (
            <View key={i} style={styles.list}>
              {block.items.map((item, j) => (
                <View key={j} style={styles.listRow}>
                  <AppText variant='body' color={color} style={styles.bulletMarker}>
                    {'•'}
                  </AppText>
                  <AppText variant='body' color={color} selectable style={styles.listText}>
                    {renderInline(item, codeBg, c.foreground)}
                  </AppText>
                </View>
              ))}
            </View>
          );
        }
        return (
          <AppText key={i} variant='body' color={color} selectable>
            {renderInline(block.text, codeBg, c.foreground)}
          </AppText>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  headingSpaced: { marginTop: Spacing.one },
  list: { gap: Spacing.one },
  listRow: { flexDirection: 'row', gap: Spacing.two },
  orderedMarker: { fontFamily: Fonts.semibold, minWidth: 20 },
  bulletMarker: { minWidth: 14 },
  listText: { flex: 1 },
  bold: { fontFamily: Fonts.bold },
  italic: { fontStyle: 'italic' },
  code: { fontFamily: Fonts.mono, fontSize: 14 },
});
