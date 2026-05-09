@extends('layouts.admin')

@section('title', 'Routes')

@section('content')
<div class="flex justify-between items-center mb-6">
    <h2 class="text-lg font-semibold text-gray-800">All Routes</h2>
    <a href="{{ route('admin.routes.create') }}" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
        + Add Route
    </a>
</div>

<div class="bg-white rounded-lg shadow overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origin</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distance</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedules</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            @forelse($routes as $route)
            <tr>
                <td class="px-6 py-4 text-sm text-gray-500">{{ $route->route_id }}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ $route->origin_city }}</td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">{{ $route->destination_city }}</td>
                <td class="px-6 py-4 text-sm text-gray-700">{{ $route->distance_km ? $route->distance_km . ' km' : '-' }}</td>
                <td class="px-6 py-4 text-sm text-gray-700">{{ $route->duration ?? '-' }}</td>
                <td class="px-6 py-4 text-sm text-gray-700">{{ $route->schedules_count }}</td>
                <td class="px-6 py-4 text-sm space-x-2">
                    <a href="{{ route('admin.routes.edit', $route) }}" class="text-blue-600 hover:text-blue-800">Edit</a>
                    <form action="{{ route('admin.routes.destroy', $route) }}" method="POST" class="inline" onsubmit="return confirm('Are you sure you want to delete this route?')">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="text-red-600 hover:text-red-800">Delete</button>
                    </form>
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="7" class="px-6 py-4 text-center text-gray-500">No routes found.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>
@endsection
