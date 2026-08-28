export interface Course {
  readonly code: string;
  readonly title: string;
  readonly capacity: number;
  /** Code of the course that must be completed first, or null if there is none. */
  readonly prerequisiteCode: string | null;
}

export interface CourseCatalogue {
  readonly season: string;
  readonly courses: readonly Course[];
}
