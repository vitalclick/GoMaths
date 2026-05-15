/**
 * Layered soft shadows used across cards and "pop" surfaces.
 * Native code reads these via the RN shadow* and elevation props;
 * web reads them via boxShadow.
 */

export const shadow = {
  soft: {
    web: "0 1px 2px rgba(20,40,30,0.04), 0 6px 24px rgba(20,40,30,0.06)",
    native: {
      shadowColor: "#142818",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
  },
  pop: {
    web: "0 4px 8px rgba(20,40,30,0.06), 0 18px 40px rgba(20,40,30,0.08)",
    native: {
      shadowColor: "#142818",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 6,
    },
  },
} as const;
