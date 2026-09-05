import { Student } from "./student";

const TRIAL_FEE_FACTOR = 0.5;

/**
 * A one-term trial enrolment, before a student commits to ongoing lessons.
 * Trial students used to be handled quite differently - no instrument rental, a shorter
 * notice period to leave, priority re-booking into the following term. Those rules have
 * all been retired or folded back into how every student is treated. The discounted fee
 * below is the only thing this class still does that Student does not.
 */
export class TrialStudent extends Student {
  override termFeeCents(): number {
    return Math.round(this.input.baseFeeCents * TRIAL_FEE_FACTOR);
  }

  override kindLabel(): string {
    return "Trial";
  }
}
