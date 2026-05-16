<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the cancellation_requests table for tracking customer cancellation
     * requests that require admin approval before processing refunds.
     *
     * Requirements: R12.2, R12.3, R12.4, R12.6
     */
    public function up(): void
    {
        Schema::create('cancellation_requests', function (Blueprint $table) {
            $table->integer('request_id', true);
            $table->integer('booking_id');
            $table->unsignedBigInteger('requested_by');
            $table->text('reason');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->dateTime('requested_at')->useCurrent();
            $table->unsignedBigInteger('reviewed_by')->nullable();
            $table->dateTime('reviewed_at')->nullable();
            $table->text('notes')->nullable();

            // Foreign key constraints
            $table->foreign('booking_id')
                ->references('booking_id')
                ->on('bookings')
                ->onDelete('cascade');

            $table->foreign('requested_by')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->foreign('reviewed_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            // Indexes for common queries
            $table->index('booking_id');
            $table->index('requested_by');
            $table->index('reviewed_by');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cancellation_requests');
    }
};
