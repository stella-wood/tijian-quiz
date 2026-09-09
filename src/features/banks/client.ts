import { requestJson } from "@/features/http-client";

export function deleteBank(id: string) {
  return requestJson<{ success: true }>(`/api/banks/${id}`, { method: "DELETE" });
}
