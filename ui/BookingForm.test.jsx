import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BookingForm } from './App.jsx';

const room = { id: 'cedar', name: 'Cedar', capacity: 4 };
const date = '2030-06-12';

function jsonResponse(status, body) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

function fillForm() {
  fireEvent.change(screen.getByTestId('booking-form-title-input'), { target: { value: 'Design review' } });
  fireEvent.change(screen.getByTestId('booking-form-organizer-input'), { target: { value: 'Sam Rivera' } });
  fireEvent.change(screen.getByTestId('booking-form-start-time-input'), { target: { value: '09:00' } });
  fireEvent.change(screen.getByTestId('booking-form-end-time-input'), { target: { value: '10:00' } });
}

function submit() {
  fireEvent.click(screen.getByTestId('booking-form-submit-button'));
}

describe('BookingForm conflict handling', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('displays the server conflict message, including the conflicting interval and title, on a 409 response', async () => {
    const conflictMessage = 'This room is already booked from 2030-06-12T09:00:00.000Z to 2030-06-12T10:00:00.000Z for "Design review".';
    global.fetch.mockReturnValue(jsonResponse(409, { error: conflictMessage }));

    render(<BookingForm room={room} date={date} onBooked={vi.fn()} />);
    fillForm();
    submit();

    const alert = await screen.findByTestId('booking-form-error');
    expect(alert).toHaveTextContent(conflictMessage);
  });

  it('keeps title, organizer, and submitted time values after a conflict so only the time needs adjusting', async () => {
    global.fetch.mockReturnValue(jsonResponse(409, { error: 'This room is already booked from 2030-06-12T09:00:00.000Z to 2030-06-12T10:00:00.000Z for "Design review".' }));

    render(<BookingForm room={room} date={date} onBooked={vi.fn()} />);
    fillForm();
    submit();

    await screen.findByTestId('booking-form-error');
    expect(screen.getByTestId('booking-form-title-input')).toHaveValue('Design review');
    expect(screen.getByTestId('booking-form-organizer-input')).toHaveValue('Sam Rivera');
    expect(screen.getByTestId('booking-form-start-time-input')).toHaveValue('09:00');
    expect(screen.getByTestId('booking-form-end-time-input')).toHaveValue('10:00');
  });

  it('clears the form and reports the created booking on a successful (non-conflicting) submission', async () => {
    const booking = {
      id: 'b1', roomId: 'cedar', title: 'Design review', organizer: 'Sam Rivera',
      startTime: '2030-06-12T09:00:00.000Z', endTime: '2030-06-12T10:00:00.000Z',
    };
    global.fetch.mockReturnValue(jsonResponse(201, booking));
    const onBooked = vi.fn();

    render(<BookingForm room={room} date={date} onBooked={onBooked} />);
    fillForm();
    submit();

    await waitFor(() => expect(onBooked).toHaveBeenCalledWith(booking));
    expect(screen.getByTestId('booking-form-title-input')).toHaveValue('');
    expect(screen.getByTestId('booking-form-organizer-input')).toHaveValue('');
    expect(screen.queryByTestId('booking-form-error')).not.toBeInTheDocument();
  });
});
