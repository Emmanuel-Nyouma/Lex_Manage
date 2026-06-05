export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'CABINET_ADMIN' | 'LAWYER' | 'ASSISTANT' | 'SECRETARY';
  tenantId: string;
  isActive: boolean;
  avatarUrl?: string;
  phone?: string;
}

export interface Case {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  clientName: string;
  courtName?: string;
  caseNumber?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'CLOSED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  assignee?: User;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  tenantId: string;
  title: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  category?: string;
  type: string;
  status: string;
  uploaderId: string;
  case_id?: string;
  isPending: boolean;
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

// Request DTOs
export interface CreateCaseDto {
  title: string;
  description?: string;
  clientName: string;
  courtName?: string;
  caseNumber?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId?: string;
  documentIds?: string[];
}
