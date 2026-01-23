<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium');
            $table->date('starting_date');
            $table->date('due_date');
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending');
            $table->decimal('amount', 10, 2)->nullable();

            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->foreignId('client_id')
                  ->constrained('clients')
                  ->onDelete('cascade');  
                  
            $table->foreignId('invoice_id')
                  ->nullable()
                  ->constrained('invoices')
                  ->onDelete('set null');
                        
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign([
                'user_id',
                'client_id',
                'invoice_id'
            ]);

            $table->dropColumn([
                'id',
                'title',
                'description',
                'priority',
                'starting_date',
                'due_date',
                'status',
                'amount',
                'user_id',
                'client_id',
                'invoice_id'
            ]);

        });
 
    }
};
