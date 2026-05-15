export type UserRole =
  | "student"
  | "parent"
  | "teacher"
  | "school_admin"
  | "tutor"
  | "internal_admin";

export type Grade = "R" | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type Language = "en" | "af" | "zu" | "st" | "xh";

export interface BaseUser {
  id: string;
  email: string;
  role: UserRole;
  language: Language;
  createdAt: string;
  updatedAt: string;
}

export interface Student extends BaseUser {
  role: "student";
  displayName: string;
  grade: Grade;
  schoolId?: string;
  linkedParentIds: string[];
  /** Required for under-18 students per POPIA. */
  parentalConsentAt: string | null;
}

export interface Parent extends BaseUser {
  role: "parent";
  displayName: string;
  linkedStudentIds: string[];
}

export interface Teacher extends BaseUser {
  role: "teacher";
  displayName: string;
  schoolId: string;
  saceNumber: string;
  classIds: string[];
}
