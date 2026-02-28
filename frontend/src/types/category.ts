export interface Category {
  _id: string;
  name: string;
  displayName: string;
  description?: string;
  keywords?: string[];
  jobCount?: number;
  workerCount?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryStats {
  name: string;
  displayName: string;
  jobCount: number;
  workerCount: number;
}
