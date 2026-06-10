import { AsyncLocalStorage } from 'async_hooks';

interface TenantStore {
  tenantId?: string;
  bypass?: boolean;
}

class TenantContext {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  /**
   * Runs a function within the context of a specific tenantId.
   */
  run(tenantId: string | undefined, callback: () => void) {
    this.storage.run({ tenantId }, callback);
  }

  /**
   * Runs a function with tenant isolation DISABLED.
   * Use ONLY for inherently cross-tenant operations — e.g. authentication
   * lookups by email / token / refreshToken that must run before a tenant
   * context exists. Resolves with the callback's return value.
   */
  runUnscoped<T>(callback: () => T): T {
    return this.storage.run({ bypass: true }, callback);
  }

  /**
   * Retrieves the current tenantId from the active execution context.
   */
  getTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }

  /**
   * Whether tenant isolation is disabled for the current execution context.
   */
  isUnscoped(): boolean {
    return this.storage.getStore()?.bypass === true;
  }
}

export const tenantContext = new TenantContext();
