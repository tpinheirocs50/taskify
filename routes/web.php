<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('tasks', function () {
        return Inertia::render('tasks/index');
    })->name('tasks');

    Route::get('clients', function () {
        return Inertia::render('clients/index');
    })->name('clients');

    Route::get('invoices', function () {
        return Inertia::render('invoices/index');
    })->name('invoices');
});


require __DIR__.'/settings.php';
