@extends('layouts.admin')

@section('title', 'Add Route')

@section('content')
<div class="max-w-2xl">
    <div class="mb-6">
        <a href="{{ route('admin.routes.index') }}" class="text-sm text-blue-600 hover:text-blue-800">&larr; Back to Routes</a>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <form action="{{ route('admin.routes.store') }}" method="POST">
            @csrf

            <div class="mb-4">
                <label for="origin_city" class="block text-sm font-medium text-gray-700 mb-1">Origin City</label>
                <input type="text" name="origin_city" id="origin_city" value="{{ old('origin_city') }}"
                       class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
            </div>

            <div class="mb-4">
                <label for="destination_city" class="block text-sm font-medium text-gray-700 mb-1">Destination City</label>
                <input type="text" name="destination_city" id="destination_city" value="{{ old('destination_city') }}"
                       class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
            </div>

            <div class="mb-4">
                <label for="distance_km" class="block text-sm font-medium text-gray-700 mb-1">Distance (km)</label>
                <input type="number" name="distance_km" id="distance_km" value="{{ old('distance_km') }}" min="1"
                       class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
            </div>

            <div class="mb-6">
                <label for="duration" class="block text-sm font-medium text-gray-700 mb-1">Duration (HH:MM)</label>
                <input type="time" name="duration" id="duration" value="{{ old('duration') }}"
                       class="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500">
            </div>

            <div class="flex gap-3">
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">Create Route</button>
                <a href="{{ route('admin.routes.index') }}" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium">Cancel</a>
            </div>
        </form>
    </div>
</div>
@endsection
