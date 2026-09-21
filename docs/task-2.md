# タスク2: OpenAPI 型自動生成パイプラインの構築

## 🎯 このタスクのゴール

おかえり、ワシや、ガネーシャや🐘。タスク1お疲れさん、よう頑張ったな。今日もあんみつ食いながら待っとったで🍨。

### 前回までのおさらい（ガネーシャ × お前）

🙋 「先生！task-1 で `interface Item` 手書きしました！`id` も `product_name` も `quantity` も `purchased` も、全部 `.vue` ファイルに型を当てました！」

🐘 「おお、ええやんけ。よう頑張ったな。…ところでお前、もしバックエンド側で `quantity` ってカラムが `qty` に rename されたら、どうするんや？」

🙋 「え、`interface Item` の中の `quantity` を `qty` に書き換えます！」

🐘 「ほな、`created_at` が新しく増えたら？`memo` の型が `string | null` から `string` に変わったら？」

🙋 「…そのたびに、手で直します」

🐘 「**毎回か？** バックエンドが変わるたびに、お前は **100% 漏らさず** 同期できる自信あるんか？」

🙋 「……（沈黙）」

🐘 「これがな、タスク1の最後で見た **"手書きの型は嘘をつく"** の正体や。バックエンドが真実やのに、フロントの型はその真実を **人間の記憶力で写経** しとる。これは絶対どこかで破綻する」

🙋 「じゃあ、どうしたら…？」

🐘 「真実が向こうにあるなら、その真実を **機械が向こうから取ってくる** 仕組みを作ったらええんや。今日はそれを組むで。キーワードは **OpenAPI** っちゅう規格や」

🙋 「OpenAPI…？ChatGPTの会社ですか？🤔🤖」

🐘 「あほ！それはOpenAIや！わしが言うとるのは**OpenAPI**な！まあこれからじっくり教えたるから、あんみつ片手についてこい🏃‍♀️🍨」

---

### まず前回の成果を手元で確認しよう

OpenAPI の話に入る前にな、タスク1でお前が作ったものをもう一度見てみよか。ファイルを開いて思い出すんや。

#### お前が手書きした型定義

`resources/js/types/item.ts` を開いてみい:

```ts
export interface Item {
  id: number
  product_name: string
  quantity: number
  memo: string | null
  purchased: boolean
  created_at: string
  updated_at: string
}
```

これがタスク1の **Step 4** で書いた `interface Item` や。バックエンドの `items` テーブルのカラムを、**お前が1つずつ手で写経した** やつやな。

#### 型を使って守りを固めたコード

`resources/js/api/items.ts` も見てみい:

```ts
import type { Item } from '../types/item'

export function listItems() {
  return apiClient.get<Item[]>('/items')       // ← API の戻り値を Item[] と宣言
}

export function createItem(data: { product_name: string; quantity: number }) {
  return apiClient.post<Item>('/items', data)   // ← 引数も戻り値も型付き
}
```

`resources/js/views/ItemListView.vue` も:

```ts
import type { Item } from '../types/item'

const items = ref<Item[]>([])                   // ← 「Item の配列やで」と TS に教えた
const newName = ref<string>('')

async function removeItem(item: Item) {         // ← 引数の型を明示
  if (!confirm(`「${item.product_name}」を削除しますか？`)) return
  // ...
}
```

覚えとるか？ `ref<Item[]>([])` で「これは Item の配列やで」、`removeItem(item: Item)` で「引数は Item 型やで」と TS に教えたんやった。おかげで typo したら即赤波線が出る世界になったな。

#### でもな、ここに「穴」があったやろ？

タスク1の最後でこの図を見たの、覚えとるか:

```
[バックエンドが返すデータ]      [interface Item]      [.vue / .ts のコード]
      ❓ ←── ここは見てない ──→    ✅ ←── ここはチェック ──→ ✅
```

TypeScript がチェックしてくれるのは **右半分だけ** や。「interface の内容通りにコードが書けてるか」は見てくれた。typo で `item.prodcut_name` って書いたら赤波線が出たやろ？あれは右半分のチェックや。

でも **左半分** — 「interface がバックエンドと合ってるか」は **誰も見てへん**。

