import {
  DefaultError,
  notifyManager,
  QueryClient,
  QueryKey,
  QueryObserver,
  QueryObserverOptions,
} from "@tanstack/query-core";
import { createAtom, reaction } from "mobx";

export class MobxQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
> {
  private atom = createAtom(
    "MobxQuery",
    () => this.startTracking(),
    () => this.stopTracking()
  );

  public queryObserver: QueryObserver<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >;

  constructor(
    private getOptions: () => QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
    private queryClinet: QueryClient
  ) {
    this.queryObserver = new QueryObserver(
      this.queryClinet,
      this.defaultQueryOptions
    );
  }

  fetch() {
    return this.queryClinet.fetchQuery(this.defaultQueryOptions);
  }

  get result() {
    this.atom.reportObserved();
    return this.queryObserver.getOptimisticResult(this.defaultQueryOptions);
  }

  private unsubscribe = () => {};
  private startTracking() {
    const unsubscribeReaction = reaction(
      () => this.defaultQueryOptions,
      () => {
        this.queryObserver.setOptions(this.defaultQueryOptions);
      }
    );

    const unsubscribeObserver = this.queryObserver.subscribe(
      notifyManager.batchCalls(() => this.atom.reportChanged())
    );

    this.unsubscribe = () => {
      unsubscribeReaction();
      unsubscribeObserver();
    };
  }

  private stopTracking() {
    this.unsubscribe();
  }

  get defaultQueryOptions() {
    return this.queryClinet.defaultQueryOptions(this.getOptions());
  }
}
