<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Route;
use App\Models\Schedule;
use App\Models\Vehicle;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index()
    {
        $schedules = Schedule::with(['vehicle', 'route'])->get();
        return view('admin.schedules.index', compact('schedules'));
    }

    public function create()
    {
        $vehicles = Vehicle::where('status', 'active')->get();
        $routes = Route::all();
        return view('admin.schedules.create', compact('vehicles', 'routes'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,vehicle_id',
            'route_id' => 'required|exists:routes,route_id',
            'departure_time' => 'required|date',
            'arrival_estimate' => 'required|date|after:departure_time',
            'price' => 'required|numeric|min:0',
            'status' => 'required|string|in:available,full,cancelled,departed',
        ]);

        Schedule::create($validated);

        return redirect()->route('admin.schedules.index')->with('success', 'Schedule created successfully.');
    }

    public function edit(Schedule $schedule)
    {
        $vehicles = Vehicle::where('status', 'active')->get();
        $routes = Route::all();
        return view('admin.schedules.edit', compact('schedule', 'vehicles', 'routes'));
    }

    public function update(Request $request, Schedule $schedule)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,vehicle_id',
            'route_id' => 'required|exists:routes,route_id',
            'departure_time' => 'required|date',
            'arrival_estimate' => 'required|date|after:departure_time',
            'price' => 'required|numeric|min:0',
            'status' => 'required|string|in:available,full,cancelled,departed',
        ]);

        $schedule->update($validated);

        return redirect()->route('admin.schedules.index')->with('success', 'Schedule updated successfully.');
    }

    public function destroy(Schedule $schedule)
    {
        $schedule->delete();
        return redirect()->route('admin.schedules.index')->with('success', 'Schedule deleted successfully.');
    }
}
