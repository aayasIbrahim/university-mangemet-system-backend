export interface ICreateDepartmentPayload {
  name: string;
  code: string;
  description?: string | null;
  
}
export interface IUpdateDepartmentPayload {
  name?: string;
  code?: string;
  description?: string | null;
  isActive?: boolean; 
}