タスク1ではフロントエンドだけを TypeScript 化したやろ？バックエンドのコード（Controller や Model）には一切手を入れてへんかった。つまり **interface とバックエンドの間の橋は、お前の記憶力だけで繋がっとる** 状態なんや。

実際にタスク1の最後の実験で、バックエンドの `product_name` を `name` に変えても `vue-tsc` はエラーを出せんかったやろ？interface が古い `product_name` を信じ続けて、**嘘の真実** をチェックしてただけやった。

今日はこの「❓」の部分を **機械で埋める** で。

---

### 今日やること

タスク1で **手書きで書いた `interface Item`** を **捨てて**、Laravel の Resource から **OpenAPI 仕様を生成 → そこから TypeScript の型を自動生成** するパイプラインに置き換えていくで。

「えー、せっかく書いたのに捨てんの！？」って思うやろ？それがな、ホンマの学びや。ワシの教え子のガリレオくんも「天動説、ワシ信じてたけど捨てるわ」言うて地動説に乗り換えたやろ？真実が見えたら古い仮説は潔く捨てる。それがプロや。

> 💡 タスク1の最後で見た「手書きの型は嘘をつく」問題（interface が実際のレスポンスと食い違っても気づけへん）を、**バックエンドを唯一の真実とする型の自動同期** で解決するのが狙いや。

完成すると、あの図がこう変わる:

```
[バックエンドが返すデータ]      [自動生成された型]      [.vue / .ts のコード]
      ✅ ←── 機械が同期する ──→    ✅ ←── ここはチェック ──→ ✅
```

**左半分の「❓」が「✅」に変わる** んや。もう人間の記憶力に頼らんでええ。

---

## 🌿 まず作業ブランチを切る

タスク1と同じリズムやで。**リモートから最新の `task-2` を取得** して、自分の作業ブランチを切るんや。ブランチ名は **`<お前の名前>/task-2`** の形式にしてや（例: `okumura/task-2`）。

```bash
git fetch origin                                  # リモートの最新情報を取得
git checkout -b okumura/task-2 origin/task-2       # ← 自分の名前に置き換えるんやで
```

> 💡 `task-2` ブランチは **タスク1を完了した状態（TypeScript化済み）** がスタート地点や。お前が前回頑張った成果が、そのまま乗ってる状態から始められるで。

---

## ✏️ 本題: 型を自動生成する

このタスクで使うライブラリを先に紹介しとくで。

- **`dedoc/scramble`**（バックエンド）— Laravel のコードから **OpenAPI 仕様（JSON）を自動生成**。PHP の型ヒントから推論するから、アノテーションを書く必要がないっちゅう優れもの。
- **`openapi-typescript`**（フロントエンド）— OpenAPI 仕様 → TypeScript の型定義を生成。

> 💡 「OpenAPI」っちゅうのはな、API の仕様書を **機械が読める形式で書く規格** や。これが共通言語になっとるから、バックエンドが出した OpenAPI をフロントエンドのツールが読んで型を作る、っちゅう連携ができるわけや。
> ワシの教え子の始皇帝くんも「文字と度量衡は統一せなアカン」言うて中国を統一したやろ？OpenAPI も同じや。共通規格があるからこそ、ツール同士が会話できる。

### Step 1: TypeScript を 5.x に揃える（前提）

`openapi-typescript` の v7 は **TypeScript 5.x が peer dependency** になっとるんや。
タスク1で何も指定せずに `npm install -D typescript` した場合、最新の TS 6 が入っとるはずや。これを 5.x に揃えるで。

```bash
sail npm install -D typescript@^5
```

> 💡 ライブラリ同士のバージョン整合性は実務でしょっちゅう出る課題や。「最新を入れたら依存先がついてこんかった」みたいなことが起きる。
> ワシの教え子のニュートンくんも「全ては相互作用」言うてたな。npm のパッケージも一緒で、依存先と支え合っとるんや。`npm install` 時に "peer dependency" の警告が出たら無視せんと読む癖をつけや。

### Step 2: Scramble をインストール

Laravel のコードから OpenAPI 仕様（JSON）を自動生成してくれる、めっちゃ優秀なやつや。

```bash
sail composer require dedoc/scramble
```

