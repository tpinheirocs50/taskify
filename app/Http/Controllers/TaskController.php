<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    /**
     * Display a listing of all tasks.
     */
    public function index(): JsonResponse
    {
        try {
            $tasks = DB::table('tasks')
                ->join('users', 'tasks.user_id', '=', 'users.id')
                ->join('clients', 'tasks.client_id', '=', 'clients.id')
                ->leftJoin('invoices', 'tasks.invoice_id', '=', 'invoices.id')
                ->select(
                    'tasks.*',
                    'users.name as user_name',
                    'clients.name as client_name',
                    'clients.company as client_company',
                    'invoices.status as invoice_status'
                )
                ->orderBy('tasks.created_at', 'desc')
                ->paginate(15);

            return response()->json([
                'success' => true,
                'data' => $tasks->items(),
                'pagination' => [
                    'total' => $tasks->total(),
                    'per_page' => $tasks->perPage(),
                    'current_page' => $tasks->currentPage(),
                    'last_page' => $tasks->lastPage(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve tasks',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created task in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'description' => 'required|string|max:5000',
                'priority' => 'required|in:low,medium,high',
                'starting_date' => 'required|date',
                'due_date' => 'required|date|after_or_equal:starting_date',
                'status' => 'required|in:pending,in_progress,completed',
                'amount' => 'nullable|numeric|min:0',
                'user_id' => 'required|exists:users,id',
                'client_id' => 'required|exists:clients,id',
                'invoice_id' => 'nullable|exists:invoices,id',
            ]);

            $task = Task::create($validated);

            $taskData = DB::table('tasks')
                ->where('tasks.id', $task->id)
                ->join('users', 'tasks.user_id', '=', 'users.id')
                ->join('clients', 'tasks.client_id', '=', 'clients.id')
                ->leftJoin('invoices', 'tasks.invoice_id', '=', 'invoices.id')
                ->select(
                    'tasks.*',
                    'users.name as user_name',
                    'clients.name as client_name',
                    'clients.company as client_company',
                    'invoices.status as invoice_status'
                )
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Task created successfully',
                'data' => $taskData,
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
                'message' => 'Failed to create task',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified task.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $task = DB::table('tasks')
                ->where('tasks.id', $id)
                ->join('users', 'tasks.user_id', '=', 'users.id')
                ->join('clients', 'tasks.client_id', '=', 'clients.id')
                ->leftJoin('invoices', 'tasks.invoice_id', '=', 'invoices.id')
                ->select(
                    'tasks.*',
                    'users.name as user_name',
                    'clients.name as client_name',
                    'clients.company as client_company',
                    'invoices.status as invoice_status'
                )
                ->first();

            if (!$task) {
                return response()->json([
                    'success' => false,
                    'message' => 'Task not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $task,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve task',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified task in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $task = Task::findOrFail($id);

            $validated = $request->validate([
                'title' => 'sometimes|required|string|max:255',
                'description' => 'sometimes|required|string|max:5000',
                'priority' => 'sometimes|required|in:low,medium,high',
                'starting_date' => 'sometimes|required|date',
                'due_date' => 'sometimes|required|date|after_or_equal:starting_date',
                'status' => 'sometimes|required|in:pending,in_progress,completed',
                'amount' => 'nullable|numeric|min:0',
                'user_id' => 'sometimes|required|exists:users,id',
                'client_id' => 'sometimes|required|exists:clients,id',
                'invoice_id' => 'nullable|exists:invoices,id',
                'is_hidden' => 'sometimes|boolean',
            ]);

            // Handle archive/unarchive status updates
            if (isset($validated['is_hidden'])) {
                if ($validated['is_hidden']) {
                    // Archiving: set archived_at and archived_by
                    $validated['archived_at'] = now();
                    $validated['archived_by'] = $request->user()?->id;
                } else {
                    // Unarchiving: clear archived_at and archived_by
                    $validated['archived_at'] = null;
                    $validated['archived_by'] = null;
                }
            }

            $task->update($validated);

            $taskData = DB::table('tasks')
                ->where('tasks.id', $id)
                ->join('users', 'tasks.user_id', '=', 'users.id')
                ->join('clients', 'tasks.client_id', '=', 'clients.id')
                ->leftJoin('invoices', 'tasks.invoice_id', '=', 'invoices.id')
                ->select(
                    'tasks.*',
                    'users.name as user_name',
                    'clients.name as client_name',
                    'clients.company as client_company',
                    'invoices.status as invoice_status'
                )
                ->first();

            return response()->json([
                'success' => true,
                'message' => 'Task updated successfully',
                'data' => $taskData,
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found',
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
                'message' => 'Failed to update task',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified task from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $task = Task::findOrFail($id);
            $task->delete();

            return response()->json([
                'success' => true,
                'message' => 'Task deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Task not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete task',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

}
