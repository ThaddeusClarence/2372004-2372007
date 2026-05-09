@extends('layouts.admin')

@section('title', 'Vehicles')

@section('content')
<div class="flex justify-between items-center mb-6">
    <h2 class="text-lg font-semibold text-gray-800">All Vehicles</h2>
    <a href="{{ route('admin.vehicles.create') }}" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
        + Add Vehicle
    </a>
</div>

<div class="bg-white rounded-lg shadow overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plate Number</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            @forelse($vehicles as $vehicle)
            <tr>
                <td class="px-6 py-4 text-sm text-gray-500">{{ $vehicle->vehicle_id }}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ $vehicle->plate_number }}</td>
                <td class="px-6 py-4 text-sm text-gray-700">{{ $vehicle->vehicle_type ?? '-' }}</td>
                <td class="px-6 py-4 text-sm text-gray-700">{{ $vehicle->capacity }} seats</td>
                <td class="px-6 py-4">
                    @php
                        $colors = ['active' => 'green', 'maintenance' => 'yellow', 'retired' => 'red'];
                        $color = $colors[$vehicle->status] ?? 'gray';
                    @endphp
                    <span class="px-2 py-1 text-xs rounded-full bg-{{ $color }}-100 text-{{ $color }}-800">{{ ucfirst($vehicle->status) }}</span>
                </td>
                <td class="px-6 py-4 text-sm space-x-2">
                    <a href="{{ route('admin.vehicles.edit', $vehicle) }}" class="text-blue-600 hover:text-blue-800">Edit</a>
                    <form action="{{ route('admin.vehicles.destroy', $vehicle) }}" method="POST" class="inline" onsubmit="return confirm('Are you sure you want to delete this vehicle?')">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="text-red-600 hover:text-red-800">Delete</button>
                    </form>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">No vehicles found.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>
@endsection
