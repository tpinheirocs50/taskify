<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
      'name',
      'tin',
      'address',
      'email',
      'company',
      'phone',
      'isActive',  
    ];
}
