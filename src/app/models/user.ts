
export interface User {
  id: number;
  name: string;
  email: string;
  status: string;
  portals: Portal[];
}

export interface Portal {
  id: number;
  name: string;
  slug: string;
  phone: string | null;
  departments: Department[];
}

export interface Department {
  id: number;
  portal_id: number;
  name: string;
  slug: string;
  is_default: boolean;
}
