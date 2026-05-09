<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'schedule_id',
        'booking_code',
        'total_price',
        'status', // pending, confirmed, cancelled, completed
        'payment_status', // unpaid, paid, refunded
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function details()
    {
        return $this->hasMany(BookingDetail::class);
    }
}
