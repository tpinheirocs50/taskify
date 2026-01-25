<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * Display a listing of all invoices.
     */
    public function index(): JsonResponse
    {
        try {
            $invoices = Invoice::orderBy('date', 'desc')
                ->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $invoices->items(),
                'pagination' => [
                    'total' => $invoices->total(),
                    'per_page' => $invoices->perPage(),
                    'current_page' => $invoices->currentPage(),
                    'last_page' => $invoices->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve invoices',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created invoice in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date' => 'required|date',
                'status' => 'required|in:draft,sent,paid,overdue,cancelled',
            ]);

            $invoice = Invoice::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Invoice created successfully',
                'data' => $invoice->fresh(),
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
                'message' => 'Failed to create invoice',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified invoice.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $invoice = Invoice::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $invoice,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve invoice',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified invoice in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $invoice = Invoice::findOrFail($id);

            $validated = $request->validate([
                'date' => 'sometimes|required|date',
                'status' => 'sometimes|required|in:draft,sent,paid,overdue,cancelled',
            ]);

            $invoice->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Invoice updated successfully',
                'data' => $invoice->fresh(),
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found',
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
                'message' => 'Failed to update invoice',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified invoice from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $invoice = Invoice::findOrFail($id);
            $invoice->delete();

            return response()->json([
                'success' => true,
                'message' => 'Invoice deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete invoice',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
