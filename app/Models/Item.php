<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    /** @use HasFactory<\Database\Factories\ItemFactory> */
    use HasFactory;

    protected $fillable = ['product_name', 'quantity', 'memo', 'purchased', 'priority'];

    protected $casts = [
        'quantity' => 'integer',
        'purchased' => 'boolean',
        'priority' => 'integer',
    ];
}
