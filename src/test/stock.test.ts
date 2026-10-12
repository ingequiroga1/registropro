import { describe, it, expect } from "vitest";
import { stockLevel } from "@/lib/data";

describe("stockLevel", () => {
  it("agotado when stock is 0", () => expect(stockLevel({ stock_actual: 0, stock_minimo: 2 })).toBe("out"));
  it("stock bajo when stock <= minimo", () => expect(stockLevel({ stock_actual: 2, stock_minimo: 2 })).toBe("low"));
  it("ok above minimo", () => expect(stockLevel({ stock_actual: 3, stock_minimo: 2 })).toBe("ok"));
});
