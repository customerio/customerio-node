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
  value?: string;
};

export type NotFilter = {
  segment?: SegmentFilter;
  attribute?: AttributeFilter;
};

export type FilterObject = SegmentFilter | AttributeFilter | NotFilter;

export type AndFilter = {
  and: FilterObject[];
};

export type OrFilter = {
  or: FilterObject[];
};

export type Filter = AndFilter | OrFilter;
