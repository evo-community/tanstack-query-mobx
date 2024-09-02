import {
  DefaultError,
  MutateOptions,
  MutationObserver,
  MutationObserverOptions,
  notifyManager,
  QueryClient,
} from "@tanstack/query-core";
import { createAtom, reaction } from "mobx";

export class MobxMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown
> {
  private atom = createAtom(
    "MobxMutation",
    () => this.startTracking(),
    () => this.stopTracking()
  );

  private mutationObserver: MutationObserver<
    TData,
    TError,
    TVariables,
    TContext
  >;

  constructor(
    private getOptions: () => MutationObserverOptions<
      TData,
      TError,
      TVariables,
      TContext
    >,
    private queryClinet: QueryClient
  ) {
    this.mutationObserver = new MutationObserver(
      this.queryClinet,
      this.defaultQueryOptions
    );
  }

  async mutate(
    variables: TVariables,
    options?: MutateOptions<TData, TError, TVariables, TContext>
  ) {
    return this.mutationObserver.mutate(variables, options).catch(() => {});
  }

  async mutateAsync(
    variables: TVariables,
    options?: MutateOptions<TData, TError, TVariables, TContext>
  ) {
    return this.mutationObserver.mutate(variables, options);
  }

  get result() {
    this.atom.reportObserved();
    return this.mutationObserver.getCurrentResult();
  }

  private unsubscribe = () => {};
  private startTracking() {
    const unsubscribeReaction = reaction(
      () => this.defaultQueryOptions,
      () => {
        this.mutationObserver.setOptions(this.defaultQueryOptions);
      }
    );

    const unsubscribeObserver = this.mutationObserver.subscribe(
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

  private get defaultQueryOptions() {
    return this.getOptions();
  }
}
