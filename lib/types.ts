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

/** Comparison operators supported in attribute and object conditions. */
export enum FilterOperator {
  Eq = 'eq',
  Exists = 'exists',
}

/** A leaf condition matching everyone in a given segment. */
export type SegmentCondition = {
  segment: { id: number };
};

/** A leaf condition matching people whose attribute satisfies an operator/value. */
export type AttributeCondition = {
  attribute: {
    field: string;
    operator: FilterOperator;
    value?: string;
  };
};

/**
 * An audience (people) filter expression. Compose `segment` and `attribute`
 * leaf conditions with `and` / `or` / `not` (each may nest arbitrarily).
 *
 * Used by {@link https://customer.io/docs/api/app/#operation/getCustomersByFilter searchCustomers}
 * and delivery/customer exports.
 */
export type AudienceFilter =
  | SegmentCondition
  | AttributeCondition
  | { and: AudienceFilter[] }
  | { or: AudienceFilter[] }
  | { not: AudienceFilter };

/**
 * Backwards-compatible alias for {@link AudienceFilter}, the people-filter
 * expression accepted by `searchCustomers` and `createCustomersExport`.
 */
export type Filter = AudienceFilter;

/**
 * A leaf condition matching objects whose attribute satisfies an operator/value.
 * `type_id` (the object type) is required by the API.
 */
export type ObjectAttributeCondition = {
  object_attribute: {
    field: string;
    operator: FilterOperator;
    value?: string;
    type_id: number;
  };
};

/**
 * An object filter expression. Compose `object_attribute` leaf conditions with
 * `and` / `or` / `not`. Unlike {@link AudienceFilter}, it has no `segment`
 * conditions. Used by `findObjects`.
 */
export type ObjectFilter =
  | ObjectAttributeCondition
  | { and: ObjectFilter[] }
  | { or: ObjectFilter[] }
  | { not: ObjectFilter };
