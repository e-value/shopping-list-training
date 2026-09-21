# タスク1: TypeScript化（手書きで型を当てる）

## 🎯 このタスクのゴール

🙋 「ガネーシャさん…ちょっと聞いてもらっていいですか…」

🐘 「おう、どないしたんや。朝からそんな暗い顔して」

🙋 「昨日、先輩に『`product_name` って冗長だから `name` に直しといて』って言われて、migration と Factory とコントローラを直したんです。DB も作り直して、API のレスポンスも `name` で返ってくるのを確認して…完璧だと思ったんです」

🐘 「ほうほう、それで？」

🙋 「今朝出社したら、先輩に『画面から商品名消えてるけど？』って言われて…。ブラウザ開いたら確かに名前が全部空白になってて。DevTools 見てもエラーなし、コンソールも真っ白で。30分くらいハマって、やっとフロントのテンプレートが `item.product_name` のままだって気づいたんです…」

🐘 「あー、あるあるやな。Vue のテンプレートで `{{ item.product_name }}` って書いてたけど、API が返すフィールドは `name` に変わっとる。JS は `item.product_name` が `undefined` でもエラー出さんからな。**画面に何も表示されへんだけで、沈黙するんや**」

🙋 「はい…。しかも同じ `product_name` を参照してる箇所が ItemListView と ItemDetailView の両方にあって、全部で6箇所も直し漏れてました。grep で探して直しましたけど、もっと大きいプロジェクトだったらと思うとゾッとします…」

🐘 「せやろ？ほんで今日な、お前にはまさにその悩みを解決する武器を教えたるわ。**TypeScript** や」

🙋 「TypeScript ですか…？JS のままでもいいのかなと思ってたんですけど」

🐘 「昨日のお前の失敗、TypeScript やったら **コードを書いた瞬間に** エディタが赤波線で教えてくれたんやで。実行もデプロイも要らん。`item.product_name` って書いた瞬間に『そんなプロパティないで』って怒られるからな」

🙋 「実行する前に教えてくれるんですか…！それはありがたいですね」

🐘 「そや。ほな今日は **自分の手で型を書く** ところから始めるで。`interface Item { product_name: string; ... }` みたいに、フィールドを1つずつ定義していくんや」

🙋 「けっこう大変そうですね...」

🐘 「いいから！楽に運用する方法も後々教えていくから、文句言わんとはじめは地道にやりや。**手を動かしてこそ『型って何のためにあって、どこに置くもんなんか』が腹落ちする** んやで」

🐘 「ワシの教え子のエジソンくんもな、電球を発明するまで自分の手で何度も実験を繰り返したやろ？知識は手を動かして初めて自分のもんになる。お前も今日、手で型を書いて TypeScript の便利さを体感してや。さぁ、いくで！」

---

## 🛠️ 環境構築（初回のみ）

タスクに入る前にな、まず開発環境を立ち上げなアカン。このプロジェクトは **Docker Compose**（Laravel Sail）で動くから、ホストマシンに PHP や MySQL を入れる必要はないで。

### 前提条件

- **Docker Desktop** がインストール済みで、起動してること
- **Git** がインストール済みであること

### 手順

#### 1. `.env` ファイルを作る

リポジトリには `.env.example` っちゅうテンプレートが用意してある。これをコピーして `.env` を作るんや:

```bash
cp .env.example .env
```

> 💡 `.env` には DB のパスワードやアプリの秘密鍵が入るから、**Git には絶対コミットしたらアカン**で。`.gitignore` に最初から入っとるから普通は大丈夫やけどな。

#### 2. Composer の依存パッケージをインストール

`vendor/` ディレクトリがまだ無いはずやから、Docker 経由で Composer を走らせるで:

```bash
docker run --rm -v "$(pwd):/app" -w /app composer:latest install --ignore-platform-reqs
```

> 💡 ホストに PHP がなくても、この方法なら Composer を実行できるんや。便利やろ？

#### 3. `sail` コマンドのエイリアスを設定

毎回 `sail` と打つのは面倒やから、エイリアスを設定しとこ:

```bash
alias sail='./vendor/bin/sail'
```

> 💡 毎回設定するのが面倒なら、`~/.zshrc`（または `~/.bashrc`）に追記しておくと永続化できるで。

#### 4. コンテナを起動

```bash
sail up -d
```

初回はイメージのビルドがあるから数分かかるで。完了したら以下で確認:

```bash
docker compose ps
```

