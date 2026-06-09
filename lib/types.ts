/**
 * The three identifier kinds Customer.io accepts for a person.
 *
 * - `Id` — your application's user id
 * - `Email` — the person's email address
 * - `CioId` — Customer.io's internal stable id (prefix with `cio_` when used as a path segment)
 */
export enum IdentifierType {
  Id = 'id',
  Email = 'email',
  CioId = 'cio_id',
}

/** Comparison operators supported in {@link AttributeFilter}. */
export enum FilterOperator {
  Eq = 'eq',
  Exists = 'exists',
}

/** Filter matching everyone in a given segment. */
export type SegmentFilter = {
  id: number;
};

/** Filter matching people whose attribute satisfies an operator/value. */
export type AttributeFilter = {
  field: string;
  operator: FilterOperator;
  value?: string;
};

/** Negation of either a segment or attribute filter. */
export type NotFilter = {
  segment?: SegmentFilter;
  attribute?: AttributeFilter;
};

/** Union of the leaf filter shapes that compose larger boolean filters. */
export type FilterObject = SegmentFilter | AttributeFilter | NotFilter;

/** All sub-filters must match. */
export type AndFilter = {
  and: FilterObject[];
};

/** At least one sub-filter must match. */
export type OrFilter = {
  or: FilterObject[];
};

/**
 * Top-level filter expression. Compose with {@link AndFilter} / {@link OrFilter}
 * and nest {@link SegmentFilter}, {@link AttributeFilter}, or {@link NotFilter}.
 */
export type Filter = AndFilter | OrFilter;
