import { describe, expect, it } from "vitest";
import {
  Branch,
  canApproveRareBookLoan,
  escalationContact,
  formatManagerCard,
  managerEmailDomain,
  managerSeniorityBadge,
  totalYearsOfService,
} from "@exercise";

/**
 * Characterization tests. They are green before you touch anything and they must stay
 * green after every micro-step of removing the middle man between Branch and Manager. Do
 * not edit this file: if a refactoring seems to require changing a test, either the
 * refactoring changed behaviour or the exercise is wrong.
 *
 * There is one test per behaviour a plausible Remove Middle Man could silently change -
 * not one per function. Each test names the move it is guarding against.
 */

const riverside = new Branch({
  id: "BR-01",
  location: "Riverside",
  manager: {
    name: "Grace Whitfield",
    email: "grace.whitfield@marlowelibrary.org",
    phone: "5551230000",
    certifiedForRareBooks: true,
    yearsOfService: 12,
    onLeave: false,
  },
});

const central = new Branch({
  id: "BR-02",
  location: "Marlowe Central",
  manager: {
    name: "Desmond Okafor",
    email: "desmond.okafor@marlowelibrary.org",
    phone: "5554445555",
    certifiedForRareBooks: false,
    yearsOfService: 4,
    onLeave: false,
  },
});

const hilltop = new Branch({
  id: "BR-03",
  location: "Hilltop",
  manager: {
    name: "Priya Anand",
    email: "priya.anand@marlowelibrary.org",
    phone: "5556667777",
    certifiedForRareBooks: true,
    yearsOfService: 9,
    onLeave: true,
  },
});

const boundary = new Branch({
  id: "BR-04",
  location: "Boundary Test",
  manager: {
    name: "Tomas Reyes",
    email: "notanemail",
    phone: "5559990000",
    certifiedForRareBooks: false,
    yearsOfService: 10,
    onLeave: false,
  },
});

describe("formatManagerCard", () => {
  // Guards the field order and the newline join surviving the move from a forward to a
  // direct read of the manager's own fields.
  it("renders the manager's name, then email, then phone", () => {
    expect(formatManagerCard(riverside)).toBe(
      ["Grace Whitfield", "grace.whitfield@marlowelibrary.org", "5551230000"].join("\n"),
    );
  });
});

describe("canApproveRareBookLoan", () => {
  // Guards every branch of `certified && !onLeave` independently - flipping either
  // operand, or swapping && for ||, would flip exactly one of these three results.
  it("approves only when the manager is certified and not currently on leave", () => {
    expect(canApproveRareBookLoan(riverside)).toBe(true);
    expect(canApproveRareBookLoan(central)).toBe(false);
    expect(canApproveRareBookLoan(hilltop)).toBe(false);
  });
});

describe("managerSeniorityBadge", () => {
  // Guards the >= 10 boundary in both directions.
  it("labels ten years of service as senior and nine as standard", () => {
    expect(managerSeniorityBadge(boundary)).toBe("Senior");
    expect(managerSeniorityBadge(hilltop)).toBe("Standard");
  });
});

describe("escalationContact", () => {
  // Guards the reachable branch composing name and phone in that order.
  it("names the manager and their phone when the manager is reachable", () => {
    expect(escalationContact(riverside)).toBe("Grace Whitfield at 5551230000");
  });

  // Guards the on-leave branch not leaking a name or number nobody can currently reach.
  it("falls back to head office when the manager is on leave", () => {
    expect(escalationContact(hilltop)).toBe("Manager unavailable — contact head office");
  });
});

describe("managerEmailDomain", () => {
  // Guards the ordinary split on "@".
  it("extracts the domain from the manager's email address", () => {
    expect(managerEmailDomain(riverside)).toBe("marlowelibrary.org");
  });

  // Guards the fallback when there is no "@" to split on - the boundary a careless
  // rewrite of the split could turn into a thrown error instead of an empty string.
  it("returns an empty domain when the email has no @ separator", () => {
    expect(managerEmailDomain(boundary)).toBe("");
  });
});

describe("totalYearsOfService", () => {
  // Guards the accumulation across a mix of managers, once per branch.
  it("sums every branch's manager's years of service", () => {
    expect(totalYearsOfService([riverside, central, hilltop])).toBe(25);
  });

  // Guards the empty case, where reduce's initial value is the only thing returned.
  it("returns zero for a directory with no branches", () => {
    expect(totalYearsOfService([])).toBe(0);
  });
});
