export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          contact_email: string | null;
          industry: string | null;
          notes: string | null;
          monthly_revenue: number | null;
          setup_fee: number | null;
          contract_months: number | null;
          is_contract: boolean | null;
          static_count: number | null;
          video_count: number | null;
          deadline: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          contact_email?: string | null;
          industry?: string | null;
          notes?: string | null;
          monthly_revenue?: number | null;
          setup_fee?: number | null;
          contract_months?: number | null;
          is_contract?: boolean | null;
          static_count?: number | null;
          video_count?: number | null;
          deadline?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          name: string;
          client: string;
          type: string;
          current_stage: string | null;
          progress: number | null;
          owner_id: string | null;
          deadline: string | null;
          created_at: string;
          updated_at: string | null;
          status: string | null;
          client_id: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          client: string;
          type: string;
          current_stage?: string | null;
          progress?: number | null;
          owner_id?: string | null;
          deadline?: string | null;
          created_at?: string;
          updated_at?: string | null;
          status?: string | null;
          client_id?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      client_workflows: {
        Row: {
          id: string;
          client_id: string;
          workflow_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          workflow_type: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          name: string | null;
          email: string | null;
          department: string | null;
          position: string | null;
          avatar_url: string | null;
          status: string | null;
          last_login: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          job_role: string | null;
          role: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          id: string;
          role_id: string;
          module: string;
          action: string;
        };
        Insert: {
          id?: string;
          role_id: string;
          module: string;
          action: string;
        };
        Update: {
          id?: string;
          role_id?: string;
          module?: string;
          action?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          user_id: string;
          role_id: string;
        };
        Insert: never;
        Update: {
          user_id?: string;
          role_id?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          created_at: string;
          user_id: string | null;
          action: string;
          target: string | null;
          details: Json | null;
          ip_address: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id?: string | null;
          action: string;
          target?: string | null;
          details?: Json | null;
          ip_address?: string | null;
        };
        Update: never;
        Relationships: [];
      };
      employee_attendance: {
        Row: {
          id: string;
          employee_id: string;
          login_time: string;
          logout_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          login_time?: string;
          logout_time?: string | null;
          created_at?: string;
        };
        Update: {
          logout_time?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
