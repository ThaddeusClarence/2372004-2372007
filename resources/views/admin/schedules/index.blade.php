@extends('layouts.admin')

@section('title', 'Schedules')

@section('content')
<div class="flex justify-between items-center mb-6">
    <h2 class="text-lg font-semibold text-gray-800">All Schedules</h2>
    <a href="{{ route('admin.schedules.create') }}" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
        + Add Schedule
    </a>
</div>

<div class="bg-white rounded-lg shadow overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departure</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrival Est.</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            @forelse($schedules as $schedule)
            <tr>
                <td class="px-6 py-4 text-sm text-gray-500">{{ $schedule->schedule_id }}</td>
                <td class="px-6 py-4 text-sm text-gray-900">
                    @if($schedule->route)
                        {{ $schedule->route->origin_city }} &rarr; {{ $schedule->route->destination_city }}
                    @else
                        -
                    @endif
                </td>
                <td class="px-6 py-4 text-sm text-gray-700">
                    @if($schedule->vehicle)
                        {{ $schedule->vehicle->plate_number }} ({{ $schedule->vehicle->vehicle_type }})
                    @else
                        -
                    @endif
                </td>
                <td class="px-6 py-4 text-sm text-gray-700">{{ $schedule->departure_time->format('d M Y H:i') }}</td>
                <td class="px-6 py-4 text-sm text-gray-700">{{ $schedule->arrival_estimate ? $schedule->arrival_estimate->format('d M Y H:i') : '-' }}</td>
                <td class="px-6 py-4 text-sm text-gray-700">Rp {{ number_format($schedule->price, 0, ',', '.') }}</td>
                <td class="px-6 py-4">
                    @php
                        $colors = ['available' => 'green', 'full' => 'yellow', 'cancelled' => 'red', 'departed' => 'blue'];
                        $color = $colors[$schedule->status] ?? 'gray';
                    @endphp
                    <span class="px-2 py-1 text-xs rounded-full bg-{{ $color }}-100 text-{{ $color }}-800">{{ ucfirst($schedule->status) }}</span>
                </td>
                <td class="px-6 py-4 text-sm space-x-2">
                    <a href="{{ route('admin.schedules.edit', $schedule) }}" class="text-blue-600 hover:text-blue-800">Edit</a>
                    <form action="{{ route('admin.schedules.destroy', $schedule) }}" method="POST" class="inline" onsubmit="return confirm('Are you sure you want to delete this schedule?')">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="text-red-600 hover:text-red-800">Delete</button>
                    </form>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="8" class="px-6 py-4 text-center text-gray-500">No schedules found.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>
@endsection
