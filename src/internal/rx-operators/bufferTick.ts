import {
  SchedulerLike,
  OperatorFunction,
  Observable,
  Subscription,
} from "rxjs";

export function bufferTick<T>(
  scheduler: SchedulerLike,
): OperatorFunction<T, T[]> {
  return (source) => {
    return new Observable<T[]>((subscriber) => {
      let buffer: T[];
      let sub: Subscription;

      subscriber.add(
        source.subscribe({
          next: (value) => {
            if (!buffer) {
              buffer = [];
            }

            buffer.push(value);

            if (!sub) {
              sub = scheduler.schedule(function () {
                const buffCopy = buffer;
                buffer = null;
                sub = null;

                try {
                  subscriber.next(buffCopy);
                } finally {
                  this.unsubscribe();
                }
              });

              subscriber.add(sub);
            }
          },
          complete: subscriber.complete.bind(subscriber),
          error: subscriber.error.bind(subscriber),
        }),
      );
    });
  };
}
