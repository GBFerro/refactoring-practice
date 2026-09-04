import { bookPriority, bookStandard } from "./book";
import type { Order, Receipt, Section } from "./booking";

/** A block large enough that the box office holds it like a walk-up, sight unseen. */
const GROUP_PRIORITY_THRESHOLD = 8;

/** A walk-up sale at the counter: the customer is standing right there, so it is confirmed now or not at all. */
export function bookAtCounter(section: Section, order: Order): Receipt {
  return bookPriority(section, order);
}

/** A mail-in order form: the ordinary path, waitlisted rather than refused if the section fills up first. */
export function bookByMail(section: Section, order: Order): Receipt {
  return bookStandard(section, order);
}

/** A phone order: large blocks get the same white-glove handling as a walk-up. */
export function bookByPhone(section: Section, order: Order): Receipt {
  return order.seatCount >= GROUP_PRIORITY_THRESHOLD
    ? bookPriority(section, order)
    : bookStandard(section, order);
}
