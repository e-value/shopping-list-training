<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ItemUpdateRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'product_name' => ['sometimes', 'string', 'max:255'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
            'memo' => ['nullable', 'string'],
            'purchased' => ['sometimes', 'boolean'],
        ];
    }
}
