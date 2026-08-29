import { describe, expect, it } from "vitest";
import { Member, type MemberProps } from "@exercise";

/**
 * Characterization tests. They are green before you touch anything and they must stay
 * green after every micro-step of pulling the contact cluster out of Member. Do not edit
 * this file: if a refactoring seems to require changing a test, either the refactoring
 * changed behaviour or the exercise is wrong.
 *
 * There is one test per behaviour a plausible Extract Class could silently change - not
 * one per method. Each test names the move it is guarding against.
 */

const priya: MemberProps = {
  id: "M-1042",
  name: "Priya Chandran",
  membershipTier: "family",
  joinedOn: "2021-06-15",
  addressLine1: "12 Elm Street",
  addressLine2: "Apt 4B",
  city: "Marlowe",
  postalCode: "01960",
  phone: "5551234567",
  email: "priya.chandran@example.com",
  preferredContactMethod: "email",
};

const owen: MemberProps = {
  id: "M-2091",
  name: "Owen Bramwell",
  membershipTier: "standard",
  joinedOn: "2019-01-03",
  addressLine1: "88 Harbor Road",
  addressLine2: null,
  city: "Marlowe",
  postalCode: "01960",
  phone: "5559876543",
  email: "owen.b@example.com",
  preferredContactMethod: "phone",
};

const ada: MemberProps = {
  id: "M-3007",
  name: "Ada Level",
  membershipTier: "senior",
  joinedOn: "2015-09-30",
  addressLine1: "4 Cobble Court",
  addressLine2: "Unit 2",
  city: "Riverside",
  postalCode: "01962",
  phone: "5550001111",
  email: "ada.l@example.com",
  preferredContactMethod: "post",
};

describe("Member", () => {
  // Guards against reordering the card, or losing a line, when the composing method
  // moves alongside the fields it reads.
  it("renders the summary card as name, then membership, then the preferred contact line", () => {
    const member = new Member(priya);
    expect(member.summaryCard()).toBe(
      [
        "Priya Chandran",
        "Family member since 2021",
        "Email: priya.chandran@example.com",
      ].join("\n"),
    );
  });

  // Guards the phone formatting rule surviving the move into the extracted class.
  it("groups a phone-preferred contact line into (area) exchange-line", () => {
    const member = new Member(owen);
    expect(member.contactLine()).toBe("Phone: (555) 987-6543");
    expect(member.formattedPhone()).toBe("(555) 987-6543");
  });

  // Guards against the post-preferred line and the mailing address block drifting apart -
  // they must share the same address-building logic, just joined differently.
  it("joins a post-preferred contact line with commas, not the newlines mailingAddress uses", () => {
    const member = new Member(ada);
    expect(member.contactLine()).toBe("Post: 4 Cobble Court, Unit 2, Riverside 01962");
    expect(member.mailingAddress()).toBe("4 Cobble Court\nUnit 2\nRiverside 01962");
  });

  // Guards the null-branch of the address block: no blank line, no stray comma.
  it("omits the second address line from the mailing address when none was given", () => {
    const member = new Member(owen);
    expect(member.mailingAddress()).toBe("88 Harbor Road\nMarlowe 01960");
  });

  // The opposite boundary: when a second line exists, it sits between the street and
  // the city - a step that flattens the address into one array too early would drop it.
  it("keeps the second address line between the street and the city when one was given", () => {
    const member = new Member(priya);
    expect(member.mailingAddress()).toBe("12 Elm Street\nApt 4B\nMarlowe 01960");
  });

  // Guards the tier-label capitalisation and the year-only slice of the join date -
  // easy to break if the extracted class starts reading a field it was not given.
  it("capitalizes the membership tier and keeps only the year from the join date", () => {
    const member = new Member(ada);
    expect(member.membershipSummary()).toBe("Senior member since 2015");
  });

  // Boundary: phone digits are formatted as a string, never routed through a numeric
  // type that would silently drop a leading zero.
  it("keeps a leading zero in the area code when formatting the phone number", () => {
    const member = new Member({ ...owen, phone: "0123456789" });
    expect(member.formattedPhone()).toBe("(012) 345-6789");
  });

  // Guards the identity getters staying reachable on their own, not only through the
  // composed card.
  it("exposes id and name independently of the summary card", () => {
    const member = new Member(priya);
    expect(member.id).toBe("M-1042");
    expect(member.name).toBe("Priya Chandran");
  });
});
