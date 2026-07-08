import { useMemo } from 'react';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import RNMarkdown, {
  type ASTNode,
  type RenderRules,
} from 'react-native-markdown-display';

import { Fonts, Radius, Spacing, Type, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/lib/color';
import { CodeBlock } from './code-block';

// Assistant-reply markdown, rendered with `react-native-markdown-display`
// (markdown-it under the hood) so parsing is robust — GFM tables, nested lists,
// blockquotes, fenced code, inline emphasis. We keep the app's own look by
// mapping every node to the `Type` scale + theme tokens rather than the
// library's defaults, and override a few rules so:
//   • every text run is `selectable` (long-press to highlight a word/sentence),
//   • fenced code is syntax-highlighted with a copy button (see CodeBlock),
//   • tables scroll horizontally instead of blowing out the width,
//   • inline images use `expo-image` (never the bundled react-native-fit-image).

type ThemeColors = ReturnType<typeof useTheme>;

const HAIRLINE = StyleSheet.hairlineWidth;

// markdown-it puts the fence language (```ts) on `token.info`, which the AST
// conversion carries as `sourceInfo`. It's not in the shipped ASTNode type.
function fenceLang(node: ASTNode): string {
  const info = (node as ASTNode & { sourceInfo?: string }).sourceInfo;
  return typeof info === 'string' ? info.trim() : '';
}

function codeText(node: ASTNode): string {
  return typeof node.content === 'string' ? node.content.replace(/\n$/, '') : '';
}

// Rules that need custom rendering (everything else is styled via `makeStyles`).
function makeRules(c: ThemeColors): RenderRules {
  return {
    // Mark both the group wrapper AND the leaf text runs `selectable` so users
    // can long-press to highlight (and copy) any word or sentence. On the New
    // Architecture (Fabric) selection can be honored only on the leaf `<Text>`,
    // so we set it on both to be safe. Color/weight still cascade to the runs.
    textgroup: (node, children, _parent, styles) => (
      <Text key={node.key} style={styles.textgroup} selectable>
        {children}
      </Text>
    ),
    text: (node, _children, _parent, styles, inherited) => (
      <Text key={node.key} style={[inherited, styles.text]} selectable>
        {node.content}
      </Text>
    ),
    fence: (node) => (
      <CodeBlock key={node.key} code={codeText(node)} lang={fenceLang(node)} />
    ),
    code_block: (node) => (
      <CodeBlock key={node.key} code={codeText(node)} lang='' />
    ),
    // Tables scroll horizontally so wide columns never break the reading layout.
    table: (node, children) => (
      <ScrollView
        key={node.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={sx.tableScroll}
      >
        <View style={[sx.table, { borderColor: c.border }]}>{children}</View>
      </ScrollView>
    ),
    // Inline images via expo-image — bypasses the library's react-native-fit-image.
    image: (node) => {
      const uri = node.attributes?.src as string | undefined;
      if (!uri) return null;
      return (
        <Image
          key={node.key}
          source={{ uri }}
          style={sx.image}
          contentFit='contain'
          transition={150}
        />
      );
    },
  };
}

// Per-node styles mapped to the app's type scale + theme tokens. `mergeStyle`
// (on by default) merges these over the library defaults, and text-style props
// (color / fontFamily / fontSize) cascade down to the leaf Text nodes.
function makeStyles(c: ThemeColors, color: ThemeColor) {
  const ink = c[color];
  return StyleSheet.create({
    body: { ...Type.body, color: ink, gap: Spacing.two },
    heading1: { fontFamily: Fonts.bold, fontSize: 22, color: ink, marginTop: Spacing.one },
    heading2: { fontFamily: Fonts.semibold, fontSize: 17, color: ink, marginTop: Spacing.one },
    heading3: { fontFamily: Fonts.semibold, fontSize: 15, color: ink },
    heading4: { fontFamily: Fonts.semibold, fontSize: 15, color: ink },
    heading5: { fontFamily: Fonts.semibold, fontSize: 15, color: ink },
    heading6: { fontFamily: Fonts.semibold, fontSize: 15, color: ink },
    paragraph: { marginTop: 0, marginBottom: 0 },
    strong: { fontFamily: Fonts.bold },
    em: { fontStyle: 'italic' },
    s: { textDecorationLine: 'line-through' },
    link: { color: c.primary, textDecorationLine: 'underline' },
    blockquote: {
      backgroundColor: 'transparent',
      borderLeftColor: c.primary,
      borderLeftWidth: 3,
      marginLeft: 0,
      paddingLeft: Spacing.three,
      paddingRight: 0,
      paddingVertical: Spacing.half,
      color: c.mutedForeground,
    },
    list_item: { marginBottom: Spacing.one },
    bullet_list_icon: {
      color: ink,
      marginLeft: 0,
      marginRight: Spacing.two,
      lineHeight: 22,
    },
    ordered_list_icon: {
      color: ink,
      fontFamily: Fonts.semibold,
      marginLeft: 0,
      marginRight: Spacing.two,
      lineHeight: 22,
    },
    code_inline: {
      fontFamily: Fonts.mono,
      fontSize: 14,
      color: c.foreground,
      backgroundColor: withAlpha(c.muted, 'AA'),
      borderWidth: 0,
      borderRadius: Radius.sm,
      paddingHorizontal: Spacing.one,
      paddingVertical: 0,
    },
    hr: {
      backgroundColor: c.border,
      height: HAIRLINE,
      marginVertical: Spacing.one,
    },
    thead: { backgroundColor: withAlpha(c.muted, '66') },
    th: {
      minWidth: 96,
      padding: Spacing.two,
      color: ink,
      fontFamily: Fonts.medium,
      fontSize: 14,
      borderColor: c.border,
      borderRightWidth: HAIRLINE,
    },
    td: {
      minWidth: 96,
      padding: Spacing.two,
      color: ink,
      borderColor: c.border,
      borderRightWidth: HAIRLINE,
    },
    tr: {
      flexDirection: 'row',
      borderColor: c.border,
      borderBottomWidth: HAIRLINE,
    },
  });
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
  const styles = useMemo(() => makeStyles(c, color), [c, color]);
  const rules = useMemo(() => makeRules(c), [c]);

  return (
    <RNMarkdown style={styles} rules={rules}>
      {content}
    </RNMarkdown>
  );
}

const sx = StyleSheet.create({
  tableScroll: { flexGrow: 0 },
  table: {
    borderWidth: HAIRLINE,
    borderRadius: Radius.md,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  image: { width: '100%', height: 200, borderRadius: Radius.md },
});