`laravel.test` と `mysql` の 2つが `Up` になっとればOKや。

> ⚠️ **ポートが被ってエラーになったら？**
> `.env` の `APP_PORT`、`VITE_PORT`、`FORWARD_DB_PORT` を別の番号に変えてから `sail up -d` し直してな。例えば `VITE_PORT=5175` みたいにや。

#### 5. アプリの初期セットアップ

```bash
sail artisan key:generate      # APP_KEY を生成
sail artisan migrate --seed     # DB テーブル作成 + テストデータ投入
sail npm install                # フロントエンドの依存パッケージ
sail npm run build              # フロントエンドをビルド
```

#### 6. 動作確認

ブラウザで `http://localhost:8081` を開いてみい（ポートは `.env` の `APP_PORT` に合わせてな）。買い物リストが表示されたら環境構築は完了や！ 🎉

---

## 🌿 まず作業ブランチを切る

何ごとも下準備が大事や。料理する前にまな板を綺麗にするやろ？それと同じことや。

実装を始める前に、**リモートから最新の `task-1` を取得** して、そこから自分の作業ブランチを切るんやで。ブランチ名は **`<お前の名前>/task-1`** の形式や（例: `okumura/task-1`）。

```bash
git fetch origin                                  # リモートの最新情報を取得
git checkout -b okumura/task-1 origin/task-1       # ← 自分の名前に置き換えるんやで
```

> 💡 `origin/task-1` を起点にブランチを作ることで、**リモートのスタート地点そのまま** から始められるんや。
> ワシの教え子の織田信長くんも「いやいやワシは天下取るだけで精一杯やし」言うて、最新情勢を見ずに本能寺に泊まったら、どうなったか覚えてるやろ？まあ、ちゃんと最新を取り込んだ方が安全っちゅうことや。

### なぜ `task-1` で直接作業しないのか

- `task-1` ブランチは **スタート地点** として残しとくんや。やり直したくなったら同じコマンドでもう一度作り直せるからな。
- PR を出すとき「`okumura/task-1` → `task-1`」と from/to が一目で区別できるからや。
- `task-1` ブランチを自分のコミットで汚さんようにする意図もあるんや。😎

---

## 👀 まずは現状を確認

ブラウザで `http://localhost:8081`（`.env` の `APP_PORT` に合わせてな）を開いてみい。買い物リストが表示されてるはずや。

これがな、お前のスタート地点や。ここを TypeScript の世界に引きずり込んでいくんやで。

実装ファイル:
- `resources/js/views/ItemListView.vue` — 一覧画面（JS、型なし）
- `resources/js/views/ItemDetailView.vue` — 詳細画面（JS、型なし）
- `resources/js/router/index.js` — Vue Router 設定
- `resources/js/api/client.js` — axios インスタンス
- `resources/js/api/items.js` — API関数 (listItems / getItem / createItem / deleteItem)
- `app/Http/Controllers/Api/ItemController.php` — バックエンドCRUD

ぜーんぶ拡張子が `.js` か `.php` やろ？「型」っちゅう言葉が一切出てこんのが今のお前の世界や。ふふん、これからこれを変えていくで。

### 📁 フロントエンドのディレクトリ構造（task-1 開始時点）

これから何度も出てくるパスやから、最初に全体像を頭に入れとくと迷子にならんで:

```
resources/
└── js/
    ├── api/
    │   ├── client.js              ← axios インスタンス
    │   └── items.js               ← API 関数（listItems / getItem / ...）
    ├── router/
    │   └── index.js               ← Vue Router 設定
    ├── views/
    │   ├── ItemListView.vue       ← 一覧画面
    │   └── ItemDetailView.vue     ← 詳細画面
    ├── App.vue                    ← ルートコンポーネント
    └── app.js                     ← エントリーポイント
```

> 💡 これから本文で `resources/js/xxx/yyy.ts` みたいなパスが出てきたら、上のツリーのどこに該当するか思い出しながら読むんやで。Step 2 で `.js` → `.ts` にリネーム、Step 4 で **`types/` ディレクトリを新規追加** することになる。

---

## 🔥 ウォーミングアップ: カラム名変更で「型なしの怖さ」を追体験

実装に入る前にな、冒頭で話した「カラム名を変えたら画面が壊れた」事件を、お前自身の手で再現してもらうわ。

ワシの教え子のソクラテスくんが「無知の知」言うてたやろ？「自分が何を知らんかを知ること」が学びの第一歩や。今のお前は「型がないこと」が何を意味するかまだ実感してへん。だからまずそれを体感してもらう。

