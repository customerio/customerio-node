/** @enum {string} */
export const IdentifierType = /** @type {const} */ ({
  Id: 'id',
  Email: 'email',
  CioId: 'cio_id',
});
Object.freeze(IdentifierType);

/** @enum {string} */
export const FilterOperator = /** @type {const} */ ({
  Eq: 'eq',
  Exists: 'exists',
});
Object.freeze(FilterOperator);

/** @typedef {{ id: number }} SegmentFilter */

/** @typedef {{ field: string; operator: FilterOperator; value?: string }} AttributeFilter */

/** @typedef {{ segment?: SegmentFilter; attribute?: AttributeFilter }} NotFilter */

/** @typedef {SegmentFilter | AttributeFilter | NotFilter} FilterObject */

/** @typedef {{ and: FilterObject[] }} AndFilter */

/** @typedef {{ or: FilterObject[] }} OrFilter */

/** @typedef {AndFilter | OrFilter} Filter */
