import type { CourseCatalogue } from "./catalogue";
import { requireCourse } from "./course-lookup";

export function describeCourse(catalogue: CourseCatalogue, code: string): string {
  const course = requireCourse(catalogue, code);
  return `${course.title} (${String(course.capacity)} places)`;
}

export function seatsRemaining(
  catalogue: CourseCatalogue,
  code: string,
  enrolled: number,
): number {
  return requireCourse(catalogue, code).capacity - enrolled;
}

export function describeWithPrerequisite(
  catalogue: CourseCatalogue,
  code: string,
): string {
  const course = requireCourse(catalogue, code);
  if (course.prerequisiteCode === null) {
    return course.title;
  }
  const prerequisite = requireCourse(catalogue, course.prerequisiteCode);
  return `${course.title} (requires ${prerequisite.title})`;
}
