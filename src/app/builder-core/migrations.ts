import { CURRENT_BUILDER_SCHEMA_VERSION, LEGACY_BUILDER_SCHEMA_VERSION } from './schema';

export interface SchemaMigrationStep {
  from: number;
  to: number;
  run: (doc: Record<string, unknown>) => Record<string, unknown>;
}

const SCHEMA_MIGRATIONS: readonly SchemaMigrationStep[] = [
  {
    from: 0,
    to: 1,
    run: migrateV0ToV1,
  },
  {
    from: 1,
    to: 2,
    run: migrateV1ToV2,
  },
];

export function toSchemaVersion(value: unknown): number {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return LEGACY_BUILDER_SCHEMA_VERSION;
  return Math.trunc(num);
}

export function migrateBuilderSchema(rawDoc: Record<string, unknown>): {
  migrated: Record<string, unknown>;
  warnings: string[];
} {
  const warnings: string[] = [];
  const fromVersion = toSchemaVersion(rawDoc['schemaVersion']);
  let out = { ...rawDoc };

  if (fromVersion > CURRENT_BUILDER_SCHEMA_VERSION) {
    warnings.push(
      `Document schema v${fromVersion} is newer than supported v${CURRENT_BUILDER_SCHEMA_VERSION}; imported in compatibility mode.`,
    );
    return { migrated: { ...out, schemaVersion: CURRENT_BUILDER_SCHEMA_VERSION }, warnings };
  }

  let current = fromVersion;
  while (current < CURRENT_BUILDER_SCHEMA_VERSION) {
    const step = SCHEMA_MIGRATIONS.find((candidate) => candidate.from === current);
    if (!step) {
      warnings.push(
        `Missing migration step from v${current}; forced schema to v${CURRENT_BUILDER_SCHEMA_VERSION} in compatibility mode.`,
      );
      return { migrated: { ...out, schemaVersion: CURRENT_BUILDER_SCHEMA_VERSION }, warnings };
    }
    out = step.run(out);
    warnings.push(`Migrated builder document schema v${step.from} to v${step.to}.`);
    current = step.to;
  }

  return { migrated: { ...out, schemaVersion: CURRENT_BUILDER_SCHEMA_VERSION }, warnings };
}

function migrateV0ToV1(doc: Record<string, unknown>): Record<string, unknown> {
  const nodes = asRecord(doc['nodes']);
  if (!nodes) return doc;
  const nextNodes: Record<string, unknown> = { ...nodes };
  for (const [id, rawNode] of Object.entries(nodes)) {
    const node = asRecord(rawNode);
    if (!node || node['type'] !== 'field') continue;

    const props = migrateLegacyRuleAliases(asRecord(node['props']) ?? {});
    const validators = migrateLegacyCustomValidationAlias(asRecord(node['validators']) ?? {});

    nextNodes[id] = {
      ...node,
      props,
      validators,
    };
  }
  return { ...doc, nodes: nextNodes };
}

function migrateLegacyRuleAliases(props: Record<string, unknown>): Record<string, unknown> {
  const visibleWhen = asRecord(props['visibleWhen']);
  if (visibleWhen && !asRecord(props['visibleRule'])) props['visibleRule'] = toRuleAlias(visibleWhen);
  delete props['visibleWhen'];

  const enabledWhen = asRecord(props['enabledWhen']);
  if (enabledWhen && !asRecord(props['enabledRule'])) props['enabledRule'] = toRuleAlias(enabledWhen);
  delete props['enabledWhen'];
  return props;
}

function toRuleAlias(value: Record<string, unknown>): Record<string, unknown> {
  return {
    dependsOnKey: value['dependsOnKey'],
    operator: value['operator'],
    value: value['value'],
  };
}

function migrateLegacyCustomValidationAlias(validators: Record<string, unknown>): Record<string, unknown> {
  const customValidation = asRecord(validators['customValidation']);
  if (!customValidation) return validators;
  if (typeof customValidation['expression'] === 'string' && !validators['customExpression']) {
    validators['customExpression'] = customValidation['expression'];
  }
  if (typeof customValidation['message'] === 'string' && !validators['customExpressionMessage']) {
    validators['customExpressionMessage'] = customValidation['message'];
  }
  delete validators['customValidation'];
  return validators;
}

function migrateV1ToV2(doc: Record<string, unknown>): Record<string, unknown> {
  const nodes = asRecord(doc['nodes']);
  if (!nodes) return doc;
  const nextNodes: Record<string, unknown> = { ...nodes };

  for (const [id, rawNode] of Object.entries(nodes)) {
    const node = asRecord(rawNode);
    if (!node || node['type'] !== 'field') continue;

    const props = asRecord(node['props']) ?? {};
    const validators = asRecord(node['validators']) ?? {};

    normalizeTrimmedExpression(props, 'visibleExpression');
    normalizeTrimmedExpression(props, 'enabledExpression');
    normalizeTrimmedExpression(validators, 'customExpression');

    nextNodes[id] = {
      ...node,
      props,
      validators,
    };
  }
  return { ...doc, nodes: nextNodes };
}

function normalizeTrimmedExpression(container: Record<string, unknown>, key: string): void {
  const value = container[key];
  if (typeof value !== 'string') return;
  const trimmed = value.trim();
  if (!trimmed) {
    delete container[key];
    return;
  }
  container[key] = trimmed;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
