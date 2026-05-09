<?php

namespace App\Http\Controllers;

use App\Models\Route;
use Illuminate\Http\Request;

class RouteController extends Controller
{
    public function index()
    {
        return response()->json(Route::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'origin' => 'required|string',
            'destination' => 'required|string',
            'distance' => 'required|numeric',
        ]);

        return response()->json(Route::create($validated), 201);
    }
}
