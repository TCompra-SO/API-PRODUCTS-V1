let active = 0;
const maxConcurrent = 3; // máximo PDFs simultáneos
const waiting: (() => void)[] = [];

export const pdfQueue = async <T>(fn: () => Promise<T>): Promise<T> => {
  if (active >= maxConcurrent) {
    await new Promise<void>((resolve) => waiting.push(resolve));
  }

  active++;

  try {
    return await fn();
  } finally {
    active--;

    if (waiting.length > 0) {
      const next = waiting.shift();
      next?.();
    }
  }
};
