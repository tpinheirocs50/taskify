<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    /**
     * Display a listing of all clients.
     */
    public function index(): JsonResponse
    {
        try {
            $clients = Client::orderBy('id', 'desc')
                ->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $clients->items(),
                'pagination' => [
                    'total' => $clients->total(),
                    'per_page' => $clients->perPage(),
                    'current_page' => $clients->currentPage(),
                    'last_page' => $clients->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve clients',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created client in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'tin' => 'required|string|max:20|unique:clients,tin',
                'address' => 'required|string',
                'email' => 'required|string|email|max:50|unique:clients,email',
                'company' => 'nullable|string|max:50',
                'phone' => 'nullable|string|max:20',
                'isActive' => 'sometimes|boolean',
            ]);

            $client = Client::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Client created successfully',
                'data' => $client->fresh(),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create client',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified client.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $client = Client::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $client,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Client not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve client',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified client in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $client = Client::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:100',
                'tin' => 'sometimes|required|string|max:20|unique:clients,tin,' . $client->id,
                'address' => 'sometimes|required|string',
                'email' => 'sometimes|required|string|email|max:50|unique:clients,email,' . $client->id,
                'company' => 'nullable|string|max:50',
                'phone' => 'nullable|string|max:20',
                'isActive' => 'sometimes|boolean',
            ]);

            $client->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Client updated successfully',
                'data' => $client->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Client not found',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update client',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified client from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $client = Client::findOrFail($id);
            $client->delete();

            return response()->json([
                'success' => true,
                'message' => 'Client deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Client not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete client',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}