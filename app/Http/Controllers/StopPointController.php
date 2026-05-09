<?php

namespace App\Http\Controllers;

use App\Models\StopPoint;
use Illuminate\Http\Request;

class StopPointController extends Controller
{
    public function index()
    {
        return response()->json(StopPoint::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'address' => 'required|string',
            'type' => 'required|in:pickup,dropoff',
        ]);

        return response()->json(StopPoint::create($validated), 201);
    }
}
