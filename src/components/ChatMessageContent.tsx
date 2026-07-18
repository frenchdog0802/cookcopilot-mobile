import React, { useMemo } from 'react';
import { StyleSheet, TextStyle } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface ChatMessageContentProps {
  content: string;
  className?: string;
  style?: TextStyle;
  /** When true, use light text for user bubbles. */
  isUser?: boolean;
}

/** Render GFM markdown (tables, headings, bold, lists) inside chat bubbles. */
export default function ChatMessageContent({
  content,
  style,
  isUser = false,
}: ChatMessageContentProps) {
  const textColor = isUser ? '#ffffff' : '#1f2937';
  const mutedBorder = isUser ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)';
  const headerBg = isUser ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.04)';

  const markdownStyles = useMemo(
    () =>
      StyleSheet.create({
        body: {
          color: textColor,
          fontSize: 15,
          lineHeight: 22,
          ...(style as object),
        },
        heading1: { color: textColor, fontSize: 17, fontWeight: '700', marginTop: 8, marginBottom: 4 },
        heading2: { color: textColor, fontSize: 16, fontWeight: '700', marginTop: 8, marginBottom: 4 },
        heading3: { color: textColor, fontSize: 15, fontWeight: '700', marginTop: 6, marginBottom: 4 },
        heading4: { color: textColor, fontSize: 15, fontWeight: '600', marginTop: 6, marginBottom: 2 },
        paragraph: { color: textColor, marginTop: 4, marginBottom: 4 },
        strong: { fontWeight: '700', color: textColor },
        em: { fontStyle: 'italic', color: textColor },
        bullet_list: { marginVertical: 4 },
        ordered_list: { marginVertical: 4 },
        list_item: { color: textColor, marginVertical: 1 },
        hr: { backgroundColor: mutedBorder, height: 1, marginVertical: 10 },
        code_inline: {
          backgroundColor: isUser ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)',
          color: textColor,
          borderRadius: 4,
          paddingHorizontal: 4,
          fontSize: 13,
        },
        fence: {
          backgroundColor: isUser ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.05)',
          color: textColor,
          borderRadius: 8,
          padding: 8,
          marginVertical: 6,
          fontSize: 12,
        },
        blockquote: {
          borderLeftColor: mutedBorder,
          borderLeftWidth: 3,
          paddingLeft: 10,
          opacity: 0.9,
        },
        table: {
          borderWidth: 1,
          borderColor: mutedBorder,
          borderRadius: 8,
          marginVertical: 8,
        },
        thead: {
          backgroundColor: headerBg,
        },
        th: {
          padding: 8,
          borderColor: mutedBorder,
          borderWidth: 1,
          fontWeight: '700',
          color: textColor,
        },
        td: {
          padding: 8,
          borderColor: mutedBorder,
          borderWidth: 1,
          color: textColor,
        },
        tr: {
          borderBottomWidth: 0,
        },
      }),
    [textColor, mutedBorder, headerBg, isUser, style]
  );

  return <Markdown style={markdownStyles}>{content}</Markdown>;
}
