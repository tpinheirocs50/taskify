<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'title',
        'description',
        'priority',
        'starting_date',
        'due_date',
        'status',
        'amount',
        'user_id',
        'client_id',
        'invoice_id',
        'is_hidden',
        'archived_at',
        'archived_by',
    ];

    protected $casts = [
        'is_hidden' => 'boolean',
        'archived_at' => 'datetime',
    ];

    /**
     * Scope to only visible (non-archived) tasks
     */
    public function scopeVisible($query)
    {
        return $query->where('is_hidden', false);
    }

    /**
     * Scope to only archived tasks
     */
    public function scopeOnlyArchived($query)
    {
        return $query->where('is_hidden', true);
    }

    /**
     * Archive the task by a given user id
     */
    public function archiveBy(int $userId)
    {
        $this->update([
            'is_hidden' => true,
            'archived_at' => now(),
            'archived_by' => $userId,
        ]);
    }

    /**
     * Unarchive the task
     */
    public function unarchive()
    {
        $this->update([
            'is_hidden' => false,
            'archived_at' => null,
            'archived_by' => null,
        ]);
    }
}