インストール後、`http://localhost:8081/docs/api.json` で OpenAPI 仕様の JSON が取得できるようになるで。

#### 💡 なんでインストールだけで動くんや？

「えっ、コード何も書いてへんのに自動で生成されんの？魔法か？」って思うやろ？魔法やない、仕組みがあるんや。

Scramble はインストールされた瞬間から **`routes/api.php` を自動でスキャン** しよる。そして、

```
routes/api.php
└─ Route::apiResource('items', ItemController::class)   ← この1行が出発点
       ↓
   ItemController の index / show / store / update / destroy メソッドを発見
       ↓
   各メソッドが返す Item モデルを辿る
       ↓
   Item モデルの $casts と migration の column 定義から
   id / product_name / quantity / memo / purchased / created_at / updated_at を推論
       ↓
   components.schemas.Item として OpenAPI に出力
```

っちゅう流れで JSON が組み立てられるんや。

> ⚠️ ここポイントや：**「全てのモデル」が自動で出てくるわけやないで**。
> あくまで **`routes/api.php` で API として公開されているルートに紐づくモデル** だけや。
> 例えば仮に `UserNote` っちゅうモデルがあっても、`routes/api.php` でルートが切られてなければ OpenAPI には出てこん。**プライベートなモデルは公開されへん** っちゅうことや。安心やろ？

### Step 3: routes/web.php を修正

Scramble が出す `/docs/api.json` を openapi-typescript が読みに行けるようにするため、`routes/web.php` の catch-all 正規表現を `^(?!api).*$` → `^(?!api|docs).*$` に変更してな。

```php
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '^(?!api|docs).*$');
```

> ⚠️ 初心者あるある：「Scramble インストールしたのに `/docs/api.json` で Vue の画面が出てくる…なんでや！？」ってなるパターンや。
> これな、Laravel が SPA ルートに先取りされとるからや。`docs/*` も catch-all から除外せなアカンで。

### Step 4: OpenAPI 仕様の中身を見る

Scramble が `/docs/api.json` に出してくれる OpenAPI 3.1.0 形式の JSON、ちょっと覗いてみよか:

```bash
curl -s http://localhost:8081/docs/api.json | python3 -m json.tool | head -80
```

出力されるトップレベルの構造はこんな感じや:

| キー | 意味 |
|---|---|
| `openapi` | OpenAPI 規格のバージョン宣言（`"3.1.0"`） |
| `info` | API のメタ情報（タイトル、バージョン） |
| `servers` | API のベース URL（例: `http://localhost:8081/api`） |
| `paths` | **各 URL に対する操作**。例えば `/items` の `get`（一覧取得） `post`（作成）、`/items/{item}` の `get` `put` `delete` |
| `components.schemas` | **共通の型定義**（`Item` などはここに置かれる） |

例えば `paths./items` の `get` を見ると、`responses.200.content.application/json.schema` に `"$ref": "#/components/schemas/Item"` と書いてあるはずや。
これは「**この API は `Item` 型を返す**」っちゅう意味で、Item の具体的なプロパティは `components.schemas.Item` の方に書かれてる、という **参照関係** になっとる。

> 💡 同じ型を何度も書かんで済むようにする仕組みやな。ワシの教え子のレオナルド・ダ・ヴィンチくんも「一度描いたデッサンを参考に何枚も絵を描く」言うてたけど、それと同じや。重複を避けて、参照で繋ぐ。

#### Item スキーマの中身

**先ほど `curl` で取得した OpenAPI JSON** の中を見ると、`components.schemas.Item` のところに Item の型情報があるで:

```json
"Item": {
  "type": "object",
  "properties": {
    "id":           { "type": "integer" },
    "product_name": { "type": "string" },
    "quantity":     { "type": "integer" },
    "memo":       { "type": ["string", "null"] },
    "purchased":  { "type": "boolean" },
    "created_at": { "type": ["string", "null"], "format": "date-time" },
    "updated_at": { "type": ["string", "null"], "format": "date-time" }
  }
}
```

