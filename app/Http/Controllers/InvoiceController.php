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
                'due_date' => 'nullable|date|after_or_equal:date',
                'status' => 'required|in:draft,sent,paid,overdue,cancelled',
                'tax_rate' => 'nullable|numeric|min:0|max:100',
                'description' => 'nullable|string|max:5000',
                'task_ids' => 'required|array|min:1',
                'task_ids.*' => 'required|integer|exists:tasks,id',
            ]);

            // Create the invoice
            $invoice = Invoice::create([
                'date' => $validated['date'],
                'due_date' => $validated['due_date'] ?? null,
                'status' => $validated['status'],
                'tax_rate' => $validated['tax_rate'] ?? 0,
                'description' => $validated['description'] ?? null,
            ]);

            // Associate tasks with the invoice
            // Verify that tasks don't already have an invoice
            $tasks = \App\Models\Task::whereIn('id', $validated['task_ids'])
                ->whereNull('invoice_id')
                ->get();

            if ($tasks->count() !== count($validated['task_ids'])) {
                $invoice->delete();
                return response()->json([
                    'success' => false,
                    'message' => 'Some tasks are already assigned to an invoice',
                ], 400);
            }

            // Update tasks with invoice_id
            foreach ($tasks as $task) {
                $task->invoice_id = $invoice->id;
                $task->save();
            }

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
                'due_date' => 'nullable|date',
                'status' => 'sometimes|required|in:draft,sent,paid,overdue,cancelled',
                'tax_rate' => 'nullable|numeric|min:0|max:100',
                'description' => 'nullable|string|max:5000',
                'task_ids' => 'sometimes|array',
                'task_ids.*' => 'required|integer|exists:tasks,id',
            ]);

            // Update invoice basic fields
            if (isset($validated['date'])) {
                $invoice->date = $validated['date'];
            }
            if (isset($validated['due_date'])) {
                $invoice->due_date = $validated['due_date'];
            }
            if (isset($validated['status'])) {
                $invoice->status = $validated['status'];
            }
            if (isset($validated['tax_rate'])) {
                $invoice->tax_rate = $validated['tax_rate'];
            }
            if (isset($validated['description'])) {
                $invoice->description = $validated['description'];
            }
            $invoice->save();

            // If task_ids are provided, update task associations
            if (isset($validated['task_ids'])) {
                // Verify that new tasks don't already have an invoice (except this one)
                $newTasks = \App\Models\Task::whereIn('id', $validated['task_ids'])
                    ->where(function ($query) use ($invoice) {
                        $query->whereNull('invoice_id')
                            ->orWhere('invoice_id', $invoice->id);
                    })
                    ->get();

                if ($newTasks->count() !== count($validated['task_ids'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Some tasks are already assigned to another invoice',
                    ], 400);
                }

                // Update all tasks to have this invoice_id
                foreach ($newTasks as $task) {
                    $task->invoice_id = $invoice->id;
                    $task->save();
                }
            }

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

            // Unassign all tasks from this invoice
            \App\Models\Task::where('invoice_id', $invoice->id)
                ->update(['invoice_id' => null]);

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
