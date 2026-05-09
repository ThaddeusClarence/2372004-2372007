<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Route;
use App\Models\Schedule;
use App\Models\Vehicle;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'vehicles' => Vehicle::count(),
            'routes' => Route::count(),
            'schedules' => Schedule::count(),
            'bookings' => Booking::count(),
            'active_vehicles' => Vehicle::where('status', 'active')->count(),
            'pending_bookings' => Booking::where('status', 'pending')->count(),
            'confirmed_bookings' => Booking::where('status', 'confirmed')->count(),
            'available_schedules' => Schedule::where('status', 'available')->count(),
        ];

        $recent_bookings = Booking::with(['user', 'schedule.route'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return view('admin.dashboard', compact('stats', 'recent_bookings'));
    }
}