> 💡 タスク1で **手書き** した `interface Item`(resources/js/types/item.ts) と比べてみい。
> - `created_at: string | null` ← Scramble は DB の nullable まで拾ってくれとる（手書きでは `string` でズレてたな）
> - これが「**バックエンドの真実をそのまま伝える**」っちゅうことや。
> - 名探偵コナンくんの「真実はいつも1つや」を思い出しや。バックエンドの実装こそが真実で、それを忠実に伝えるのが Scramble の仕事や。

### Step 5: openapi-typescript を導入

```bash
sail npm install -D openapi-typescript
```

これがな、OpenAPI 仕様（JSON）を読んで TypeScript の型定義に変換してくれるツールや。

### Step 6: 型生成スクリプトを `package.json` に追加

`scripts` セクションに `generate:types` コマンドを追加するで:

```json
"scripts": {
  "build": "vite build",
  "dev": "vite",
  "generate:types": "openapi-typescript http://laravel.test/docs/api.json -o resources/js/types/api.d.ts"
}
```

### Step 7: 型を生成

```bash
sail npm run generate:types
```

`resources/js/types/api.d.ts` が **自動生成** される。これが OpenAPI から自動生成された **TypeScript の真実** や。位置はここやで:

```
resources/
└── js/
    ├── api/
    ├── router/
    ├── types/
    │   ├── api.d.ts             ← ★ 自動生成（このコマンドで新規作成された）
    │   └── item.ts              ← Step 8 で書き換える（手書き interface を捨てる）
    ├── views/
    ├── App.vue
    └── app.ts
```

中を覗いてみい。1000行近くあるけどビビらんでええ。今お前が気にすべきは **`export interface components`** の中の **`schemas`** の中の **`Item`** や。ざっくりこんな構造になっとるはずやで:

```ts
// resources/js/types/api.d.ts （ものすごく抜粋）
export interface components {
  schemas: {
    Item: {
      id: number;
      product_name: string;
      quantity: number;
      memo: string | null;
      purchased: boolean;
      created_at: string | null;   // ← Scramble は nullable まで正確に拾ってる
      updated_at: string | null;
    };
    // ...他にも paths から拾ったスキーマが並ぶ
  };
  // responses, parameters, ... 他のセクションもあるけど今は無視でええ
}
```

つまり **`components.schemas.Item` を辿れば、バックエンドの真実そのままの `Item` 型がいる** っちゅうことや。次の Step 8 でこれを使うで。

> ⚠️ `api.d.ts` は **絶対に手で編集したらアカン** で。次に `npm run generate:types` した瞬間、上書きされて消えるからな。「自動生成ファイル」っちゅうのはそういうもんや。

### Step 8: 手書き interface Item を捨てる

#### 8-1. そもそも「interface を捨てる」って何を捨てるんや？

タスク1で書いた `resources/js/types/item.ts` の中身、覚えとるか？こうやったな:

```ts
// 手書き時代の item.ts（これから捨てるやつ）
export interface Item {
  id: number
  product_name: string
  quantity: number
  memo: string | null
  purchased: boolean
  created_at: string      // ← ホンマは string | null やった（タスク1のラストで気づいたな）
  updated_at: string
}
```

これな、**`Item` っちゅう型の中身を、お前の手でゴリゴリ書いとった** わけや。バックエンドが変わったらお前が手で直さなアカンし、nullable も間違える。

「捨てる」っちゅうのは、**この interface の中身を全部消して、Step 7 で生成された `api.d.ts` 内の `Item` を指す別名（エイリアス）に置き換える** っちゅう意味や。**型を持つ場所を「自分の手」から「自動生成ファイル」に引っ越しさせる** イメージやな。

#### 8-2. 書き換え後のコード

`resources/js/types/item.ts` を以下に **丸ごと置き換え** や（上の8行を消して、下の2行に差し替える）:

```ts
import type { components } from './api'

export type Item = components['schemas']['Item']
```

たった3行。**`interface` っちゅう単語が消えた** やろ。これがこのタスクの中核や。

#### 8-3. この2行を1行ずつ読み解くで

**1行目: `import type { components } from './api'`**

```ts
import type { components } from './api'
//     ↑          ↑                ↑
//     ①          ②                ③
```

