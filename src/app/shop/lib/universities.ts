export type UniversityOption = {
  uid: string;
  name: string;
};

export const UNIVERSITIES: UniversityOption[] = [
  { uid: "nsu", name: "North South University" },
  { uid: "brac", name: "BRAC University" },
  { uid: "iub", name: "Independent University, Bangladesh" },
  { uid: "uiu", name: "United International University" },
  { uid: "aiub", name: "American International University-Bangladesh" },
  { uid: "du", name: "University of Dhaka" },
  { uid: "buet", name: "Bangladesh University of Engineering & Technology" },
];

export function getUniversityByUid(universityUid?: string | null) {
  if (!universityUid) {
    return null;
  }

  return UNIVERSITIES.find((university) => university.uid === universityUid) || null;
}
