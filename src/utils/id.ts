export const newId = (prefix: string) =>
  `${prefix}-${
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`
  }`;
