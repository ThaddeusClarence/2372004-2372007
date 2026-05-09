@extends('layouts.admin')

@section('title', 'Booking Detail')

@section('content')
<div class="mb-6">
    <a href="{{ route('admin.bookings.index') }}" class="text-sm text-blue-600 hover:text-blue-800">&larr; Back to Bookings</a>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Booking Info -->
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Booking Information</h3>
        <dl class="space-y-3">
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Booking Code</dt>
                <dd class="text-sm font-mono font-medium text-gray-900">{{ $booking->booking_code }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Customer</dt>
                <dd class="text-sm text-gray-900">{{ $booking->user->name ?? '-' }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Channel</dt>
                <dd class="text-sm text-gray-900">{{ ucfirst($booking->booking_channel) }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Total Amount</dt>
                <dd class="text-sm font-medium text-gray-900">Rp {{ number_format($booking->total_amount, 0, ',', '.') }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Status</dt>
                <dd>
                    @php
                        $colors = ['pending' => 'yellow', 'confirmed' => 'green', 'cancelled' => 'red', 'expired' => 'gray'];
                        $color = $colors[$booking->status] ?? 'gray';
                    @endphp
                    <span class="px-2 py-1 text-xs rounded-full bg-{{ $color }}-100 text-{{ $color }}-800">{{ ucfirst($booking->status) }}</span>
                </dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Created</dt>
                <dd class="text-sm text-gray-900">{{ $booking->created_at->format('d M Y H:i') }}</dd>
            </div>
        </dl>
    </div>

    <!-- Schedule Info -->
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Schedule Details</h3>
        @if($booking->schedule)
        <dl class="space-y-3">
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Route</dt>
                <dd class="text-sm text-gray-900">
                    @if($booking->schedule->route)
                        {{ $booking->schedule->route->origin_city }} &rarr; {{ $booking->schedule->route->destination_city }}
                    @else
                        -
                    @endif
                </dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Departure</dt>
                <dd class="text-sm text-gray-900">{{ $booking->schedule->departure_time->format('d M Y H:i') }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Arrival Est.</dt>
                <dd class="text-sm text-gray-900">{{ $booking->schedule->arrival_estimate ? $booking->schedule->arrival_estimate->format('d M Y H:i') : '-' }}</dd>
            </div>
        </dl>
        @else
            <p class="text-sm text-gray-500">No schedule data.</p>
        @endif
    </div>

    <!-- Seats -->
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Booked Seats</h3>
        @if($booking->bookingSeats->count())
        <div class="flex flex-wrap gap-2">
            @foreach($booking->bookingSeats as $bs)
                <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {{ $bs->seat->seat_number ?? 'Seat #' . $bs->seat_id }} - Rp {{ number_format($bs->price_at_booking, 0, ',', '.') }}
                </span>
            @endforeach
        </div>
        @else
            <p class="text-sm text-gray-500">No seats booked.</p>
        @endif
    </div>

    <!-- Payment -->
    <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Payment</h3>
        @if($booking->payment)
        <dl class="space-y-3">
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Method</dt>
                <dd class="text-sm text-gray-900">{{ $booking->payment->payment_method ?? '-' }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Amount</dt>
                <dd class="text-sm text-gray-900">Rp {{ number_format($booking->payment->amount ?? 0, 0, ',', '.') }}</dd>
            </div>
            <div class="flex justify-between">
                <dt class="text-sm text-gray-500">Status</dt>
                <dd class="text-sm text-gray-900">{{ ucfirst($booking->payment->status ?? '-') }}</dd>
            </div>
        </dl>
        @else
            <p class="text-sm text-gray-500">No payment recorded.</p>
        @endif
    </div>
</div>
@endsection
