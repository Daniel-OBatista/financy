export function brlFromCents(cents: number): string {
    const v = cents / 100;
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  
  export function isoToBR(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR");
  }
  
  export function toISODateInput(iso: string): string {
    // para preencher input type="date"
    const d = new Date(iso);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }