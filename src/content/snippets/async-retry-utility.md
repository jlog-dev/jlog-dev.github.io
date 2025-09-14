---
title: "Async Retry Utility with Exponential Backoff"
description: "A TypeScript utility function for retrying async operations with configurable exponential backoff and jitter."
pubDate: 2024-12-01
language: "typescript"
framework: "Node.js"
tags: ["typescript", "async", "retry", "utility", "error-handling"]
difficulty: "intermediate"
category: "utility"
lang: "en"
---

## Implementation

```typescript
interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponentialBase?: number;
  jitter?: boolean;
}

export async function retryAsync<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    exponentialBase = 2,
    jitter = true
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      let delay = Math.min(
        baseDelay * Math.pow(exponentialBase, attempt - 1),
        maxDelay
      );

      // Add jitter to prevent thundering herd
      if (jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

## Usage Examples

```typescript
// Basic usage
const result = await retryAsync(async () => {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error('Request failed');
  return response.json();
});

// With custom options
const data = await retryAsync(
  () => unstableApiCall(),
  {
    maxAttempts: 5,
    baseDelay: 500,
    maxDelay: 10000,
    jitter: true
  }
);
```

## Features

- **Exponential Backoff**: Progressively increases delay between retries
- **Jitter**: Adds randomness to prevent thundering herd problems
- **Configurable**: All parameters can be customized
- **Type Safe**: Full TypeScript support with generics
- **Error Preservation**: Throws the last error if all attempts fail
