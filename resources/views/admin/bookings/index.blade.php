@extends('layouts.admin')

@section('title', 'Bookings')

@section('content')
<div class="mb-6">
    <h2 class="text-lg font-semibold text-gray-800">All Bookings</h2>
</div>

<div class="bg-white rounded-lg shadow overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
            @forelse($bookings as $booking)
            <tr>
                <td class="px-6 py-4 text-sm font-mono text-gray-900">{{ $booking->booking_code }}</td>
                <td class="px-6 py-4 text-sm text-gray-700">{{ $booking->user->name ?? '-' }}</td>
                <td class="px-6 py-4 text-sm text-gray-700">
                    @if($booking->schedule && $booking->schedule->route)
                        {{ $booking->schedule->route->origin_city }} &rarr; {{ $booking->schedule->route->destination_city }}
                    @else
                        -
                    @endif
                </td>
                <td class="px-6 py-4 text-sm text-gray-700">{{ ucfirst($booking->booking_channel) }}</td>
                <td class="px-6 py-4 text-sm text-gray-700">Rp {{ number_format($booking->total_amount, 0, ',', '.') }}</td>
                <td class="px-6 py-4">
                    @php
                        $colors = ['pending' => 'yellow', 'confirmed' => 'green', 'cancelled' => 'red', 'expired' => 'gray'];
                        $color = $colors[$booking->status] ?? 'gray';
                    @endphp
                    <span class="px-2 py-1 text-xs rounded-full bg-{{ $color }}-100 text-{{ $color }}-800">{{ ucfirst($booking->status) }}</span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">{{ $booking->created_at->format('d M Y H:i') }}</td>
                <td class="px-6 py-4 text-sm space-x-2">
                    <a href="{{ route('admin.bookings.show', $booking) }}" class="text-blue-600 hover:text-blue-800">View</a>
                    @if($booking->status === 'pending')
                        <form action="{{ route('admin.bookings.update-status', $booking) }}" method="POST" class="inline">
                            @csrf
                            @method('PATCH')
                            <input type="hidden" name="status" value="confirmed">
                            <button type="submit" class="text-green-600 hover:text-green-800">Confirm</button>
                        </form>
                    @endif
                    @if(in_array($booking->status, ['pending', 'confirmed']))
                        <form action="{{ route('admin.bookings.update-status', $booking) }}" method="POST" class="inline" onsubmit="return confirm('Cancel this booking?')">
                            @csrf
                            @method('PATCH')
                            <input type="hidden" name="status" value="cancelled">
                            <button type="submit" class="text-red-600 hover:text-red-800">Cancel</button>
                        </form>
                    @endif
                </td>
            </tr>
            @empty
            <tr>
                <td colspan="8" class="px-6 py-4 text-center text-gray-500">No bookings found.</td>
            </tr>
            @endforelse
        </tbody>
    </table>
</div>
@endsection
