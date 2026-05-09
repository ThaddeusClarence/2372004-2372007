@extends('layouts.admin')

@section('title', 'Dashboard')

@section('content')
<!-- Stats Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            </div>
            <div class="ml-4">
                <p class="text-sm text-gray-500">Total Vehicles</p>
                <p class="text-2xl font-bold text-gray-800">{{ $stats['vehicles'] }}</p>
            </div>
        </div>
        <p class="mt-2 text-xs text-gray-400">{{ $stats['active_vehicles'] }} active</p>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
            </div>
            <div class="ml-4">
                <p class="text-sm text-gray-500">Total Routes</p>
                <p class="text-2xl font-bold text-gray-800">{{ $stats['routes'] }}</p>
            </div>
        </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
            <div class="p-3 rounded-full bg-yellow-100">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <div class="ml-4">
                <p class="text-sm text-gray-500">Total Schedules</p>
                <p class="text-2xl font-bold text-gray-800">{{ $stats['schedules'] }}</p>
            </div>
        </div>
        <p class="mt-2 text-xs text-gray-400">{{ $stats['available_schedules'] }} available</p>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
            <div class="p-3 rounded-full bg-purple-100">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
            <div class="ml-4">
                <p class="text-sm text-gray-500">Total Bookings</p>
                <p class="text-2xl font-bold text-gray-800">{{ $stats['bookings'] }}</p>
            </div>
        </div>
        <p class="mt-2 text-xs text-gray-400">{{ $stats['pending_bookings'] }} pending, {{ $stats['confirmed_bookings'] }} confirmed</p>
    </div>
</div>

<!-- Recent Bookings -->
<div class="bg-white rounded-lg shadow">
    <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-800">Recent Bookings</h2>
    </div>
    <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                @forelse($recent_bookings as $booking)
                <tr>
                    <td class="px-6 py-4 text-sm font-mono text-gray-900">{{ $booking->booking_code }}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">{{ $booking->user->name ?? '-' }}</td>
                    <td class="px-6 py-4 text-sm text-gray-700">
                        @if($booking->schedule && $booking->schedule->route)
                            {{ $booking->schedule->route->origin_city }} - {{ $booking->schedule->route->destination_city }}
                        @else
                            -
                        @endif
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-700">Rp {{ number_format($booking->total_amount, 0, ',', '.') }}</td>
                    <td class="px-6 py-4">
                        @php
                            $colors = ['pending' => 'yellow', 'confirmed' => 'green', 'cancelled' => 'red', 'expired' => 'gray'];
                            $color = $colors[$booking->status] ?? 'gray';
                        @endphp
                        <span class="px-2 py-1 text-xs rounded-full bg-{{ $color }}-100 text-{{ $color }}-800">{{ ucfirst($booking->status) }}</span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-500">{{ $booking->created_at->format('d M Y H:i') }}</td>
                </tr>
                @empty
                <tr>
                    <td colspan="6" class="px-6 py-4 text-center text-gray-500">No bookings yet.</td>
                </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>
@endsection
