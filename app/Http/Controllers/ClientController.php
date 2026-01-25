<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Client;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index():Response

    {
       $clients = Client::orderBy('id','desc')->get();
       return Inertia::render('Clients/Index', ['clients'=>$clients,]);
    }

    /**
     * Store a newly created resource in storage.
     */

    //- Declara o método store no controlador.

    public function store(Request $request)

    //- Request $request: Injeta o objeto Request do Laravel, que contém todos os dados do formulário/JSON enviados pelo cliente.

    {
        //- Chama o método validate no objeto Request

       $validated = $request->validate([
       'name' => ['required', 'string','max:100'],
       'tin' => ['required', 'string', 'max:20','unique:clients,tin'],
       'adress'=> ['required', 'string'],
       'email' =>['required', 'string', 'email','max:50', 'unique:clients,email'],
       'company' =>['nullable, string','max:50'],
       'phone' => ['nullable', 'string','max:20'],
       'isActive'=>['sometimes','boolean'],
       ]);

       //- Os dados validados são devolvidos num array e guardados em $validated.

       //- Cria um novo registo na tabela clients usando o modelo Client.


       Client::create($validated);

       return redirect()
       ->route(clients,index)
       ->with('success', 'Client created successfully');

    }

    /**
     * Display the specified resource.
     */
    public function show(Client $client):Response


    {
        
        return Inertia::render('Clients/Show',['client'=>$client]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Client $client)
    {
        $validated = $request-> validate([
        'name'     => ['required', 'string', 'max:100'],
        //$client->id diz ao Laravel ignora este ID na verificação da unicidade, pois o Id do cliente tem de ser unico na mesma mas ele já existe.
        'tin'      => ['required', 'string', 'max:20', 'unique:clients,tin,' . $client->id],
        'address'  => ['required', 'string'],
        'email'    => ['required', 'string', 'email', 'max:50', 'unique:clients,email,' . $client->id],
        'company'  => ['nullable', 'string', 'max:50'],
        'phone'    => ['nullable', 'string', 'max:20'],
        'isActive' => ['sometimes', 'boolean'],

        ]);

        $client ->update($validated);

        return redirect()
        ->back()
        ->with('success','Client updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Client $client)
    {
        $client ->ddelete();

        return redirect()
        ->route('clients.index')
        ->with('success', 'Client deleted successfully');
    }
}