### まず「正常な状態」を目に焼き付ける

変更する前に、**今ちゃんと動いてること** を確認しとくで。ブラウザで `http://localhost:8081` を開いてみい。

- 一覧画面に **商品名（トマト、牛乳、卵…）** がちゃんと表示されとるやろ？
- どれか1つクリックして詳細画面も開いてみい。商品名が見出しに出とるな

この「正常に表示されとる状態」をしっかり目に焼き付けといてや。これからこの画面が **静かに壊れる** のを体験するんやで。

### シナリオ

> 先輩:「`product_name` って冗長やから `name` に直しといて」

冒頭で話したのとまったく同じ状況やな。ほな、バックエンド側だけ変更してみよか。

### 手順

1. `database/migrations/<タイムスタンプ>_create_items_table.php` を開いて、**`product_name` を `name` に変更**:

   ```php
   public function up(): void
   {
       Schema::create('items', function (Blueprint $table) {
           $table->id();
           $table->string('name');                            // ← product_name → name に変更！
           $table->unsignedInteger('quantity')->default(1);
           $table->text('memo')->nullable();
           $table->boolean('purchased')->default(false);
           $table->timestamps();
       });
   }
   ```

   > 💡 実務でも「カラム名を短くしよう」っちゅう判断は普通にある話や。**開発フェーズ** やと、**既存 migration を直接書き換えて `migrate:fresh`** するのが一般的やな。今日はその開発スタイルでいくで。
   > （※ プロダクションで動いとる migration を書き換えるのはタブーや。あくまで **まだデプロイしてない開発フェーズ** の話やからな）

2. バックエンドのカラム名を変えたら、**Factory も合わせる** のが基本や。`database/factories/ItemFactory.php` の `'product_name'` を `'name'` に変更:

   ```php
   public function definition(): array
   {
       return [
           'name' => fake()->randomElement([...]),            // ← product_name → name に変更
           'quantity' => fake()->numberBetween(1, 5),
           'memo' => fake()->optional(0.3)->sentence(),
           'purchased' => fake()->boolean(20),
       ];
   }
   ```

   > 💡 これな、実務でもよくあるハマりや。「migration 直したら Seeder が壊れる」あるある。**スキーマ変えたら Seeder/Factory も連動して直す癖** をつけるんやで。

3. DB を作り直す:

   ```bash
   sail artisan migrate:fresh --seed
   ```

4. ブラウザをリロードして画面を確認や。

### 何が起こったか

ここで **3箇所を自分の目で確認** してみい。「壊れたなら警告くらい出るやろ？」っちゅうお前の期待は、ここで裏切られるで:

#### ① 画面を見る

さっきまで「トマト」「牛乳」って表示されてたのに、**商品名がどこにも表示されてへん**やろ？

![商品名が消えたブラウザ画面](images/browser-broken-no-productname.png)

詳細画面も開いてみい。見出しも空っぽや。

「えっ、壊れてるやん！エラーとか出てへんの？」って思ったやろ？ほな次を見てみい。

#### ② ブラウザの DevTools を確認

`F12`（Mac は `Cmd + Option + I`）で DevTools を開いて **Console タブ** を見る:

- ❌ エラーログ: なし
- ❌ 警告: なし
- ❌ 何もない

**完全な沈黙** や。画面が壊れとるのに、ブラウザは何も教えてくれへん。

#### ③ エディタを開いて確認

VS Code 等で `resources/js/views/ItemListView.vue` を開いて、`{{ item.product_name }}` を書いとる行を見てみい:

```vue
<router-link :to="`/items/${item.id}`">
  {{ item.product_name }}     ← この行
</router-link>
```

**赤線、出てへんやろ？** バックエンドのカラム名が `name` に変わっとるのに、エディタは「`item.product_name` って…もう存在せんで？」とは一切教えてくれへん。

つまり `{{ item.product_name }}` を読んでたテンプレートは、API のレスポンスに `product_name` がなくなった（`name` に変わった）から、`item.product_name` が `undefined` になっただけや。

---

**これが JS の世界やで。** エディタも DevTools も誰も警告くれへん。バックエンドのカラム名が変わったことに **画面を目で見て初めて気づく**。本番環境なら、ユーザーから「商品名出てへんねんけど…」っちゅう問い合わせが来るまで誰も気付かへん、っちゅうことや。冒頭のお前の失敗、まさにこれやったやろ？怖いやろ？

