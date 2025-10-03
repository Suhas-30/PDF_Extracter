export type ExtractModel = "omnidocs" | "docling";

export interface ExtractResponseItem {
  fileName: string;
  model: ExtractModel;
  ok: boolean;
  status: number;
  data?: unknown; // safe type
  error?: string;
}

const EXTRACT_ENDPOINT = "/api/extract";

/**
 * Type guard to check if an unknown value has an "error" property
 */
function hasErrorProp(value: unknown): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value && typeof (value as Record<string, unknown>).error === "string";
}

export async function extractFilesWithModel(
  files: File[],
  model: ExtractModel
): Promise<ExtractResponseItem[]> {
  const results: ExtractResponseItem[] = [];

  await Promise.all(
    files.map(async (file) => {
      const form = new FormData();
      form.append("model", model);
      form.append("file", file, file.name);

      try {
        const res = await fetch(EXTRACT_ENDPOINT, {
          method: "POST",
          body: form,
        });

        const contentType = res.headers.get("content-type") || "";
        const isJson = contentType.includes("application/json");
        const payload: unknown = isJson ? await res.json() : await res.text();

        results.push({
          fileName: file.name,
          model,
          ok: res.ok,
          status: res.status,
          data: res.ok ? payload : undefined,
          error: res.ok
            ? undefined
            : typeof payload === "string"
              ? payload
              : hasErrorProp(payload)
                ? payload.error
                : "Request failed",
        });
      } catch (error: unknown) {
        results.push({
          fileName: file.name,
          model,
          ok: false,
          status: 0,
          error: error instanceof Error ? error.message : "Network error",
        });
      }
    })
  );

  return results;
}
