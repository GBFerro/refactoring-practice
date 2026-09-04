/** What the front desk types in once a patient completes registration. */
export interface RegisteredPatientData {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly dateOfBirthIso: string;
  /** null means self-pay - the patient carries no insurance on file. */
  readonly insuranceProvider: string | null;
  readonly nextOfKinPhone: string | null;
}

export type Patient = RegisteredPatientData;

/** A patient who has completed registration at the front desk. */
export function registeredPatient(data: RegisteredPatientData): Patient {
  return data;
}

/**
 * A placeholder for someone the clinic is seeing before registration is complete -
 * brought in by a relative, or booked over the phone with no chart open yet. Every board
 * function below recognises this record by its sentinel id: "unknown".
 */
export function unknownPatient(): Patient {
  return {
    id: "unknown",
    name: "Unidentified Patient",
    phone: "",
    dateOfBirthIso: "",
    insuranceProvider: null,
    nextOfKinPhone: null,
  };
}
