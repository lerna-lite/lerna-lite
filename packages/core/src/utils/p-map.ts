/**
 * Native Node.js replacement for the `p-map` package.
 * https://github.com/sindresorhus/p-map
 * Maps over an iterable with an optional concurrency limit.
 */
export async function pMap<T, R>(
  iterable: Iterable<T>,
  mapper: (item: T, index: number) => Promise<R> | R,
  { concurrency = Infinity }: { concurrency?: number } = {}
): Promise<R[]> {
  const items = Array.from(iterable);
  if (items.length === 0) {
    return [];
  }

  if (!Number.isFinite(concurrency) || concurrency >= items.length) {
    return Promise.all(items.map((item, i) => mapper(item, i)));
  }

  const results: R[] = Array.from({ length: items.length });
  let nextIndex = 0;
  let activeCount = 0;
  let settled = false;

  return new Promise<R[]>((resolve, reject) => {
    function next() {
      if (settled) {
        return;
      }
      while (activeCount < concurrency && nextIndex < items.length) {
        const i = nextIndex++;
        activeCount++;
        Promise.resolve(mapper(items[i], i)).then(
          (result) => {
            results[i] = result;
            activeCount--;
            if (nextIndex < items.length) {
              next();
            } else if (activeCount === 0) {
              settled = true;
              resolve(results);
            }
          },
          (err) => {
            if (!settled) {
              settled = true;
              reject(err);
            }
          }
        );
      }
    }
    next();
  });
}
