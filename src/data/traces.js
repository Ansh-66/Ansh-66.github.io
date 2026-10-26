// Agent runs shown in the console at the top of the home page.
//
// The example conversations from the goodfoods-agent README ("Example conversations"): real runs of the app
// (gpt-oss-20b on Groq), recorded on 20 Oct 2026 and copied as they happened, slips included. Tool calls and their
// outcomes are as the README gives them ("→ ok", or held by the confirmation gate). The only change: guests' phone
// numbers are shown as [withheld], since the site carries no phone numbers.
// TRACE_SOURCE_SHORT is shown where the console is too narrow for the full line (see .console-note in styles.css).
export const TRACE_SOURCE = 'Logged run · gpt-oss-20b · 20 Oct 2026';
export const TRACE_SOURCE_SHORT = 'Logged run · 20 Oct 2026';

const HELD = 'held until the guest confirms';

export const traces = [
  {
    id: 'booking',
    label: 'Italian for 4, Friday 8 pm',
    lines: [
      { who: 'guest', text: 'Dinner for 4 this Friday at 8 pm, somewhere Italian near Koramangala' },
      { who: 'tool', text: 'recommend_restaurants(area="Koramangala", cuisine="Italian", date="2026-10-23", time="20:00", party_size=4) → ok' },
      {
        who: 'agent',
        text:
          'Here are three good options for Italian dinner near Koramangala on Friday 23 Oct at 8 pm for 4 people:\n' +
          '1. GoodFoods Trattoria, Jayanagar – 3 km away, 4.7 rating, 120 seats, free at 8 pm.\n' +
          '2. GoodFoods Trattoria, Ulsoor – 5.7 km away, 4.1 rating, 80 seats, free at 8 pm.\n' +
          '3. GoodFoods Trattoria, Bannerghatta Road – 5.6 km away, 3.9 rating, 40 seats, free at 8 pm.\n' +
          'Which outlet would you like to book?',
      },
      { who: 'guest', text: 'The first one sounds good. Book it under Ansh, [withheld]' },
      { who: 'tool', text: 'check_availability(restaurant_id="R029", date="2026-10-23", time="20:00", party_size=4) → ok' },
      { who: 'tool', text: 'make_reservation(restaurant_id="R029", date="2026-10-23", time="20:00", party_size=4, guest_name="Ansh", guest_phone=[withheld])' },
      { who: 'gate', text: HELD },
      {
        who: 'agent',
        text:
          'Your reservation details are:\n' +
          '- Date: Friday 23 Oct\n- Time: 8 pm\n- Outlet: GoodFoods Trattoria, Jayanagar\n- Party size: 4\n- Guest name: Ansh\n- Phone: [withheld]\n' +
          'Do you confirm this booking?',
      },
      { who: 'guest', text: 'Yes, please confirm' },
      { who: 'tool', text: 'make_reservation(…same arguments…) → ok' },
      { who: 'agent', text: 'All set! Your table is confirmed for Friday 23 Oct at 8 pm for 4 people at GoodFoods Trattoria, Jayanagar.\nBooking ID: GFGKXDDB.\nEnjoy your dinner!' },
    ],
  },
  {
    id: 'full',
    label: 'Wok Street is full',
    lines: [
      { who: 'guest', text: 'Can I get a table for 2 at Wok Street in Whitefield this Friday at 8 pm?' },
      { who: 'tool', text: 'recommend_restaurants(name="Wok Street", area="Whitefield", date="2026-10-23", time="20:00", party_size=2) → ok' },
      {
        who: 'agent',
        text:
          'The GoodFoods Wok Street outlet in Whitefield is fully booked at 8 pm on Friday 23 Oct.\n' +
          'I can offer you a table at 6:30 pm or 9:30 pm at the same outlet, or a 8 pm slot at the nearby Wok Street in Marathahalli or Sarjapur Road.\n' +
          'Which option would you like to book?',
      },
      { who: 'guest', text: '9:30 works. Book it under Meera, [withheld]' },
      { who: 'tool', text: 'check_availability(restaurant_id="R004", date="2026-10-23", time="21:30", party_size=2) → ok' },
      { who: 'tool', text: 'make_reservation(restaurant_id="R004", date="2026-10-23", time="21:30", party_size=2, guest_name="Meera", guest_phone=[withheld])' },
      { who: 'gate', text: HELD },
      { who: 'agent', text: 'Your table is set for 9:30 pm on Friday 23 Oct at GoodFoods Wok Street, Whitefield, for 2 people under the name Meera (phone [withheld]).\nDo you confirm this booking?' },
      { who: 'guest', text: 'Yes, confirm' },
      { who: 'tool', text: 'make_reservation(…same arguments…) → ok' },
      {
        who: 'agent',
        text: 'All set! Your booking is confirmed:\nGoodFoods Wok Street, Whitefield\nDate: Friday 23 Oct\nTime: 9:30 pm\nParty: 2\nGuest: Meera ([withheld])\nBooking ID: GF9KUQY4\nEnjoy your meal!',
      },
    ],
  },
  {
    id: 'change',
    label: 'Change, then cancel',
    lines: [
      { who: 'guest', text: 'Please change my booking GFGKXDDB to 6 people' },
      { who: 'tool', text: 'modify_reservation(reservation_id="GFGKXDDB", party_size=6)' },
      { who: 'gate', text: HELD },
      { who: 'agent', text: "I've updated the booking to 6 people.\nIs that correct? If so, I'll finalize the change." },
      { who: 'guest', text: "Yes, that's right" },
      { who: 'tool', text: 'modify_reservation(…same arguments…) → ok' },
      {
        who: 'agent',
        text: 'Your reservation has been updated to 6 people.\nBooking ID: GFGKXDDB\nGoodFoods Trattoria, Jayanagar – 196, 12th Cross, Jayanagar, Bengaluru\nDate: Friday 23 Oct, Time: 8 pm.\nEnjoy your meal!',
      },
      { who: 'guest', text: 'Actually, please cancel it' },
      { who: 'tool', text: 'cancel_reservation(reservation_id="GFGKXDDB")' },
      { who: 'gate', text: HELD },
      { who: 'agent', text: "Your booking GFGKXDDB is set to be cancelled.\nIs that correct? If so, I'll proceed with the cancellation." },
      { who: 'guest', text: 'Yes, cancel it' },
      { who: 'tool', text: 'cancel_reservation(…same arguments…) → ok' },
      { who: 'agent', text: 'Your reservation has been cancelled.\nIf you need anything else, just let me know.' },
    ],
  },
  {
    id: 'large',
    label: 'Party of 25',
    lines: [
      { who: 'guest', text: 'Table for 25 people tomorrow evening in Indiranagar' },
      { who: 'agent', text: "I'm sorry, but I can't handle a table for 25 people. I'll connect you with a GoodFoods staff member who can arrange that. Could you please share your name and phone number?" },
      { who: 'guest', text: "Yes please, I'm Rohan, [withheld]" },
      { who: 'tool', text: 'request_human_handoff(reason="large_group", guest_name="Rohan", guest_phone=[withheld], summary="Table for 25 people tomorrow evening in Indiranagar") → ok' },
      { who: 'agent', text: 'Thank you, Rohan. A GoodFoods team member will call you back within 2 working hours. Have a great day!' },
    ],
  },
  {
    id: 'preferences',
    label: 'Anniversary · imperfect run',
    lines: [
      { who: 'guest', text: 'Anniversary dinner for 2 on Saturday at 8 pm, outdoor seating, near Indiranagar' },
      { who: 'tool', text: 'recommend_restaurants(area="Indiranagar", date="2026-10-24", time="20:00", party_size=2, features=["outdoor"]) → ok' },
      { who: 'agent', text: 'Great! Which name would you like on the reservation?' },
      { who: 'guest', text: 'Ansh, [withheld]' },
      { who: 'agent', text: 'Which of the three outlets would you like to book? (R074, R048, or R024)' },
      { who: 'guest', text: 'What time does the first one close, and does it have parking?' },
      { who: 'tool', text: 'get_restaurant_details(restaurant_id="R074") → ok' },
      { who: 'agent', text: 'GoodFoods Andhra Spice closes at 11 pm and it has parking.\nWould you like to reserve a table for 2 on Saturday 24 Oct at 8 pm?' },
    ],
  },
  {
    id: 'guessing',
    label: 'Menu, Mumbai, a past date',
    lines: [
      { who: 'guest', text: "What's on the menu at Trattoria Jayanagar?" },
      { who: 'agent', text: "I'm sorry, but I don't have the menu details for Trattoria Jayanagar. I can share information about the outlet's location, hours, and features if that would help." },
      { who: 'guest', text: 'Do you have an outlet in Mumbai?' },
      { who: 'agent', text: 'GoodFoods is only in Bengaluru. I can help you find an outlet here.' },
      { who: 'guest', text: 'Book a table for 2 yesterday at 8 pm at Wok Street Whitefield, name Ansh' },
      { who: 'agent', text: "I'm sorry, but I can't book a table for a past date. If you'd like to reserve for a future time, just let me know the date and time." },
    ],
  },
];
