export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'CABINET_ADMIN' | 'LAWYER' | 'ASSISTANT' | 'SECRETARY';
  tenantId: string;
}

export interface Case {
  id: string;
  title: string;
  clientName: string;
  courtName?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'CLOSED' | 'ARCHIVED';
  assigneeId: string;
  assignee?: User;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
