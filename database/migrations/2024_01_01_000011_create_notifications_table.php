<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the notifications table for tracking customer notifications
     * sent via email and WhatsApp channels.
     *
     * Requirements: R9.1, R9.2, R9.3, R9.4, R9.5, R9.6, R9.7, R9.8
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->integer('notification_id', true);
            $table->unsignedBigInteger('user_id');
            $table->integer('booking_id')->nullable();
            $table->string('type', 100);
            $table->enum('channel', ['email', 'whatsapp']);
            $table->json('payload')->nullable();
            $table->string('status', 50)->default('pending');
            $table->dateTime('sent_at')->nullable();
            $table->dateTime('created_at')->useCurrent();

            // Indexes for common queries
            $table->index('user_id');
            $table->index('booking_id');
            $table->index('status');

            // Foreign keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('booking_id')->references('booking_id')->on('bookings')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
