<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = Schedule::with(['vehicle', 'route']);

        if ($request->has('origin')) {
            $query->whereHas('route', function($q) use ($request) {
                $q->where('origin', 'like', '%' . $request->origin . '%');
            });
        }

        if ($request->has('destination')) {
            $query->whereHas('route', function($q) use ($request) {
                $q->where('destination', 'like', '%' . $request->destination . '%');
            });
        }

        $schedules = $query->get();
        return response()->json($schedules);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'route_id' => 'required|exists:routes,id',
            'departure_time' => 'required|date',
            'arrival_time' => 'required|date|after:departure_time',
            'price' => 'required|numeric',
        ]);

        $schedule = Schedule::create($validated);
        return response()->json($schedule, 201);
    }

    public function show(Schedule $schedule)
    {
        return response()->json($schedule->load(['vehicle', 'route']));
    }

    public function update(Request $request, Schedule $schedule)
    {
        $validated = $request->validate([
            'vehicle_id' => 'exists:vehicles,id',
            'route_id' => 'exists:routes,id',
            'departure_time' => 'date',
            'arrival_time' => 'date|after:departure_time',
            'price' => 'numeric',
        ]);

        $schedule->update($validated);
        return response()->json($schedule);
    }

    public function destroy(Schedule $schedule)
    {
        $schedule->delete();
        return response()->json(null, 204);
    }
}