### 元に戻す

次の手順で元通りに戻すで:

1. `database/migrations/<タイムスタンプ>_create_items_table.php` の `name` を `product_name` に戻す
2. `database/factories/ItemFactory.php` の `'name'` を `'product_name'` に戻す
3. DB を作り直す:

   ```bash
   sail artisan migrate:fresh --seed
   ```

「あれ、戻すんかい」って思ったやろ？そうや、今のは予告編や。本編はこれからやで。

---

## ✏️ 本題: TypeScript化する

ここから本気出すで。お前の JS 世界に TypeScript の鎧を着せていく作業や。

### Step 1: 必要なパッケージを入れる

```bash
sail npm install -D typescript vue-tsc @types/node
```

それぞれ何のパッケージかワシが教えたろ。

- **`typescript`**: 本体。これがないと何も始まらん。
- **`vue-tsc`**: Vue ファイル（.vue）の中の TS をチェックしてくれるやつ。普通の `tsc` だと `.vue` は見えへんからな。
- **`@types/node`**: Node.js の API（`process` とか）の型定義。これがないと「process って何やねん」言うてエディタが赤波線出すで。

ルートディレクトリに `tsconfig.json` を作成や:

```bash
touch tsconfig.json
```

中身はこれをコピペ:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "types": ["vite/client"]
  },
  "include": ["resources/js/**/*.ts", "resources/js/**/*.vue"]
}
```

これはな、TypeScript への「お前はこういうルールで仕事してや」っちゅう **指示書** みたいなもんや。特に `"strict": true` がポイントで、これがあると TS が「妥協なし」モードに入るんやで。

* 赤波線が出るかもしれんが、ts ファイルがまだないからや。Step 2 で解消するで。

### Step 2: `.js` ファイルを `.ts` にリネーム

```bash
mv resources/js/app.js resources/js/app.ts
mv resources/js/router/index.js resources/js/router/index.ts
mv resources/js/api/client.js resources/js/api/client.ts
mv resources/js/api/items.js resources/js/api/items.ts
```

`vite.config.js` の入力ファイルを `app.ts` に変更:

```js
input: ['resources/css/app.css', 'resources/js/app.ts'],
```

`resources/views/app.blade.php` の `@vite` ディレクティブも修正:

```blade
@vite(['resources/css/app.css', 'resources/js/app.ts'])
```

> ⚠️ 初心者あるある：jsをtsにリネームしただけで満足する人おるけど、今みたいに`vite.config.js` と `app.blade.php` の指定も変えなアカンで。ここ忘れると「あれ、画面真っ白やん」ってなって泣くからな。

### Step 3: 以下の3ファイルに `lang="ts"` を追加

- `resources/js/App.vue`
- `resources/js/views/ItemListView.vue`
- `resources/js/views/ItemDetailView.vue`

```vue
<script setup lang="ts">
// ... 既存のコード
</script>
```

`lang="ts"` を付けることで、Vue ファイルの中身も TypeScript として扱われるようになるんや。「ここから TS の世界やで」っちゅう宣言みたいなもんや。

> ⚠️ **この時点で赤波線が出るで！**
>
> `resources/js/views/ItemListView.vue` を開いてみい。こんな箇所に赤波線が出とるはずや:
>
> ```ts
> async function removeItem(item) {     // ← 「item」に赤波線 🔴
>   if (!confirm(`「${item.product_name}」を削除しますか？`)) return
> ```
>
> これは TS が「`item` の型が分からんで！何が入ってくるんや？」って怒っとるんや。
>
> 「うわ、赤線出た！壊れた！」って焦るやろ？焦るな。TS が「お前、引数の型書いてへんで」って親切に教えてくれてるだけや。**次のステップで型をちゃんと付けたら消える** からな。

### Step 4: `interface Item` を定義

新しいファイル `resources/js/types/item.ts` を作成や。**`types/` ディレクトリも新規作成** やで（既存にはない）:

```bash
mkdir resources/js/types
touch resources/js/types/item.ts
```

位置関係はこれや:

```
resources/
└── js/
    ├── api/
    ├── router/
    ├── types/                     ← ★ ディレクトリを新規作成
    │   └── item.ts                ← ★ このファイルを新規作成
    ├── views/
    ├── App.vue
    └── app.ts
```

ファイルの中身はこれや:

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

ここ、めっちゃ大事や。`interface` っちゅうのはな、「Item ちゅうもんはこういうフィールド持っとるで！」っちゅう **約束** や。

ワシの教え子のピタゴラスくんも「数の世界には決まりがある」言うてたけど、それと同じで、TS の世界では **「型」が決まり** やねん。

### Step 5: 各 `.vue` ファイルで型を使う

`resources/js/views/ItemListView.vue`:

```ts
import type { Item } from '../types/item'    // ← 追加（既存の import の下に）

const items = ref<Item[]>([])                 // ← ref([]) → ref<Item[]>([]) に変更
const newName = ref<string>('')               // ← ref('') → ref<string>('') に変更
const newQuantity = ref<number>(1)            // ← ref(1) → ref<number>(1) に変更

async function removeItem(item: Item) {       // ← (item) → (item: Item) に変更
  // ...
}
```

- `import type { Item }` は **新規追加** や。既存の `import` 文の下に追加してな
- それ以外は **既存のコードを編集** する形や。`ref([])` → `ref<Item[]>([])` みたいに型情報を付け足すんやで

`ref<Item[]>([])` で「これは Item の配列やで」、`removeItem(item: Item)` で「引数の `item` は Item 型やで」と TS に教えてるんや。

*ここで `removeItem` 等の赤波線が解消されるはずや。「あ、消えた！」っちゅう快感、これがプログラマーの密かな喜びやで。


`resources/js/views/ItemDetailView.vue`:

```ts
import type { Item } from '../types/item'    // ← 追加

const item = ref<Item | null>(null)           // ← ref(null) → ref<Item | null>(null) に変更
```

> 💡 ここでは初期値が `null`（API 取得前は何もない）なので、型を `Item | null` にしてるんやで。
> その結果、`item.value` の型は **`Item | null`** になるから、TypeScript は **`null` の可能性を考慮した書き方を要求** してくる。

そのため `remove()` 関数で `item.value.name` のように直接アクセスすると「`item.value` が `null` の可能性があるで」っちゅうエラー（赤波線）が出るんや。先頭で **null チェック** を入れて早期 return しよか:

```ts
async function remove() {
  if (!item.value) return                                          // ← この行を追加するんやで
  if (!confirm(`「${item.value.name}」を削除しますか？`)) return
  await deleteItem(item.value.id)
  router.push('/')
}
```

> 💀 これは TypeScript の **strict null checks** が効いてる状態や。「null かも？」を見逃さんことで、ロード前にボタン連打したときの画面クラッシュみたいなバグを防いでくれる。
> ワシの教え子のナポレオンちゃんも「備えあれば憂いなし」言うてたけど、null チェックはまさにそれや。

### Step 6: API関数にも型を付ける

`resources/js/api/items.ts`:
* すでに `createItem(data)` の `data` や `deleteItem(id)` の `id` に赤波線が出てるはずや。

```ts
import type { Item } from '../types/item'
import apiClient from './client'

export function listItems() {
  return apiClient.get<Item[]>('/items')
}

export function getItem(id: number) {
  return apiClient.get<Item>(`/items/${id}`)
}

export function createItem(data: { product_name: string; quantity: number }) {
  return apiClient.post<Item>('/items', data)
}

export function deleteItem(id: number) {
  return apiClient.delete(`/items/${id}`)
}
```

* ここまで書いたら、API関数の引数の赤波線も解消されるで。

#### ⚠️ 代わりに ItemDetailView.vue で新しい赤波線が出るはず

`getItem(id: number)` と型を付けた瞬間、**呼び出し側** で型エラーが出るんや。

> 💀 これも TypeScript が「型が合うてへんで」って教えてくれた例や。
> JS の時は文字列の `"3"` をそのまま URL に埋め込んでも動いてたから、バグに気づかんかった。けど `getItem` の引数を `number` と宣言したことで、**呼び出し側の不整合まで芋づる式に見えるようになった** わけや。
> ワシの教え子のレオナルド・ダ・ヴィンチくんが「全てはつながっとる」言うてたけど、まさにそれや。

> 💡 **ちょっと寄り道: `apiClient.get<Item[]>` の `<...>` って何や？**
>
> これは **ジェネリクス（Generics）** っちゅう機能や。「**型を引数として渡す**」仕組みやと思てくれ。
>
> axios の `get` メソッドはな、中の人が「戻ってくる `response.data` の型は、**呼び出し側で指定してや**」っちゅう **型引数のスロット（`<T>` っちゅう "穴"）** を空けて書いてくれとる。お前はそのスロットに `<Item[]>` を流し込むことで、「この API は `Item` の配列を返すで」と TypeScript に教えとるんや。
>
> ```ts
> const res = await apiClient.get<Item[]>('/items')
> res.data    // ← Item[] として型補完が効く
> ```
>
> もし `<Item[]>` を書かんかったら？`res.data` の型は `any` になって、**型のありがたみゼロ** や。せっかく TS にしたんやから、ここで型を流し込んどくのが大事や。
>
> 今は **「`<...>` の中に型を渡しとる」** とだけ理解しとけば OK や。「なんで `get` がそんなふうに型を後から受け取れるんや？」が気になるお前は、`node_modules/axios/index.d.ts` で `get<T = any, ...>(...)` の宣言を覗いてみい。**`<T>` っちゅう型引数のスロット** が用意されとるから、お前が呼び出し側で `<Item[]>` を渡すと、その `T` に流し込まれる仕組みや。


```resources/js/views/ItemDetailView.vue
async function loadItem() {
  const response = await getItem(route.params.id)  // ← ここに赤波線
  item.value = response.data
}
```

エラーの中身はこんな感じや:

> Argument of type `'string | string[]'` is not assignable to parameter of type `'number'`.

理由はな、`route.params.id` の型が **`string | string[]`** やからや。URL のパラメータは仕様上「常に文字列」やから、Vue Router はそう型付けしてるんや（`/items/3` の `3` も TS から見れば文字列の `"3"` や）。

`Number()` で変換しよか:

```resources/js/views/ItemDetailView.vue
async function loadItem() {
  const response = await getItem(Number(route.params.id))   // ← Number() で囲むんやで
  item.value = response.data
}
```

### Step 7: 型チェックを通す

```bash
sail npx vue-tsc --noEmit
```

エラーが出んくなったら OK や。出る場合は型注釈を直していくんやで。

> 💡 `vue-tsc` っちゅうのは、`.vue` ファイルも含めてプロジェクト全体の **TypeScript 型チェックを実行するツール** や。`--noEmit` をつけると「チェックだけして、ファイルは生成すんな」っちゅう意味になる。ビルドは Vite が別でやってくれるから、型チェック専門でええわけや。これからこのコマンドは何度も使うで。

---

## 🔥 TypeScript化の威力を体感する

`vue-tsc --noEmit` がエラーなしで通ったやろ！まずはここまでお疲れさん。

「で、TypeScript にして何が嬉しいんや？」って思ってるやろ。ほな、**わざとミスを入れて TS がどう反応するか** 試してみよか。

### 実験: プロパティ名をわざと間違えてみる

`resources/js/views/ItemListView.vue` を開いて、テンプレートの `{{ item.product_name }}` を **わざと `{{ item.prodcut_name }}` に書き換えてみい**（typo や）:

```vue
<router-link :to="`/items/${item.id}`">
  {{ item.prodcut_name }}     ← わざと typo！
</router-link>
```

#### 何が起こるか

**エディタに赤波線が出る** はずや 🔴

> Property 'prodcut_name' does not exist on type 'Item'.

TS が「そんなプロパティないで！」って即座に教えてくれとる。

ウォーミングアップを思い出してみい。JS の時代は `{{ item.product_name }}` を `{{ item.name }}` に書き間違えても、**エディタは何も言わんかった**。画面を目で見て初めて気づくしかなかった。

それが今は **コードを書いた瞬間に** エディタが「それ間違うてるで」って教えてくれる。**実行もデプロイも要らん**。これが TypeScript の威力や。

確認できたら **`product_name` に戻しといてや**。

> 💡 ついでに `item.memo` を `item.mmo` にしたり、`item.quantity` を `item.quntity` にしたりもやってみい。全部赤波線が出るはずや。**interface に定義したフィールド名以外は一切許さん**。これが「型で守られとる」っちゅう状態や。

---

## 🔥 もう一度: 手書きの限界を体験

「TypeScript にして typo も見つけてくれるようになった！もう安心や！あんみつ食お！」

...って思うやろ？**早とちりやで** 🤔

さっきの実験は「フロントのコード内での typo」やった。TS はそれを見つけてくれた。けどな、冒頭の失敗を思い出してみい。あの時の問題は **バックエンドのカラム名が変わった** ことやった。TS はそれも守ってくれるんやろか？

ウォーミングアップと同じ「カラム名変更」を、**TypeScript 化した今のコードで** もう一回やってみよか。

### 実験1: TSが嘘を見抜けないことを確認する

#### シナリオ

> 先輩:「`product_name` って冗長やから `name` に直しといて」

ウォーミングアップと同じ指示やな。今度は TypeScript 化した後でどうなるか見てみよか。

#### 手順

1. **ウォーミングアップと同じ変更** や。バックエンド側のカラム名を `name` に変えるで:

   - `database/migrations/<タイムスタンプ>_create_items_table.php` の `$table->string('product_name')` を `$table->string('name')` に変更
   - `database/factories/ItemFactory.php` の `'product_name' => fake()->randomElement([...])` を `'name' => fake()->randomElement([...])` に変更
   - DB 作り直し:
     ```bash
     sail artisan migrate:fresh --seed
     ```

2. **`interface Item`（resources/js/types/item.ts）は何もいじらん**（`product_name: string` のまま）

3. ターミナルで型チェックを実行:

   ```bash
   sail npx vue-tsc --noEmit
   ```

4. ブラウザでリロード

#### 観察ポイント

| | 状態 |
|---|---|
| `vue-tsc` の結果 | ✅ **エラーなしで通る** |
| ブラウザの画面 | ❌ 商品名が表示されない |

#### ここで気づくこと

- `interface` は「`product_name` というフィールドがあるで」と言ってる → コードも `item.product_name` を読んでる → **TS 的には全部合格**
- でも実際のバックエンドは **`name`** に変わっとる → 実行時に `item.product_name` は `undefined`
- **TS は嘘を見抜けへん**。interface を信じてチェックするからや

#### なぜ TS はエラーを出せなかったのか？

ここが核心や。TS が **何をチェックしてるか** を図にするとこうなる:

```
[実際のバックエンドが返すデータ]      [interface Item]      [.vue / .ts のコード]
        ❓ ←─── ここは見てない ───→     ✅ ←─── ここはチェック ───→ ✅
```

- TS は「**interface 通りにコードが書けてるか**」をチェックしてる → さっきの typo 実験で赤波線が出たのはこれや
- TS は「**interface がバックエンドと合うてるか**」は **チェックしてへん**
- なんでかって？`interface` は **お前が手で書いた仮説** やから、TS はそれを真実として信じるしかないんや

つまり、**interface が嘘をついてた場合、TS は "嘘の真実" をチェックしてるだけ** になる。冒頭のお前の失敗と全く同じ構造やろ？型をつけても、**interface 自体がバックエンドとズレてたら意味ない** んや。

---

### 実験2: 直そうとすると手間が見える

今度は interface を実際のバックエンドに合わせて修正してみよか。カラム名が `name` に変わったんやから、interface も合わせるで:

#### 手順

1. `resources/js/types/item.ts`（Step 4 で作ったやつや。場所はここ ↓）を編集して `product_name` を `name` に変更:

   ```
   resources/js/
   └── types/
       └── item.ts                 ← これを編集
   ```

   ```ts
   export interface Item {
     id: number
     name: string                  // ← product_name → name に変更
     quantity: number
     memo: string | null
     purchased: boolean
     created_at: string
     updated_at: string
   }
   ```

2. もう一度型チェック:

   ```bash
   sail npx vue-tsc --noEmit
   ```

#### 観察ポイント

今度は **たくさんエラーが出る** はずや。例えば:

```
ItemListView.vue:XX:XX - error TS2339: Property 'product_name' does not exist on type 'Item'.
ItemListView.vue:XX:XX - error TS2339: Property 'product_name' does not exist on type 'Item'.
ItemDetailView.vue:XX:XX - error TS2339: Property 'product_name' does not exist on type 'Item'.
ItemDetailView.vue:XX:XX - error TS2339: Property 'product_name' does not exist on type 'Item'.
ItemDetailView.vue:XX:XX - error TS2339: Property 'product_name' does not exist on type 'Item'.
ItemDetailView.vue:XX:XX - error TS2339: Property 'product_name' does not exist on type 'Item'.
```

エディタを開いても、`ItemListView.vue` と `ItemDetailView.vue` の両方にまたがって、`item.product_name` を使ってる箇所が **全て赤く** なるはずや（template の `{{ item.product_name }}`、削除確認の `${item.product_name}`、見出しなど合計6箇所くらい）。

#### ここで気づくこと

- **TS は「型が変わったら、影響範囲を全部教えてくれる」** ← これが TS の強み 💪
- **複数ファイルにまたがって** 漏れなく検出される。grep で文字列検索するのとは違うで、**意味的に紐づいた箇所だけ** を正確に教えてくれるんや
- でもな、エラーを1つずつ潰すのは **地味に大変** や。これがフィールド30個 × 各20箇所だったら…？想像しただけで疲れるやろ
- そして **「interface を実際のバックエンドに合わせて手で更新する」のはお前の責任** や

---

### 結論: 何が「手書きの限界」か

| TS が守ってくれること | TS が守ってくれへんこと |
|---|---|
| ✅ interface の内容と、それを使うコードの整合性 | ❌ interface とバックエンドの整合性 |
| ✅ 型を変えたら影響範囲を教えてくれる | ❌ 「バックエンドが変わった」ことの検知 |

**型を書くことで安全性は得られる。でも「型自体を正しく保つ責任」はお前に残るんや。**

フィールドが100個あって、バックエンドが頻繁に変わるプロジェクトでは、これは現実的やない。

> 💡 これを解決するのが次のタスク（OpenAPI 型自動生成）や。バックエンドのコードから型を自動生成することで、**interface がバックエンドの真実から自動で降りてくる** ようになるんや。
> はい、Oh, My God!! 🐘🧘←親友の釈迦と決めポーズや。

---

### 元に戻す

実験が終わったら、以下を元に戻してや:

1. `database/migrations/<タイムスタンプ>_create_items_table.php` の `name` を `product_name` に戻す
2. `database/factories/ItemFactory.php` の `'name'` を `'product_name'` に戻す
3. DB 作り直し:
   ```bash
   sail artisan migrate:fresh --seed
   ```
4. `resources/js/types/item.ts` の `interface Item` の `name` を `product_name` に戻す
5. `vue-tsc --noEmit` がエラーなく通り、ブラウザで商品名が再び表示されることを確認

---

## ✅ 完了基準

- [ ] `tsconfig.json` が存在し、`sail npx vue-tsc --noEmit` がエラーなく通る
- [ ] `app.ts` / `client.ts` / `items.ts` / `router/index.ts` にリネーム済み
- [ ] `.vue` ファイルすべてに `lang="ts"` が付いている
- [ ] `interface Item` を `resources/js/types/item.ts` に定義した
- [ ] `ref<Item[]>([])` のように型を使っている
- [ ] API関数 (`listItems` 等) の返り値型が `Item[]` または `Item` になっている
- [ ] ブラウザで一覧/追加/削除が今まで通り動く

全部チェックついたか？さすガネーシャや！…と言いたいとこやけど、これは全部お前の手柄やで。よう頑張った。

---

## 💡 完了したら

```bash
git add .
git commit -m "task-1: Vue を TypeScript 化"
git push origin okumura/task-1   # ← "okumura"の部分は自分の名前に変えるんやで
```

GitHub でリポジトリの `task-1` ブランチに向けて Pull Request を作成してや。

- **base**: `task-1`
- **compare（head）**: `<名前>/task-1`（例: `okumura/task-1`）


⚠️ **Pull Request はマージしないでな**。`task-1` ブランチは次の受講生のスタート地点として綺麗に保つためや。

### もし push や PR がうまくいかなかったら？

焦らんでええ。次の `task-2` ブランチには **タスク1が完了した状態のコード** が最初から入っとる。やから、今の変更を全部捨てて `task-2` ブランチに切り替えれば、そこからタスク2を始められるで。

手順:

1. **Cursor の左サイドバー → ソース管理（Git アイコン）** を開く
2. 変更されたファイルの一覧が出るから、**「変更を破棄」**（↩️ アイコン）で全ての変更を元に戻す
3. ターミナルで以下を実行:

   ```bash
   git fetch origin
   git checkout -b <名前>/task-2 origin/task-2    # 例: miyata/task-2
   ```

これでタスク2の開始地点に立てる。push できんかったことは気にせんでええ、**学びはお前の手に残っとる** からな。

---

次のタスクへ進むには `docs/task-2.md` を読んでや（冒頭にスタート手順があるで）。

タスク2ではな、この章で書いた手書きの `interface Item` を **捨てて**、Laravel の Resource から **自動生成された型** に置き換えるで。
「えー、せっかく書いたのに捨てんの？」って思うやろ？それがな、「手書きを捨てる」ありがたみの体験なんや。

ワシのお供えに、あんみつ持ってきてくれたら、もうちょっと優しく教えたるで🍨。
