<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/* Fazer o CRUD completo */
/* Rotas já criadas em ApiResources: GET (index), POST(store), PUT(update), DELETE(destroy) */

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        /* 
        * Busca todas as tarefas na tabela task 
        * Retorna uma Collection ("array" do Laravel)
        */
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
            ->get();
    }

    /**
     * Cria uma nova tarefa na base de dados
     */
    public function store(Request $request)
    {
        /* 
        * $request->validate() valida todos os campos enviados
        */

        $request->validate([

            'title' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'priority' => 'required|in:low, medium, high',
            'starting_date' => 'required|date',
            
            //para que o due_date nunca seja antes do starting date
            'due_date' => 'required|date|after_or_equal:starting_date', 
            'status' => 'required|in:pending,in_progress,completed',
            'amount' => 'nullable|numeric|min:0',
            'user_id' => 'required|exists:users,id',
            'client_id' => 'required|exists:clients,id',
            'invoice_id' => 'nullable|exists:invoices,id',

        ]);

        Task::create([

            'title' => $request->title,
            'description' => $request->description,
            'priority' => $request->priority,
            'starting_date' => $request->starting_date,
            'due_date' => $request->due_date,
            'status' => $request->status,
            'amount' => $request->amount,
            'user_id' => $request->user_id,
            'client_id' => $request->client_id,
            'invoice_id' => $request->invoice_id,

        ]);

        $task = DB::table('tasks')
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
            ->orderBy('tasks.id', 'desc')
            ->first();

            return response()->json($task);
    }

    /**
     * Mostra os detalhes de uma tarefa específica
     */
    public function show(string $id)
    {

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

            if(!$task) {
                return response()->json([
                    'error' => 'Task not found'
                ], 404);
            }

            return response()->json($task);
    }

    /**
     * Atualiza uma tarefa existente
     * PUT - Envia todos os campos (substitui tudo)
     * PATCH - envia apenas os campos alterados (este é o recomendado usar)
     */
    public function update(Request $request, string $id)
    {
        $taskExists = DB::table('tasks')->where('id', $id)->exists();

        if(!$taskExists) {
            return response()->json([
                'error' => 'Task not found'
            ], 404);
        }

        $request->validate([

            'title' => 'required|string|max:255',
            'description' => 'required|required|string',
            'priority' => 'required|in:low,medium,high',
            'starting_date' => 'required|required|date',
            'due_date' => 'date',
            'status' => 'required|in:pending,in_progress,completed',
            'amount' => 'nullable|numeric|min:0',
            'user_id' => 'required|exists:users,id',
            'client_id' => 'required|exists:clients,id',
            'invoice_id' => 'nullable|exists:invoices,id',
        ]);

        Task::where('id', $id)->update($request->all());

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

        return response()->json($task);
    }

    /**
     * Apaga uma tarefa
     */
    public function destroy(string $id)
    {
        $taskExists = DB::table('tasks')->where('id', $id)->exists();
        
        if (!$taskExists) {
            return response()->json([
                'error' => 'Task not found'
            ], 404);
        }

         DB::table('tasks')->where('id', $id)->delete();

         return response()->json([
            'message' => 'Task deleted successfully'
        ]);
    }
}
