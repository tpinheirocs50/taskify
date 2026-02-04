<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
      'user_id',
      'name',
      'tin',
      'address',
      'email',
      'company',
      'phone',
      'isActive',  
    ];
}
