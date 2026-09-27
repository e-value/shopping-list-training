<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|docs).*$');   // ← |docs を追加（変更）