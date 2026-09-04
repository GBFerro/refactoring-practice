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

/**
 * Everything the waiting-room board, billing and reminders need, already resolved for
 * whichever kind of patient this is. Nothing that reads a Patient ever has to ask which
 * kind it has - the two factories below are the only code that knows.
 */
export interface Patient {
  readonly id: string;
  readonly isUnknown: boolean;
  readonly displayName: string;
  readonly contactPhoneLine: string;
  readonly insuranceLabel: string;
  readonly dateOfBirthLine: string;
  readonly nextOfKinLine: string;
  readonly requiresIdArmband: boolean;
  readonly waitingRoomSortKey: string;
  readonly isBillable: boolean;
  readonly followUpEligible: boolean;
}

const REGISTERED_DEFAULTS = {
  isUnknown: false,
  requiresIdArmband: false,
  isBillable: true,
  followUpEligible: true,
};

/** A patient who has completed registration at the front desk. */
export function registeredPatient(data: RegisteredPatientData): Patient {
  return {
    ...REGISTERED_DEFAULTS,
    id: data.id,
    displayName: data.name,
    contactPhoneLine: data.phone,
    insuranceLabel: data.insuranceProvider ?? "Self-pay",
    dateOfBirthLine: data.dateOfBirthIso,
    nextOfKinLine: data.nextOfKinPhone ?? "None on file",
    waitingRoomSortKey: data.name,
  };
}

/**
 * A placeholder for someone the clinic is seeing before registration is complete -
 * brought in by a relative, or booked over the phone with no chart open yet.
 */
const UNKNOWN_PATIENT: Patient = {
  id: "unknown",
  isUnknown: true,
  displayName: "Unidentified Patient",
  contactPhoneLine: "No contact on file",
  insuranceLabel: "Pending identification",
  dateOfBirthLine: "DOB unknown",
  nextOfKinLine: "Not available",
  requiresIdArmband: true,
  waitingRoomSortKey: "\uFFFF",
  isBillable: false,
  followUpEligible: false,
};

export function unknownPatient(): Patient {
  return UNKNOWN_PATIENT;
}
