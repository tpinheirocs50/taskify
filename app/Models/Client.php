<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
      'name',
      'tin',
      'adress',
      'email',
      'company',
      'phone',
      'isActive',  
    ];
}
