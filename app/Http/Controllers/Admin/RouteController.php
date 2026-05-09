<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Route;
use Illuminate\Http\Request;

class RouteController extends Controller
{
    public function index()
    {
        $routes = Route::withCount('schedules')->get();
        return view('admin.routes.index', compact('routes'));
    }

    public function create()
    {
        return view('admin.routes.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'origin_city' => 'required|string|max:100',
            'destination_city' => 'required|string|max:100',
            'distance_km' => 'nullable|integer|min:1',
            'duration' => 'nullable|date_format:H:i',
        ]);

        Route::create($validated);

        return redirect()->route('admin.routes.index')->with('success', 'Route created successfully.');
    }

    public function edit(Route $route)
    {
        return view('admin.routes.edit', compact('route'));
    }

    public function update(Request $request, Route $route)
    {
        $validated = $request->validate([
            'origin_city' => 'required|string|max:100',
            'destination_city' => 'required|string|max:100',
            'distance_km' => 'nullable|integer|min:1',
            'duration' => 'nullable|date_format:H:i',
        ]);

        $route->update($validated);

        return redirect()->route('admin.routes.index')->with('success', 'Route updated successfully.');
    }

    public function destroy(Route $route)
    {
        $route->delete();
        return redirect()->route('admin.routes.index')->with('success', 'Route deleted successfully.');
    }
}
