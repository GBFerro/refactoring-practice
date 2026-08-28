import type { Course, CourseCatalogue } from "./catalogue";

export function requireCourse(catalogue: CourseCatalogue, code: string): Course {
  const course = catalogue.courses.find((candidate) => candidate.code === code);
  if (course === undefined) {
    throw new Error(`No course "${code}" in the ${catalogue.season} catalogue.`);
  }
  return course;
}
