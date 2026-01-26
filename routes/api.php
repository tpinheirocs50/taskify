<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\InvoiceController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::apiResource('users', UserController::class);
Route::apiResource('clients', ClientController::class);
Route::apiResource('tasks', TaskController::class);
Route::apiResource('invoices', InvoiceController::class);