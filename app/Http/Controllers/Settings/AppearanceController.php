<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AppearanceController extends Controller
{
    /**
     * Show the user's appearance settings page.
     */
    public function edit(): Response
    {
        return Inertia::render('settings/appearance');
    }

    /**
     * Update the user's appearance settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'appearance' => ['required', 'array'],
            'appearance.mode' => ['required', 'in:light,dark,system'],
            'appearance.color' => [
                'required',
                'in:default,blue,green,orange,red,rose,violet,yellow',
            ],
        ]);

        $user = $request->user();
        $user->appearance = array_merge($user->appearance ?? [], $validated['appearance']);
        $user->save();

        return back();
    }
}