- ① `import type` — 「型だけ」を import する TypeScript の構文や。実行時のコードは一切持ってこん（`api.d.ts` には型しか書いてへんから当然や）。
- ② `components` — Step 7 で見た `api.d.ts` 内の `export interface components` を、そのまま指す。
- ③ `'./api'` — **これが `./api.d.ts` のことや**。TS は `.d.ts` の拡張子を省略して書く決まりやから、`./api` だけで通じる。**ここが Step 7 で生成したファイルとの直接の接続点** やで。

つまり「**Step 7 で作った `api.d.ts` の `components` 型を持ってこい**」っちゅう意味や。

**2行目: `export type Item = components['schemas']['Item']`**

```ts
export type Item = components['schemas']['Item']

```

- 右辺は`components` という型 → その中の `schemas` という型 → その中の `Item` という型、を順に取り出してる
- 取り出した型にItemっちゅう **型の別名（エイリアス）** をつける
- それをエクスポートするでっていう宣言や

つまり全体としては「**`api.d.ts` の中の `components.schemas.Item` を、`Item` という名前で再エクスポートする**」っちゅう意味や。図にするとこんな感じや:

```
 Step 7 で生成              Step 8 で書く              各 .vue / .ts は今まで通り
 ─────────────              ─────────────              ─────────────────────────
 api.d.ts                    item.ts                    ItemListView.vue など
 ┌──────────────┐            ┌────────────────────┐    ┌────────────────────┐
 │ components   │            │ import type {      │    │ import type {      │
 │  └─schemas   │ ───参照──► │   components       │    │   Item             │
 │      └─Item  │            │ } from './api'     │    │ } from '../types/  │
 │   (自動生成) │            │                    │    │   item'            │
 └──────────────┘            │ export type Item   │ ◄──│                    │
                             │   = components     │    │ // Item を使う     │
                             │   ['schemas']      │    └────────────────────┘
                             │   ['Item']         │
                             │   (ただの別名)     │
                             └────────────────────┘
```

#### 8-4. なんで別名なん？直接使ったらアカンの？

「`api.d.ts` の中身をそのまま使えばええやん？」って思うやろ？確かに各ファイルで毎回これを書いてもええ:

```ts
// 各ファイルで毎回これを書くハメに…
import type { components } from '../types/api'
const item: components['schemas']['Item'] = ...
```

…長くて読みにくいやろ？せやから **`Item` っちゅう短い別名を1箇所で定義して、他のファイルからは `Item` だけ import すれば済む** ようにしとるんや。

おかげで `.vue` / `.ts` ファイルは今まで通り `import type { Item } from '../types/item'` で動く。**外から見た公開 API は手書き時代と全く同じ** っちゅうことや。**「タスク1で書いた使う側のコードに一切手を入れんで済む」** のはこの薄い1枚ファイルのおかげやで。

#### 8-5. まとめ

- `interface Item { ... }` を **捨てた** = 中身の型定義をお前が手で書くのをやめた
- 代わりに自動生成された `components['schemas']['Item']` に **別名を付けただけ** の3行になった
- バックエンドが変わったら `npm run generate:types` 再実行 → `api.d.ts` 更新 → `Item` も自動で追従

> 💀 ここがエレガントなとこや。タスク1で頑張って書いた手書き interface を、たった3行で置き換える。
> 「えー、3行だけ！？」って驚くやろ？これがな、抽象化の力や。「**型の定義を持つ場所をひとつに集約する**」ことで、お前のコードは "Item の形" を覚える必要がなくなった。覚えてるのは `api.d.ts` だけ。お前の脳のメモリが解放されたで。

### Step 9: 型チェックを通す

```bash
sail npx vue-tsc --noEmit
```

エラーが出んかったら置き換え成功や。ブラウザで一覧/詳細/追加/削除が今まで通り動くことも確認してや。

---

## 🔥 もう一度: 自動同期を体験

タスク1のウォーミングアップで `product_name` → `name` に rename したとき、画面が静かに壊れたやろ。手書き interface 時代は `vue-tsc` も平然と通ってもうて、お前は何も気付けんかった。

今日は **全く同じバックエンド変更** をもう一度やる。条件は **検出機構だけが違う**（手書き → 自動生成）。何が変わるか、その目で確かめるんや。

### 実験: タスク1と同じ「product_name → name に rename」を加える

