<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\BookingDetail;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    public function index()
    {
        $bookings = Booking::with(['user', 'schedule.route', 'details'])->get();
        return response()->json($bookings);
    }

    public function store(Request $request)
    {
        $request->validate([
            'schedule_id' => 'required|exists:schedules,id',
            'seats' => 'required|array|min:1',
            'seats.*' => 'integer',
        ]);

        $schedule = Schedule::find($request->schedule_id);
        
        // Check seat availability
        $takenSeats = BookingDetail::whereHas('booking', function($q) use ($request) {
            $q->where('schedule_id', $request->schedule_id)
              ->whereIn('status', ['pending', 'confirmed']);
        })->pluck('seat_number')->toArray();

        foreach ($request->seats as $seat) {
            if (in_array($seat, $takenSeats)) {
                return response()->json(['message' => "Seat $seat is already taken"], 422);
            }
        }

        try {
            DB::beginTransaction();

            $booking = Booking::create([
                'user_id' => auth()->id() ?? 1, // Fallback to 1 for testing if not auth
                'schedule_id' => $request->schedule_id,
                'booking_code' => strtoupper(Str::random(8)),
                'total_price' => $schedule->price * count($request->seats),
                'status' => 'pending',
                'payment_status' => 'unpaid',
            ]);

            foreach ($request->seats as $seat) {
                BookingDetail::create([
                    'booking_id' => $booking->id,
                    'seat_number' => $seat,
                ]);
            }

            DB::commit();

            return response()->json($booking->load('details'), 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['message' => 'Failed to create booking', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Booking $booking)
    {
        return response()->json($booking->load(['user', 'schedule.route', 'details']));
    }

    public function updateStatus(Request $request, Booking $booking)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,cancelled,completed',
            'payment_status' => 'in:unpaid,paid,refunded',
        ]);

        $booking->update($request->only(['status', 'payment_status']));
        return response()->json($booking);
    }
}
