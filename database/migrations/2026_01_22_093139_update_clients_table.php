<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->string('name', 100)->notNullable()->after('id');
            $table->string('tin', 20)->notNullable()->unique();
            $table->text('address')->notnullable()->after('tin');
            $table->string('email', 50)->notNullable()->unique();
            $table->string('company', 50);
            $table->string('phone', 20)->nullable();
            $table->boolean('isActive')->default(true);
            $table->timestamps();

        });
    }

    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropColumn([
                'name',
                'tin',
                'address',
                'email',
                'company',
                'phone',
                'isActive',
            ]);
        });
    }
};