タスク1のウォーミングアップと全く同じ手順で `product_name` を `name` に変えるで:

1. `database/migrations/<タイムスタンプ>_create_items_table.php` の `$table->string('product_name');` を `$table->string('name');` に変更
2. `database/factories/ItemFactory.php` の `'product_name' => fake()->randomElement([...])` を `'name' => fake()->randomElement([...])` に変更
3. DB を作り直す:

   ```bash
   sail artisan migrate:fresh --seed
   ```

ブラウザでリロード…**画面はやっぱり静かに壊れる**（商品名が消える）。タスク1と一緒や。

「は？じゃあタスク1と何が違うねん！」って思ったやろ？まあ慌てんと、次見てみい。

#### まずは何もせず型チェックしてみる

```bash
sail npx vue-tsc --noEmit
```

実は **このタイミングでもまだエラー出ん**。なぜなら `api.d.ts` はバックエンド変更を **まだ取り込んでへん** から。

#### まず今の `api.d.ts` を確認してみい

`resources/js/types/api.d.ts` を開いて、`components.schemas.Item` のところを見るんや:

```ts
// 現時点の api.d.ts（抜粋）— まだ古いまま
Item: {
    id: number;
    product_name: string;   // ← バックエンドは name に変えたのに、ここはまだ product_name
    quantity: number;
    memo: string | null;
    purchased: boolean;
    created_at: string | null;
    updated_at: string | null;
};
```

`item.ts` 経由で見てる `Item` 型はまだ `product_name` を含んだ古い世界線のままや。そら `vue-tsc` も通るわな。

「結局タスク1と一緒やんけ！」って言いたなるやろ？せやけど **今は手があるんや**。

#### 型を再生成してみる

```bash
sail npm run generate:types
```

これで Scramble が現在の Item モデル（`product_name` → `name` に変更済み）を読み直して `/docs/api.json` を出し直し → openapi-typescript が `api.d.ts` を更新する。

#### もう一度 `api.d.ts` を見てみい

さっきと同じ `components.schemas.Item` のところを見るんや:

```ts
// 再生成後の api.d.ts（抜粋）— バックエンドの変更が反映された！
Item: {
    id: number;
    name: string;           // ← ここ！ product_name → name に変わっとる！
    quantity: number;
    memo: string | null;
    purchased: boolean;
    created_at: string | null;
    updated_at: string | null;
};
```

**`product_name` が `name` に変わっとる** やろ？お前はバックエンドの migration と Factory を変えただけやのに、`api.d.ts` の中身が **自動で追従した** んや。

ほんで `item.ts` を思い出してみい:

```ts
// resources/js/types/item.ts（Step 8 で書き換えたやつ）
import type { components } from './api'

export type Item = components['schemas']['Item']   // ← api.d.ts の Item をそのまま参照
```

この `Item` は `api.d.ts` の `components['schemas']['Item']` の **別名** や。つまり `api.d.ts` の `product_name` が `name` に変わった瞬間、**`Item` 型からも `product_name` が消える** っちゅうことや。お前は `item.ts` に一切触ってへんのにな。

#### もう一度型チェック

```bash
sail npx vue-tsc --noEmit
```

**今度こそエラーが出る** ✨

```
ItemListView.vue:XX:XX - error TS2339: Property 'product_name' does not exist on type 'Item'.
ItemDetailView.vue:XX:XX - error TS2339: Property 'product_name' does not exist on type 'Item'.
...
```

#### なんでエラーが出たか、コードで追ってみい

**型の世界**（`api.d.ts` → `item.ts`）は、`generate:types` でバックエンドの変更に追従した。`Item` 型はもう `name` しか持ってへん。

でも **フロントエンドのコードは何も変えてへん** やろ？`ItemListView.vue` を見てみい:

```vue
<!-- resources/js/views/ItemListView.vue -->
<router-link :to="`/items/${item.id}`">
  {{ item.product_name }}              <!-- ← まだ product_name を読んどる！ -->
</router-link>
```

```ts
// 同じファイルの script 部分
async function removeItem(item: Item) {
  if (!confirm(`「${item.product_name}」を削除しますか？`)) return
  //                    ↑ ここも product_name のまま！
```

