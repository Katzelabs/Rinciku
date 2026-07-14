import { describe, expect, it } from 'vitest';
import {
  AGENT_TOOLS,
  CHANGE_TOOL,
  READ_TOOLS,
  TRANSACTION_TOOLS,
  isReadTool,
  isWriteTool,
  parseChange,
} from './agent-tools';
import type { ChatResponse } from './types';

// The read/write split is the app's confirmation boundary: read tools
// auto-execute inside the loop, write tools MUST end the turn with a card the
// user approves. A write tool misclassified as read would silently mutate the
// user's finances — so these tests assert the classification can't drift.

const WRITE_NAMES = [
  'propose_expense',
  'propose_income',
  'propose_change',
  'export_transactions',
];

describe('read/write classification gate', () => {
  it('classifies every write tool as write, never read', () => {
    for (const name of WRITE_NAMES) {
      expect(isWriteTool(name)).toBe(true);
      expect(isReadTool(name)).toBe(false);
    }
  });

  it('classifies every read tool as read, never write', () => {
    for (const tool of READ_TOOLS) {
      expect(isReadTool(tool.name)).toBe(true);
      expect(isWriteTool(tool.name)).toBe(false);
    }
  });

  it('never classifies a tool as both read and write', () => {
    for (const tool of AGENT_TOOLS) {
      expect(isReadTool(tool.name) && isWriteTool(tool.name)).toBe(false);
    }
  });

  it('classifies EVERY exposed tool as exactly one of read or write', () => {
    // A tool handed to the model but classified as neither would fall through
    // the dispatcher and never route to a confirmation card.
    for (const tool of AGENT_TOOLS) {
      const classified =
        Number(isReadTool(tool.name)) + Number(isWriteTool(tool.name));
      expect(classified, `${tool.name} must be exactly one of read/write`).toBe(
        1
      );
    }
  });

  it('treats unknown tool names as neither', () => {
    expect(isReadTool('drop_table')).toBe(false);
    expect(isWriteTool('drop_table')).toBe(false);
  });
});

describe('AGENT_TOOLS shape', () => {
  it('exposes the transaction, change, export, and read tools', () => {
    const names = AGENT_TOOLS.map((t) => t.name);
    expect(names).toContain('propose_expense');
    expect(names).toContain('propose_income');
    expect(names).toContain('propose_change');
    expect(names).toContain('export_transactions');
    expect(names).toContain('get_financial_overview');
  });

  it('has no duplicate tool names', () => {
    const names = AGENT_TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('gives every tool an object input_schema', () => {
    for (const tool of AGENT_TOOLS) {
      expect(tool.input_schema.type).toBe('object');
      expect(tool.description.length).toBeGreaterThan(0);
    }
  });

  it('requires amount + currency on the transaction proposals', () => {
    for (const tool of TRANSACTION_TOOLS) {
      expect(tool.input_schema.required).toEqual(['amount', 'currency']);
    }
  });

  it('requires action/entity/summary on propose_change', () => {
    expect(CHANGE_TOOL.input_schema.required).toEqual([
      'action',
      'entity',
      'summary',
    ]);
  });
});

// Helper: wrap a tool_use block in a ChatResponse the way the LLM returns it.
const responseWith = (name: string, input: unknown): ChatResponse => ({
  content: [{ type: 'tool_use', id: 'toolu_1', name, input }],
});

describe('parseChange', () => {
  it('parses a valid propose_change block', () => {
    const change = parseChange(
      responseWith('propose_change', {
        action: 'update',
        entity: 'budget',
        id: '11111111-1111-1111-1111-111111111111',
        data: { amount: 1500000, currency: 'IDR' },
        summary: 'Set Wants budget to Rp 1.500.000',
      })
    );
    expect(change).toEqual({
      action: 'update',
      entity: 'budget',
      id: '11111111-1111-1111-1111-111111111111',
      data: { amount: 1500000, currency: 'IDR' },
      summary: 'Set Wants budget to Rp 1.500.000',
    });
  });

  it('normalizes a missing id/data to null', () => {
    const change = parseChange(
      responseWith('propose_change', {
        action: 'create',
        entity: 'category',
        summary: 'Add Groceries category',
      })
    );
    expect(change?.id).toBeNull();
    expect(change?.data).toBeNull();
  });

  it('returns null when there is no propose_change block', () => {
    expect(parseChange({ content: [{ type: 'text', text: 'hi' }] })).toBeNull();
    expect(parseChange({})).toBeNull();
    expect(parseChange(responseWith('query_expenses', {}))).toBeNull();
  });

  it('rejects an invalid action or entity (model hallucination)', () => {
    expect(
      parseChange(
        responseWith('propose_change', {
          action: 'drop',
          entity: 'budget',
          summary: 'x',
        })
      )
    ).toBeNull();
    expect(
      parseChange(
        responseWith('propose_change', {
          action: 'delete',
          entity: 'users',
          summary: 'x',
        })
      )
    ).toBeNull();
  });

  it('rejects an empty summary (nothing to show on the card)', () => {
    expect(
      parseChange(
        responseWith('propose_change', {
          action: 'delete',
          entity: 'expense',
          id: 'x',
          summary: '',
        })
      )
    ).toBeNull();
  });
});
