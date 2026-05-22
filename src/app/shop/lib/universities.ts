export type UniversityOption = {
  uid: string;
  name: string;
};

export const UNIVERSITIES: UniversityOption[] = [
  { uid: "uiu", name: "United International University (UIU)" },
  { uid: "bracu", name: "Brac University (BracU)" },
  { uid: "nsu", name: "North South University (NSU)" },
  { uid: "ewu", name: "East West University (EWU)" },
  { uid: "aiub", name: "American International University Bangladesh (AIUB)" },
  { uid: "iub", name: "Independent University Bangladesh (IUB)" },
];

export function getUniversityByUid(universityUid?: string | null) {
  if (!universityUid) {
    return null;
  }

  return UNIVERSITIES.find((university) => university.uid === universityUid) || null;
}