`ItemDetailView.vue` も同じや:

```vue
<!-- resources/js/views/ItemDetailView.vue -->
<h2>{{ item.product_name }}</h2>                   <!-- ← product_name -->
<p>「{{ item.product_name }}」の詳細</p>           <!-- ← product_name -->
```

```ts
// 同じファイルの script 部分
if (!confirm(`「${item.value.product_name}」を削除しますか？`)) return
//                          ↑ ここも product_name
```

つまりこういう状態や:

```
Item 型（api.d.ts 経由で自動更新済み）:  name ✅
フロントのコード（まだ手つかず）:        product_name ❌
                                         ↑ ここがズレてるからエラーが出た！
```

**`Item` 型から `product_name` が消えたのに、フロントのコードがまだ `item.product_name` を読んどる** → TypeScript が「そんなプロパティないで！」と全箇所を教えてくれたわけや。

#### エディタでも確認してみい

`ItemListView.vue` と `ItemDetailView.vue` をエディタで開いてみ。上で見た `item.product_name` の箇所が **全部赤波線** になっとるはずや。

ここがポイントや：**この赤波線、タスク1のウォーミングアップで手書き interface から `product_name` を `name` に変えたときに出た赤波線と、全く同じ箇所** や。

でも今回お前、`item.ts` にも `.vue` ファイルにも **一切触ってへん**。migration と Factory の `product_name` を `name` に変えて、`generate:types` を叩いただけや。それでターミナルもエディタも「ここ壊れるで」を漏れなく教えてくれた。これが「**真実がバックエンドから自動で降りてくる**」っちゅうことや。

> 💀 **これが自動生成の威力や。**
> タスク1の手書き時代は、**全く同じバックエンド変更** をしても interface は古い `product_name: string` を信じ続けて、`vue-tsc` も平然と通ってもうた。
> 今は `npm run generate:types` の **たった1コマンド** で「フロントエンドの何が壊れるか」が型エラーとして全部見える。
> ワシの教え子のニュートンくんが「リンゴが落ちるのを見て引力に気づいた」みたいに、お前は今「型が降りてくる」のを目撃したんや。
> はい、Oh, My God!! ←親友の釈迦と決めポーズや。

### 元に戻す

実験が終わったら以下の手順で戻してや:

1. `database/migrations/<タイムスタンプ>_create_items_table.php` の `$table->string('name');` を `$table->string('product_name');` に戻す
2. `database/factories/ItemFactory.php` の `'name' => fake()->...` を `'product_name' => fake()->...` に戻す
3. DB 作り直し:
   ```bash
   sail artisan migrate:fresh --seed
   ```
4. 型を再生成: `sail npm run generate:types`
5. `vue-tsc --noEmit` がエラーなく通り、ブラウザで商品名が再び表示されることを確認

---

## ✅ 完了基準

- [ ] `dedoc/scramble` がインストール済み
- [ ] `routes/web.php` の catch-all が `docs` も除外している
- [ ] `package.json` に `generate:types` スクリプトがある
- [ ] `npm run generate:types` で `resources/js/types/api.d.ts` が生成されている
- [ ] `resources/js/types/item.ts` から手書きの interface が消え、生成型を re-export している
- [ ] `sail npx vue-tsc --noEmit` がエラーなく通る
- [ ] ブラウザで一覧/詳細/追加/削除が今まで通り動く

全部チェックついたか？お疲れ様やで！あんみつでも食べて一息や。🍨

---

## 💡 完了したら

```bash
git add .
git commit -m "task-2: OpenAPI 型自動生成パイプラインを導入"
git push origin okumura/task-2   # ← 自分の作業ブランチ名に変えるんやで
```

GitHub でリポジトリの `task-2` ブランチに向けて Pull Request を作成してや。

- **base**: `task-2`
- **compare（head）**: `<名前>/task-2`（例: `okumura/task-2`）

⚠️ **PR はマージしないでな**。`task-2` ブランチは次の受講生のスタート地点として綺麗に保つためや。

次のタスクへ進むには `docs/task-3.md` を読んでや（冒頭にスタート手順があるで）。

ほな、また会おか。お供えのあんみつは随時受付中やからな🍨。
