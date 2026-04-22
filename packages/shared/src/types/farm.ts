export type Company = {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type Farm = {
  id: string;
  companyId: string;
  name: string;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type Zone = {
  id: string;
  companyId: string;
  farmId: string;
  name: string;
  type: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type Pen = {
  id: string;
  companyId: string;
  farmId: string;
  zoneId: string;
  name: string;
  capacity: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
