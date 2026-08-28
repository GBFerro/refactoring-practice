import type { Course, CourseCatalogue } from "./catalogue";

export function checkCourse(
  catalogue: CourseCatalogue,
  season: string,
  code: string,
): Course {
  const course = catalogue.courses.find((candidate) => candidate.code === code);
  if (course === undefined) {
    throw new Error(`No course "${code}" in the ${season} catalogue.`);
  }
  return course;
}
