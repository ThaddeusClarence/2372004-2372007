@extends('layouts.admin')

@section('title', 'Edit Schedule')

@section('content')
<div class="max-w-2xl">
    <div class="mb-6">
        <a href="{{ route('admin.schedules.index') }}" class="text-sm text-blue-600 hover:text-blue-800">&larr; Back to Schedules</a>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <form action="{{ route('admin.schedules.update', $schedule) }}" method="POST">
            @csrf
            @method('PUT')

            <div class="mb-4">
                <label for="route_id" class="block text-sm font-medium text-gray-700 mb-1">Route</label>
                <select name="route_id" id="route_id" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                    <option value="">Select route</option>
                    @foreach($routes as $route)
                        <option value="{{ $route->route_id }}" {{ old('route_id', $schedule->route_id) == $route->route_id ? 'selected' : '' }}>
                            {{ $route->origin_city }} &rarr; {{ $route->destination_city }} ({{ $route->distance_km ?? '?' }} km)
                        </option>
                    @endforeach
                </select>
            </div>

            <div class="mb-4">
                <label for="vehicle_id" class="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <select name="vehicle_id" id="vehicle_id" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                    <option value="">Select vehicle</option>
                    @foreach($vehicles as $vehicle)
                        <option value="{{ $vehicle->vehicle_id }}" {{ old('vehicle_id', $schedule->vehicle_id) == $vehicle->vehicle_id ? 'selected' : '' }}>
                            {{ $vehicle->plate_number }} - {{ $vehicle->vehicle_type }} ({{ $vehicle->capacity }} seats)
                        </option>
                    @endforeach
                </select>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label for="departure_time" class="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                    <input type="datetime-local" name="departure_time" id="departure_time"
                           value="{{ old('departure_time', $schedule->departure_time->format('Y-m-d\TH:i')) }}"
                           class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                </div>
                <div>
                    <label for="arrival_estimate" class="block text-sm font-medium text-gray-700 mb-1">Arrival Estimate</label>
                    <input type="datetime-local" name="arrival_estimate" id="arrival_estimate"
                           value="{{ old('arrival_estimate', $schedule->arrival_estimate ? $schedule->arrival_estimate->format('Y-m-d\TH:i') : '') }}"
                           class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                </div>
            </div>

            <div class="mb-4">
                <label for="price" class="block text-sm font-medium text-gray-700 mb-1">Price (Rp)</label>
                <input type="number" name="price" id="price" value="{{ old('price', $schedule->price) }}" min="0" step="1000"
                       class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
            </div>

            <div class="mb-6">
                <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" id="status" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                    <option value="available" {{ old('status', $schedule->status) == 'available' ? 'selected' : '' }}>Available</option>
                    <option value="full" {{ old('status', $schedule->status) == 'full' ? 'selected' : '' }}>Full</option>
                    <option value="cancelled" {{ old('status', $schedule->status) == 'cancelled' ? 'selected' : '' }}>Cancelled</option>
                    <option value="departed" {{ old('status', $schedule->status) == 'departed' ? 'selected' : '' }}>Departed</option>
                </select>
            </div>

            <div class="flex gap-3">
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Update Schedule</button>
                <a href="{{ route('admin.schedules.index') }}" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">Cancel</a>
            </div>
        </form>
    </div>
</div>
@endsection
