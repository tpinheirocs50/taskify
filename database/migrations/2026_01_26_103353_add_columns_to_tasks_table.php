<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('title')->after('id');
            $table->text('description')->after('title');
            $table->enum('priority', ['low', 'medium', 'high'])->default('medium')->after('description');
            $table->date('starting_date')->after('priority');
            $table->date('due_date')->after('starting_date');
            $table->enum('status', ['pending', 'in_progress', 'completed'])->default('pending')->after('due_date');
            $table->decimal('amount', 10, 2)->nullable()->after('status');
            $table->foreignId('user_id')->after('amount')->constrained('users')->onDelete('cascade');
            $table->foreignId('client_id')->after('user_id')->constrained('clients')->onDelete('cascade');
            $table->foreignId('invoice_id')->nullable()->after('client_id')->constrained('invoices')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['client_id']);
            $table->dropForeign(['invoice_id']);
            $table->dropColumn(['title', 'description', 'priority', 'starting_date', 'due_date', 'status', 'amount', 'user_id', 'client_id', 'invoice_id']);
        });
    }
};