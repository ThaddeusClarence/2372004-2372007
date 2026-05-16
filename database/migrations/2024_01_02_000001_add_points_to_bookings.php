<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds pickup and dropoff point foreign keys to bookings table
     * and composite index for hold expiration scans.
     *
     * Requirements: R5.4, R10.3, R4.5, R4.6, R8.9
     */
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Add nullable pickup_point_id foreign key referencing stop_points.stop_point_id
            $table->integer('pickup_point_id')->nullable()->after('schedule_id');
            $table->foreign('pickup_point_id')
                ->references('stop_point_id')
                ->on('stop_points')
                ->nullOnDelete();

            // Add nullable dropoff_point_id foreign key referencing stop_points.stop_point_id
            $table->integer('dropoff_point_id')->nullable()->after('pickup_point_id');
            $table->foreign('dropoff_point_id')
                ->references('stop_point_id')
                ->on('stop_points')
                ->nullOnDelete();

            // Add composite index (status, hold_expired_at) to support hold expiration scans
            $table->index(['status', 'hold_expired_at'], 'bookings_status_hold_expired_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Drop foreign keys first
            $table->dropForeign(['pickup_point_id']);
            $table->dropForeign(['dropoff_point_id']);

            // Drop the composite index
            $table->dropIndex('bookings_status_hold_expired_at_index');

            // Drop the columns
            $table->dropColumn(['pickup_point_id', 'dropoff_point_id']);
        });
    }
};
