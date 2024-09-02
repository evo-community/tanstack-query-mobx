import { DefaultError, QueryKey } from "@tanstack/query-core";

import { MobxQuery } from "./query";

export class MobxSuspenceQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> {
  constructor(
    private query: MobxQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  ) {}

  // TODO implement error boundary and suspence behavior based on:
  // https://github.com/TanStack/query/blob/main/packages/react-query/src/useBaseQuery.ts

  get data(): TData {
    const data = this.query.result.data;

    if (!data) {
      throw this.query.queryObserver.fetchOptimistic(
        this.query.defaultQueryOptions
      );
    }

    return data;
  }
}
