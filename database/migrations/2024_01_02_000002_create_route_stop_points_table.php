<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the route_stop_points pivot table for the many-to-many
     * relationship between routes and stop_points.
     *
     * Requirements: R2.3, R2.4, R5.1, R5.2, R5.5, R5.6
     */
    public function up(): void
    {
        Schema::create('route_stop_points', function (Blueprint $table) {
            $table->integer('route_id');
            $table->integer('stop_point_id');

            // Foreign key constraints
            $table->foreign('route_id')
                ->references('route_id')
                ->on('routes')
                ->onDelete('cascade');

            $table->foreign('stop_point_id')
                ->references('stop_point_id')
                ->on('stop_points')
                ->onDelete('cascade');

            // Unique composite key to prevent duplicate associations
            $table->primary(['route_id', 'stop_point_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('route_stop_points');
    }
};
