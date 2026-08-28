import type { CourseCatalogue } from "./catalogue";
import { checkCourse } from "./course-lookup";

export function describeCourse(catalogue: CourseCatalogue, code: string): string {
  const course = checkCourse(catalogue, catalogue.season, code);
  return `${course.title} (${String(course.capacity)} places)`;
}

export function seatsRemaining(
  catalogue: CourseCatalogue,
  code: string,
  enrolled: number,
): number {
  return checkCourse(catalogue, catalogue.season, code).capacity - enrolled;
}

export function describeWithPrerequisite(
  catalogue: CourseCatalogue,
  code: string,
): string {
  const course = checkCourse(catalogue, catalogue.season, code);
  if (course.prerequisiteCode === null) {
    return course.title;
  }
  const prerequisite = checkCourse(catalogue, catalogue.season, course.prerequisiteCode);
  return `${course.title} (requires ${prerequisite.title})`;
}
