/* eslint-disable @typescript-eslint/no-explicit-any */
/*
type Listener = (arg: unknown) => void;

class EventEmmiter<T extends { [key: string]: unknown }> {
  listeners = new Map<keyof T, Set<Listener>>();

  on<K extends keyof T>(key: K, callback: (payload: T[K]) => void) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(callback as Listener);
  }

  off<K extends keyof T>(key: K, callback: (payload: T[K]) => void) {
    if (this.listeners.has(key)) {
      this.listeners.get(key)!.delete(callback as Listener);
    }
  }

  emit<K extends keyof T>(key: K, payload: T[K]) {
    if (this.listeners.has(key)) {
      this.listeners.get(key)!.forEach((callback) => callback(payload));
    }
  }
}

const eventEmmiter = new EventEmmiter<{
  start: number;
  end: string;
}>();


*/

type EventType<K extends string = string, V = unknown> = {
  type: K;
  payload: V;
};

type EventCreator<K extends string = string, V = any> = {
  (value: V): EventType<K, V>;
  type: K;
  withParams: <V2>() => EventCreator<K, V2>;
  check: (eventType: EventType) => eventType is EventType<K, V>;
};

export function createRoute<K extends string, V = void>(
  key: K
): EventCreator<K, V> {
  function creator(value: V) {
    return {
      type: key,
      payload: value,
    };
  }

  creator.type = key;

  creator.withPayload = <V2>() => {
    return creator as unknown as EventCreator<K, V2>;
  };

  creator.check = (eventType: EventType): eventType is EventType<K, V> => {
    return eventType.type === key;
  };

  return creator;
}

type Listener<K extends string = string, V = unknown> = (
  arg: EventType<K, V>
) => void;

export class EventEmmiter {
  private listeners = new Map<string, Set<Listener>>();
  private allListeners = new Set<Listener>();

  on<K extends string, V>(
    eventCreator: EventCreator<K, V>,
    callback: Listener<K, V>
  ) {
    if (!this.listeners.has(eventCreator.type)) {
      this.listeners.set(eventCreator.type, new Set());
    }

    this.listeners.get(eventCreator.type)!.add(callback as Listener);
  }

  onAll(callback: Listener) {
    this.allListeners.add(callback);
  }

  offAll(callback: Listener) {
    this.allListeners.delete(callback);
  }

  off<K extends string, V>(
    eventCreator: EventCreator<K, V>,
    callback: Listener<K, V>
  ) {
    if (this.listeners.has(eventCreator.type)) {
      this.listeners.get(eventCreator.type)!.delete(callback as Listener);
    }
  }

  emit<K extends string, V>(event: EventType<K, V>) {
    if (this.listeners.has(event.type)) {
      this.listeners.get(event.type)!.forEach((callback) => callback(event));
    }

    this.allListeners.forEach((callback) => callback(event));
  }

  take<K extends string, V>(eventCreator: EventCreator<K, V>) {
    return new Promise<EventType<K, V>>((resolve) => {
      const listener = (event: EventType<K, V>) => {
        resolve(event);
        this.off(eventCreator, listener);
      };
      this.on(eventCreator, listener);
    });
  }

  race<T extends EventCreator[]>(
    eventCreators: T
  ): Promise<Awaited<ReturnType<T[number]>>> {
    return new Promise((resolve) => {
      const listeners: [EventCreator, Listener][] = [];
      const off = () => {
        listeners.forEach(([creator, l]) => {
          this.off(creator, l);
        });
      };

      eventCreators.forEach((eventCreator) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const listener = (event: any) => {
          resolve(event);
          off();
        };

        listeners.push([eventCreator, listener]);

        this.on(eventCreator, listener);
      });
    });
  }
}

//

export const eventBuss = new EventEmmiter();

//

const createItem = createRoute("createItem").withParams<{ name: string }>();
const updateItem = createRoute("updateItem");
const deleteItem = createRoute("deleteItem");

eventBuss.emit(
  createItem({
    name: "hello",
  })
);

eventBuss.on(createItem, (event) => {
  console.log(event.payload.name);
});

//

/*
async function flow() {

  await router.redirect('/page')

  startLoading();

  await eventBuss.take(animationEnd);

  await doWork();

  console.log("some result");
}

flow();
*/

// Своя архитектура
//
