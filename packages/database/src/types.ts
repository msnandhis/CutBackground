// Generated types — replace with `supabase gen types typescript` output
// This is a placeholder that matches the schema from docs/plan.md

export interface Database {
    public: {
        Tables: {
            usage_logs: {
                Row: {
                    id: string;
                    ip_address: string;
                    device_fingerprint: string | null;
                    tool_name: string;
                    metadata: Record<string, unknown> | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    ip_address: string;
                    device_fingerprint?: string | null;
                    tool_name: string;
                    metadata?: Record<string, unknown> | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    ip_address?: string;
                    device_fingerprint?: string | null;
                    tool_name?: string;
                    metadata?: Record<string, unknown> | null;
                    created_at?: string;
                };
            };
            jobs: {
                Row: {
                    id: string;
                    status: "pending" | "processing" | "completed" | "failed";
                    input_url: string;
                    output_url: string | null;
                    error_message: string | null;
                    metadata: Record<string, unknown> | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    status?: "pending" | "processing" | "completed" | "failed";
                    input_url: string;
                    output_url?: string | null;
                    error_message?: string | null;
                    metadata?: Record<string, unknown> | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    status?: "pending" | "processing" | "completed" | "failed";
                    input_url?: string;
                    output_url?: string | null;
                    error_message?: string | null;
                    metadata?: Record<string, unknown> | null;
                    created_at?: string;
                };
            };
        };
    };
}
