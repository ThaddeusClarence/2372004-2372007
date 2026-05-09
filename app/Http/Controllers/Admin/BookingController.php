<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index()
    {
        $bookings = Booking::with(['user', 'schedule.route', 'bookingSeats.seat'])->orderBy('created_at', 'desc')->get();
        return view('admin.bookings.index', compact('bookings'));
    }

    public function show(Booking $booking)
    {
        $booking->load(['user', 'schedule.route', 'bookingSeats.seat', 'passengers', 'payment']);
        return view('admin.bookings.show', compact('booking'));
    }

    public function updateStatus(Request $request, Booking $booking)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,cancelled,expired',
        ]);

        $booking->update($request->only(['status']));

        return redirect()->route('admin.bookings.index')->with('success', 'Booking status updated.');
    }
}
