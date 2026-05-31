import { AsyncLocalStorage } from 'async_hooks';

class TenantContext {
  private readonly storage = new AsyncLocalStorage<string>();

  /**
   * Runs a function within the context of a specific tenantId.
   */
  run(tenantId: string | undefined, callback: () => void) {
    this.storage.run(tenantId, callback);
  }

  /**
   * Retrieves the current tenantId from the active execution context.
   */
  getTenantId(): string | undefined {
    return this.storage.getStore();
  }
}

export const tenantContext = new TenantContext();
