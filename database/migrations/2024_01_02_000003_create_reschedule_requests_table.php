<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the reschedule_requests table for tracking customer reschedule
     * requests that require admin approval.
     *
     * Requirements: R13.1, R13.2, R13.3, R13.4, R13.6, R13.7
     */
    public function up(): void
    {
        Schema::create('reschedule_requests', function (Blueprint $table) {
            $table->integer('request_id', true);
            $table->integer('booking_id');
            $table->integer('target_schedule_id');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->dateTime('requested_at')->useCurrent();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('notes')->nullable();

            // Foreign key to bookings.booking_id
            $table->foreign('booking_id')
                ->references('booking_id')
                ->on('bookings')
                ->cascadeOnDelete();

            // Foreign key to schedules.schedule_id (target schedule)
            $table->foreign('target_schedule_id')
                ->references('schedule_id')
                ->on('schedules')
                ->cascadeOnDelete();

            // Foreign key to users.id (reviewed_by - admin who reviewed)
            $table->foreign('reviewed_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            // Indexes for common queries
            $table->index('booking_id');
            $table->index('target_schedule_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reschedule_requests');
    }
};
