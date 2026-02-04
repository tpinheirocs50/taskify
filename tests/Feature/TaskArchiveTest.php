<?php

use App\Models\User;
use App\Models\Task;

it('can archive and unarchive a task', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'web');

    $client = \App\Models\Client::create([
        'name' => 'Test Client',
        'tin' => '123',
        'address' => 'addr',
        'email' => 'test@example.com',
        'company' => 'Test Co',
        'phone' => '999',
        'isActive' => true,
    ]);

    $task = Task::create([
        'title' => 'Example',
        'description' => 'desc',
        'priority' => 'medium',
        'starting_date' => now()->toDateString(),
        'due_date' => now()->addDays(7)->toDateString(),
        'status' => 'pending',
        'user_id' => $user->id,
        'client_id' => $client->id,
    ]);

    // Archive
    $response = $this->patchJson("/api/tasks/{$task->id}/archive", ['is_hidden' => true]);
    $response->assertStatus(200)->assertJson(['success' => true]);

    $task->refresh();
    expect($task->is_hidden)->toBeTrue();
    expect($task->archived_by)->toBe($user->id);
    expect($task->archived_at)->not->toBeNull();

    // Unarchive
    $response2 = $this->patchJson("/api/tasks/{$task->id}/archive", ['is_hidden' => false]);
    $response2->assertStatus(200)->assertJson(['success' => true]);

    $task->refresh();
    expect($task->is_hidden)->toBeFalse();
    expect($task->archived_by)->toBeNull();
    expect($task->archived_at)->toBeNull();
});