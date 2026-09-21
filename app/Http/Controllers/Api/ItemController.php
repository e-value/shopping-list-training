<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ItemStoreRequest;
use App\Http\Requests\ItemUpdateRequest;
use App\Models\Item;

class ItemController extends Controller
{
    public function index()
    {
        return Item::orderBy('id', 'desc')->get();
    }

    public function store(ItemStoreRequest $request)
    {
        $item = Item::create($request->validated());

        return response()->json($item, 201);
    }

    public function show(Item $item)
    {
        return $item;
    }

    public function update(ItemUpdateRequest $request, Item $item)
    {
        $item->update($request->validated());

        return $item;
    }

    public function destroy(Item $item)
    {
        $item->delete();

        return response()->noContent();
    }
}
