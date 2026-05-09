@extends('layouts.admin')

@section('title', 'Edit Vehicle')

@section('content')
<div class="max-w-2xl">
    <div class="mb-6">
        <a href="{{ route('admin.vehicles.index') }}" class="text-sm text-blue-600 hover:text-blue-800">&larr; Back to Vehicles</a>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <form action="{{ route('admin.vehicles.update', $vehicle) }}" method="POST">
            @csrf
            @method('PUT')

            <div class="mb-4">
                <label for="plate_number" class="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                <input type="text" name="plate_number" id="plate_number" value="{{ old('plate_number', $vehicle->plate_number) }}"
                       class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
            </div>

            <div class="mb-4">
                <label for="vehicle_type" class="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select name="vehicle_type" id="vehicle_type" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select type</option>
                    <option value="Bus" {{ old('vehicle_type', $vehicle->vehicle_type) == 'Bus' ? 'selected' : '' }}>Bus</option>
                    <option value="Minibus" {{ old('vehicle_type', $vehicle->vehicle_type) == 'Minibus' ? 'selected' : '' }}>Minibus</option>
                    <option value="Shuttle" {{ old('vehicle_type', $vehicle->vehicle_type) == 'Shuttle' ? 'selected' : '' }}>Shuttle</option>
                </select>
            </div>

            <div class="mb-4">
                <label for="capacity" class="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input type="number" name="capacity" id="capacity" value="{{ old('capacity', $vehicle->capacity) }}" min="1"
                       class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
            </div>

            <div class="mb-6">
                <label for="status" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select name="status" id="status" class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                    <option value="active" {{ old('status', $vehicle->status) == 'active' ? 'selected' : '' }}>Active</option>
                    <option value="maintenance" {{ old('status', $vehicle->status) == 'maintenance' ? 'selected' : '' }}>Maintenance</option>
                    <option value="retired" {{ old('status', $vehicle->status) == 'retired' ? 'selected' : '' }}>Retired</option>
                </select>
            </div>

            <div class="flex gap-3">
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Update Vehicle</button>
                <a href="{{ route('admin.vehicles.index') }}" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">Cancel</a>
            </div>
        </form>
    </div>
</div>
@endsection
