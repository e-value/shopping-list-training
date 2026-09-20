<?php

namespace Database\Factories;

use App\Models\Item;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Item>
 */
class ItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_name' => fake()->randomElement([
                '牛乳', '卵', '食パン', 'バナナ', 'りんご',
                'トマト', 'キャベツ', '鶏肉', '豚肉', '米',
                'ヨーグルト', 'チーズ', '玉ねぎ', 'じゃがいも',
            ]),
            'quantity' => fake()->numberBetween(1, 5),
            'memo' => fake()->optional(0.3)->sentence(),
            'purchased' => fake()->boolean(20),
        ];
    }
}
