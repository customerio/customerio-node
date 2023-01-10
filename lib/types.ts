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

export type NotSegment = {
  segment?: SegmentFilter;
  attribute?: AttributeFilter;
};

export type FilterObject = SegmentFilter | AttributeFilter | NotSegment | AndFilter | OrFilter;

export type FilterObjectOrRecord = FilterObject | Record<'not', FilterObject>;

export type AndFilter = {
  and: FilterObjectOrRecord[];
};

export type OrFilter = {
  or: FilterObjectOrRecord[];
};

export type Filter = AndFilter | OrFilter;
