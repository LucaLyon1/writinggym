import { AsyncLocalStorage } from 'node:async_hooks'

// Next's server runtime normally provides this before loading request helpers.
Object.defineProperty(globalThis, 'AsyncLocalStorage', {
  configurable: true,
  value: AsyncLocalStorage,
})
