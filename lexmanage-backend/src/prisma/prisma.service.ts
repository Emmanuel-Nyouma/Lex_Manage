import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tenantContext } from '../common/context/tenant.context';

const TENANT_BOUND_MODELS = [
  'Client',
  'User',
  'Invitation',
  'Case',
  'Document',
  'ChatConversation',
  'AuditLog',
  'Deadline',
  'Notification',
];

function isTenantBound(modelName: string): boolean {
  return TENANT_BOUND_MODELS.includes(modelName);
}

function getModelPropertyName(modelName: string): string {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly extendedClient: any;

  constructor() {
    super();

    // Store a reference to this instance to access the proxy target and base client
    const self = this;

    this.extendedClient = this.$extends({
      query: {
        $allModels: {
          async findMany({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                args.where = { ...args.where, tenantId };
              }
            }
            return query(args);
          },
          async findFirst({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                args.where = { ...args.where, tenantId };
              }
            }
            return query(args);
          },
          async findUnique({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                const modelKey = getModelPropertyName(model);
                return (self.extendedClient as any)[modelKey].findFirst({
                  ...args,
                  where: { ...args.where, tenantId },
                });
              }
            }
            return query(args);
          },
          async findUniqueOrThrow({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                const modelKey = getModelPropertyName(model);
                return (self.extendedClient as any)[modelKey].findFirstOrThrow({
                  ...args,
                  where: { ...args.where, tenantId },
                });
              }
            }
            return query(args);
          },
          async count({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                args.where = { ...args.where, tenantId };
              }
            }
            return query(args);
          },
          async aggregate({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                args.where = { ...args.where, tenantId };
              }
            }
            return query(args);
          },
          async groupBy({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                args.where = { ...args.where, tenantId };
              }
            }
            return query(args);
          },
          async create({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                args.data = { ...args.data, tenantId };
              }
            }
            return query(args);
          },
          async createMany({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                if (Array.isArray(args.data)) {
                  args.data = args.data.map((item: any) => ({ ...item, tenantId }));
                } else {
                  args.data = { ...args.data, tenantId };
                }
              }
            }
            return query(args);
          },
          async update({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                args.where = { ...args.where, tenantId };
              }
            }
            return query(args);
          },
          async updateMany({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                args.where = { ...args.where, tenantId };
              }
            }
            return query(args);
          },
          async upsert({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                args.where = { ...args.where, tenantId };
                args.create = { ...args.create, tenantId };
                args.update = { ...args.update, tenantId };
              }
            }
            return query(args);
          },
          async delete({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                args.where = { ...args.where, tenantId };
              }
            }
            return query(args);
          },
          async deleteMany({ model, args, query }: any) {
            if (isTenantBound(model)) {
              const tenantId = tenantContext.getTenantId();
              if (tenantId) {
                args.where = { ...args.where, tenantId };
              }
            }
            return query(args);
          },
        },
      },
    });

    // Return a Proxy so that PrismaService instances delegate all operations
    // to the extended client, transparently applying row-level isolation filters.
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target && typeof (target as any)[prop] === 'function') {
          if (prop === 'onModuleInit' || prop === 'onModuleDestroy') {
            return Reflect.get(target, prop, receiver);
          }
        }
        return Reflect.get(target.extendedClient, prop);
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
