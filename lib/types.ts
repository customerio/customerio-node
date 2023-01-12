export enum IdentifierType {
  Id = 'id',
  Email = 'email',
  CioId = 'cio_id',
}

export enum FilterOperator {
  Eq = 'eq',
  Exists = 'exists',
}

export type SegmentFilter = {
  id: number;
};

export type AttributeFilter = {
  field: string;
  operator: FilterOperator;
  value?: string | number | boolean;
};

export type NotFilter = {
  segment?: SegmentFilter;
  attribute?: AttributeFilter;
};

export type FilterObject = SegmentFilter | AttributeFilter;

export type NotFilterObject = {
  not: Filter;
};

export type AndFilter = {
  and: Filter[];
};

export type OrFilter = {
  or: Filter[];
};

export type Filter = AndFilter | OrFilter | NotFilter | NotFilterObject | FilterObject;
