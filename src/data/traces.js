// Agent runs shown in the console at the top of the home page.
//
// PLACEHOLDER: these follow the agent's real tool names and behaviour, but the
// exact wording must be replaced with the logged example conversations from the
// goodfoods-agent README before the site goes live. Set TRACE_SOURCE to
// 'Replayed from a logged run · no live model' once they are, and TRACE_SOURCE_SHORT
// (shown where the console is too narrow for the full line) to 'Logged run · no live model'.
export const TRACE_SOURCE = 'Sample run · to be replaced with a logged one';
export const TRACE_SOURCE_SHORT = 'Sample run · not yet logged';

export const traces = [
  {
    id: 'full',
    label: 'Table for 4, Wok Street, 8 pm',
    lines: [
      { who: 'guest', text: 'Table for 4 at Wok Street tonight, 8 pm' },
      { who: 'tool', text: 'check_availability(outlet="Wok Street", time="20:00", party=4)' },
      { who: 'result', text: 'full · same outlet free at 18:30, 21:30' },
      { who: 'agent', text: 'Wok Street is full at 8. I can do 6:30 or 9:30 tonight.' },
      { who: 'guest', text: '9:30 works. Name is Rohan.' },
      { who: 'tool', text: 'make_reservation(…, time="21:30", party=4)' },
      { who: 'gate', text: 'gate · write held until the guest says yes' },
      { who: 'agent', text: '4 people at Wok Street, today 9:30 pm, under Rohan. Shall I book it?' },
      { who: 'guest', text: 'Yes' },
      { who: 'tool', text: 'make_reservation(…) → booked' },
      { who: 'agent', text: 'Booked. Your reference is on screen.' },
    ],
  },
  {
    id: 'large',
    label: 'Party of 25',
    lines: [
      { who: 'guest', text: 'Can you book a table for 25 on Saturday?' },
      { who: 'agent', text: 'Online bookings go up to 12 people. I can pass this to the events team.' },
      { who: 'guest', text: 'Yes please' },
      { who: 'tool', text: 'request_human_handoff(reason="party of 25")' },
      { who: 'result', text: 'ticket created' },
      { who: 'agent', text: 'Done. The team has your request and will call you back.' },
    ],
  },
  {
    id: 'modify',
    label: 'Move my booking',
    lines: [
      { who: 'guest', text: 'Move my booking to 9 pm' },
      { who: 'tool', text: 'get_reservation(id=…)' },
      { who: 'result', text: 'found · 4 people, 8 pm' },
      { who: 'tool', text: 'modify_reservation(…, time="21:00")' },
      { who: 'gate', text: 'gate · write held until the guest says yes' },
      { who: 'agent', text: 'Change it from 8 pm to 9 pm? Reply yes to confirm.' },
      { who: 'guest', text: 'Yes' },
      { who: 'tool', text: 'modify_reservation(…) → updated' },
      { who: 'agent', text: 'Updated to 9 pm.' },
    ],
  },
];
