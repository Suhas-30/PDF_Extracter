export type ExtractModel = "omnidocs" | "docling";

export interface ExtractResponseItem {
    fileName: string;
    model: ExtractModel;
    ok: boolean;
    status: number;
    data?: any;
    error?: string;
}

const EXTRACT_ENDPOINT = "/api/extract";

export async function extractFilesWithModel(files: File[], model: ExtractModel): Promise<ExtractResponseItem[]> {
    const results: ExtractResponseItem[] = [];

    await Promise.all(files.map(async (file) => {
        const form = new FormData();
        form.append("model", model);
        // Backend expects a single file per request; send one-by-one
        form.append("file", file, file.name);

        try {
            const res = await fetch(EXTRACT_ENDPOINT, {
                method: "POST",
                body: form,
            });

            const contentType = res.headers.get("content-type") || "";
            const isJson = contentType.includes("application/json");
            const payload = isJson ? await res.json() : await res.text();

            results.push({
                fileName: file.name,
                model,
                ok: res.ok,
                status: res.status,
                data: res.ok ? payload : undefined,
                error: res.ok ? undefined : (typeof payload === "string" ? payload : (payload?.error || "Request failed")),
            });
        } catch (error: any) {
            results.push({
                fileName: file.name,
                model,
                ok: false,
                status: 0,
                error: error?.message || "Network error",
            });
        }
    }));

    return results;
}


