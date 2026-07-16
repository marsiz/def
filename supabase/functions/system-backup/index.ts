import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface TableExport {
  table_name: string;
  rows: Record<string, unknown>[];
  row_count: number;
}

async function fetchAllTables(): Promise<{ tables: TableExport[]; totalRecords: number }> {
  const tables: TableExport[] = [];
  let totalRecords = 0;

  const tableNames = [
    "categories", "brands", "suppliers", "products", "customers",
    "sales", "sale_items", "expenses", "stock_movements",
    "service_tickets", "bank_accounts", "cash_transactions",
    "installments", "income", "notifications", "companies",
    "activity_logs", "quotes", "user_profiles", "user_permissions",
    "system_settings", "backup_records",
  ];

  for (const tableName of tableNames) {
    const allRows: Record<string, unknown>[] = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
      const url = `${SUPABASE_URL}/rest/v1/${tableName}?offset=${offset}&limit=${pageSize}`;
      const resp = await fetch(url, {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error(`Failed to fetch ${tableName}: ${resp.status} ${text}`);
        break;
      }

      const rows: Record<string, unknown>[] = await resp.json();
      if (rows.length === 0) break;

      allRows.push(...rows);
      if (rows.length < pageSize) break;
      offset += pageSize;
    }

    tables.push({ table_name: tableName, rows: allRows, row_count: allRows.length });
    totalRecords += allRows.length;
  }

  return { tables, totalRecords };
}

async function restoreTables(tables: TableExport[]): Promise<{ restored: number; errors: string[] }> {
  let restored = 0;
  const errors: string[] = [];

  for (const { table_name, rows } of tables) {
    if (rows.length === 0) continue;

    const url = `${SUPABASE_URL}/rest/v1/${table_name}`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal,resolution=merge-duplicates",
      },
      body: JSON.stringify(rows),
    });

    if (!resp.ok) {
      const text = await resp.text();
      errors.push(`${table_name}: ${resp.status} ${text.substring(0, 200)}`);
    } else {
      restored += rows.length;
    }
  }

  return { restored, errors };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "backup";

    if (action === "backup") {
      const { tables, totalRecords } = await fetchAllTables();

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").replace("T", "_").slice(0, 19);
      const filename = `backup_${timestamp}.json`;

      const backupData = {
        metadata: {
          version: "1.0",
          created_at: new Date().toISOString(),
          filename,
          table_count: tables.length,
          total_records: totalRecords,
          system: "Marsiz ERP",
        },
        tables,
      };

      const jsonData = JSON.stringify(backupData, null, 2);
      const jsonBytes = new TextEncoder().encode(jsonData);

      const storageUrl = `${SUPABASE_URL}/storage/v1/object/backups/${filename}`;
      const uploadResp = await fetch(storageUrl, {
        method: "POST",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: jsonData,
      });

      if (!uploadResp.ok) {
        const text = await uploadResp.text();
        return new Response(
          JSON.stringify({ error: "Storage upload failed", details: text }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authHeader = req.headers.get("Authorization") || "";
      const token = authHeader.replace("Bearer ", "");
      const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${token}` },
      });
      let userId: string | null = null;
      if (userResp.ok) {
        const userData = await userResp.json();
        userId = userData.id;
      }

      const recordResp = await fetch(`${SUPABASE_URL}/rest/v1/backup_records`, {
        method: "POST",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          filename,
          file_size: jsonBytes.length,
          storage_path: filename,
          backup_type: "manual",
          status: "completed",
          table_count: tables.length,
          record_count: totalRecords,
          created_by: userId,
        }),
      });

      let recordId: string | null = null;
      if (recordResp.ok) {
        const recordData = await recordResp.json();
        recordId = recordData[0]?.id || null;
      }

      return new Response(
        JSON.stringify({
          success: true,
          filename,
          file_size: jsonBytes.length,
          table_count: tables.length,
          record_count: totalRecords,
          record_id: recordId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "restore") {
      const filename = url.searchParams.get("filename");
      if (!filename) {
        return new Response(
          JSON.stringify({ error: "Filename required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const storageUrl = `${SUPABASE_URL}/storage/v1/object/backups/${filename}`;
      const downloadResp = await fetch(storageUrl, {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      });

      if (!downloadResp.ok) {
        return new Response(
          JSON.stringify({ error: "Backup file not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const backupData = await downloadResp.json();

      if (!backupData.tables || !Array.isArray(backupData.tables)) {
        return new Response(
          JSON.stringify({ error: "Invalid backup file format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await restoreTables(backupData.tables);

      return new Response(
        JSON.stringify({
          success: true,
          restored_records: result.restored,
          errors: result.errors,
          metadata: backupData.metadata,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "download") {
      const filename = url.searchParams.get("filename");
      if (!filename) {
        return new Response(
          JSON.stringify({ error: "Filename required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const storageUrl = `${SUPABASE_URL}/storage/v1/object/backups/${filename}`;
      const downloadResp = await fetch(storageUrl, {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      });

      if (!downloadResp.ok) {
        return new Response(
          JSON.stringify({ error: "Backup file not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await downloadResp.text();
      return new Response(data, {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (action === "delete") {
      const filename = url.searchParams.get("filename");
      if (!filename) {
        return new Response(
          JSON.stringify({ error: "Filename required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const storageUrl = `${SUPABASE_URL}/storage/v1/object/backups/${filename}`;
      await fetch(storageUrl, {
        method: "DELETE",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      });

      await fetch(`${SUPABASE_URL}/rest/v1/backup_records?filename=eq.${encodeURIComponent(filename)}`, {
        method: "DELETE",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action. Use: backup, restore, download, delete" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
