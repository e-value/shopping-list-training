# タスク4: 型再生成を「忘れる」仕組みを潰す（Husky + lint-staged）

## 🎯 このタスクのゴール

おかえり、ワシや、ガネーシャや🐘。タスク3お疲れさん、よう頑張ったな。今日もあんみつ片手に待っとったで🍨。

### 前回までのおさらい（ガネーシャ × お前）

🙋 「先生！task-3 で `priority` カラム追加、サクッと貫通しました！migration 書いて、Item モデル更新して、`sail npm run generate:types` を叩いたら、フロントの型に一瞬で `priority` が現れて…めっちゃ気持ちよかったです！」

🐘 「おお、ええ感じやないか。…ところでお前、いま **自分が何を叩いたか**、もう一回言うてみい」

🙋 「えっと…`sail npm run generate:types` ですか？」

🐘 「そや。**それな、お前の指が必要やった唯一の手作業** や」

🙋 「あ…そういえば、それだけは手で叩きました」

🐘 「次の機能で、その次の機能で、半年後の改修で、お前は毎回それを **忘れずに実行できるか？**」

🙋 「…たぶん、忘れます」

🐘 「正直でよろしい。**忘れたら？** 型が古いまま → 補完が嘘をつく → 実行時バグや。タスク2で学んだ **"バックエンドが真実"** の前提が、**お前の記憶力次第** で崩れる」

🙋 「えっ、せっかく組み上げた仕組みが、最後の1コマンドを忘れるだけで台無しに…」

🐘 「そや。やからな、**"覚えとこう" やのうて、"忘れても勝手に走る" 状態** を作るんや。今日はそれを **git の pre-commit フック** で実現するで」

🙋 「git のフック…？」

🐘 「`git commit` を打った瞬間、裏で自動でコマンドが走る仕掛けや。お前がバックエンドの PHP を変更した commit を打つと、**勝手に `generate:types` が走って型が更新される**。お前はもう **コマンドを覚えてなくてええんやで**」

---

### 今日やること

タスク3 でカラム追加したとき、お前はこの手順を踏んだはず:

```
1. migration を書く
2. Item モデルを更新する
3. → sail npm run generate:types ← ★ ここを忘れたら型がズレる
4. フロントで型補完が効く
```

3 のコマンドを **git の pre-commit フックで自動化** する。バックエンドの PHP を変更した commit を打つ瞬間、自動で `generate:types` が走るようにするで。

> 💡 ワシの教え子のベンジャミン・フランクリンくんが「**An ounce of prevention is worth a pound of cure**（1オンスの予防は1ポンドの治療に値する）」言うてたな。「忘れたら直す」やのうて、「**忘れる余地を仕組みで潰す**」のが熟練エンジニアのやり方や。

---

## 🌿 まず作業ブランチを切る

タスク1〜3と同じリズム。

```bash
git fetch origin                                  # リモートの最新情報を取得
git checkout -b okumura/task-4 origin/task-4       # ← 自分の名前に置き換えるんやで
```

> 💡 `task-4` ブランチは **タスク3を完了した状態**（priority カラム + OpenAPI 自動生成パイプライン完成）がスタート地点や。

ブランチを切り替えたら、DB をリセットしておくで。前のタスクの実験で DB が汚れとる可能性があるからな:

```bash
sail artisan migrate:fresh --seed
```

ブラウザで `http://localhost:8081` を開いて、買い物リストが正常に表示されることを確認してから次に進んでや。

---

## 👀 何を作るか

たった2つの npm パッケージで実現する:

| パッケージ | 役割 |
|---|---|
| **Husky** | git の「**フック**」（特定タイミングでスクリプトを走らせる仕組み）を簡単に管理できるツール |
| **lint-staged** | git で **staged になっているファイル** に対してだけ、指定したコマンドを実行するツール |

組み合わせると:
- git commit を実行する直前に Husky が発火
- Husky が lint-staged を呼ぶ
- lint-staged が「staged の中に `app/**/*.php` の変更があるか？」を見る
- あれば `sail npm run generate:types` を実行
- なければスキップ（不要な処理を走らせへん）

**「PHP を変更した commit」のときだけ型再生成が自動で走る** っちゅう仕掛けが完成する。

---

## 🔥 ウォーミングアップ: 「忘れる」とどうなるか体感

実装に入る前に、**手動で generate:types を忘れたとき何が起きるか** を実際に体感してみよ。痛みが分かれば、仕組みのありがたみが10倍刺さるで。

### 手順

1. `app/Models/Item.php` に **適当な `$appends` でフェイクの属性** を追加して、JSON 出力に含めるようにする:

   ```php
   class Item extends Model
   {
       use HasFactory;

       protected $fillable = ['product_name', 'quantity', 'memo', 'purchased', 'priority'];

       protected $appends = ['nickname'];   // ← 追加

       protected $casts = [
           'quantity' => 'integer',
           'purchased' => 'boolean',
           'priority' => 'integer',
       ];

       public function getNicknameAttribute(): string   // ← 追加
       {
           return 'にせの属性';
       }
   }
   ```

   これで Item の JSON レスポンスに `nickname` が含まれるようになる。

2. **わざと `sail npm run generate:types` を実行せん** ことに注意して、ブラウザでアプリを開く

3. `ItemListView.vue` のテンプレートで `{{ item.nickname }}` を表示しようとしてみい:

  ```vue
  ...
     {{ item.product_name }}
  </router-link>
  <span class="ml-2 text-sm">{{ item.nickname }}</span> //←追加
  ```

### 何が起こったか

| 観察対象 | 状態 |
|---|---|
| ブラウザ画面 | `にせの属性` が表示される（実行時には存在する）|
| エディタ | **`item.nickname` の `nickname` に赤波線** が出る：`Property 'nickname' does not exist on type 'Item'` |
| `sail npx vue-tsc --noEmit` | **型エラー** で落ちる |

「実行時には動くけど TS が知らん」っちゅう **嘘の世界線** に突入した。これな、タスク1の「**手書きの型は嘘をつく**」と同じ症状や。バックエンドが進化したのに **フロントの型がついてきてない**。

> 💀 ワシの教え子のメフィストフェレスくんが「**人間は何かを忘れた瞬間に堕落する**」言うてたな。お前は今、`generate:types` を1回忘れただけで、タスク2 で築いた **「型は降ってくる」っちゅう真実** を裏切ってしもうた。

### 戻す

実装に入る前に元の状態に戻す:

1. `Item.php` から `$appends = ['nickname'];` と `getNicknameAttribute()` メソッドを削除
2. `ItemListView.vue` から `{{ item.nickname }}` の行を削除
3. `sail npm run generate:types` を実行して `api.d.ts` も元に戻す

ここまでクリーンになったら、Husky 導入に進む。

---

## ✏️ 実装手順

### ⚠️ 事前確認: ホストに Node.js が入っとるか

今回のタスクは **これまでと違って、ホスト（お前の Mac）側で npm コマンドを動かす** で。理由は後で説明するけど、まず確認:

```bash
node -v
npm -v
```

バージョンが表示されたら OK（**v20 以上が望ましい**。Node 18 は 2025年4月で EOL、しかも後で使う `lint-staged` の依存が `node:util.styleText`（Node 20.12+ の API）を要求するので、commit したタイミングで爆発するで）。`command not found` やったら macOS なら **`brew install node`** で入れる。

> 💡 これまで `sail npm` でコンテナ内の Node.js を使うてきた。なんで今回はホスト側？っちゅう答えは Step 3 の解説で。

### Step 1: Husky と lint-staged をインストール

```bash
npm install -D husky lint-staged
```

`-D` は devDependencies に入れる指定。開発時にしか使わんパッケージやから本番ビルドには含めん。

### Step 2: Husky を初期化

```bash
npx husky init
```

このコマンドで以下が起きる:
- プロジェクトルートに **`.husky/` ディレクトリ** が作成される
- その中に **`pre-commit`** っちゅうサンプルファイルが生成される
- `package.json` の `scripts.prepare` に `husky` が追加される（`npm install` 時にフックを自動セットアップしてくれる）

位置関係はこれや。プロジェクトルート（`resources/` や `app/` と同じ階層）に `.husky/` ができる:

```
プロジェクトルート/
├── .husky/                          ← ★ 新規ディレクトリ
│   └── pre-commit                   ← ★ サンプルファイル（Step 3 で書き換える）
├── app/
├── database/
├── resources/
├── routes/
├── package.json                     # ← scripts.prepare に "husky" が追加される
└── ...
```

> 💡 `.husky/` は先頭にドット（`.`）が付くので **隠しディレクトリ扱い** や。`ls` だけだと見えへんから、`ls -la` で確認するんやで。

確認:

```bash
ls -la .husky/
cat .husky/pre-commit
```

`pre-commit` の中身は最初こんな感じ:

```bash
npm test
```

これは「**commit する直前に `npm test` を実行する**」っちゅうデフォルト設定。**今回は `lint-staged` を呼ぶように書き換える** で。

### Step 3: pre-commit フックを書き換え

Step 2 で `npx husky init` した直後、`.husky/pre-commit` の中身は **`npm test`**（デフォルト値）になっとる。これを **`npx lint-staged` に置き換える** で:

**書き換え方法は2つ**。やりやすい方でええ:

#### 方法A: エディタで開いて編集

VS Code 等で `.husky/pre-commit` を開く → 中身の **`npm test`** を削除 → **`npx lint-staged`** に置き換え → **`Cmd + S` で保存**

#### 方法B: ターミナルで一発置き換え

```bash
echo "npx lint-staged" > .husky/pre-commit
```

これでファイル丸ごと上書きされる（リダイレクト `>` の効果）。エディタを開く必要なし。

#### 確認

```bash
cat .husky/pre-commit
```

出力が **`npx lint-staged`** になっとれば OK。

「**commit 直前に lint-staged を実行してくれ**」っちゅう指示や、たったの1行。

### Step 4: lint-staged の設定を `package.json` に書く

`package.json` を開いて、**ルート階層（"scripts" と同じレベル）** に `lint-staged` っちゅうキーを追加:

```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "generate:types": "openapi-typescript http://laravel.test/docs/api.json -o resources/js/types/api.d.ts",
    "prepare": "husky"
  },
  "lint-staged": {
    "app/**/*.php": [
      "./vendor/bin/sail npm run generate:types"
    ]
  },
  // ... 他の設定はそのまま
}
```

意味:
- **キー** `"app/**/*.php"`: 「staged されとるファイルのうち、`app/` 配下の `.php` にマッチするもの」
- **値** `["./vendor/bin/sail npm run generate:types"]`: マッチが1つでもあれば実行するコマンドの配列

つまり **`app/` 配下の PHP ファイルが staged されとる commit のときだけ、`generate:types` が走る** っちゅう挙動になる。

> 💡 なんで `app/**/*.php` 限定にするか？ 例えば **resources/views/ の Blade ファイルを変更しただけ** やと、OpenAPI 仕様には影響せん。**型再生成の必要があるのは Model や Controller、つまり `app/` 配下** に絞れる。**「必要な時だけ走る」のが lint-staged のキモ** や。

### Step 5: 動作確認

実際に「PHP を変更して commit する」を試して、フックが発火するか見るで。

#### 5-1. `app/Models/Item.php` の `$casts` を **見た目に変化が出る形** で変更してみる

例えば `quantity` を `'integer'` から `'string'` に変えると、`api.d.ts` の `Item.quantity` が `number` → `string` に変わるんで、**目に見える効果** が出る:

```php
protected $casts = [
    'quantity' => 'string',     // ← 'integer' から 'string' に変更（後で戻す）
    'purchased' => 'boolean',
    'priority' => 'integer',
];
```

#### 5-2. staged にして commit

```bash
git add app/Models/Item.php
git commit -m "test: フック動作確認"
```

#### 5-3. 期待される動き

ターミナルにこんな出力が出るはず:

```
✔ Preparing lint-staged...
✔ Running tasks for staged files...
  ✔ app/**/*.php — 1 file
    ✔ ./vendor/bin/sail npm run generate:types
✔ Applying modifications from tasks...
✔ Cleaning up temporary files...

[okumura/task-4 xxxxxxx] test: フック動作確認
 1 file changed, ...
```

つまり commit が完了する **直前に**:
1. lint-staged が "app/**/*.php" のマッチを検知
2. `generate:types` が自動実行（http://laravel.test/docs/api.json を取りに行って api.d.ts を更新）
3. その後で commit が完了

**お前は何もせんでも api.d.ts が最新になっとる** っちゅう状態や。

#### 5-4. 結果を2つ確認

**① ファイルが更新されたか（タイムスタンプ）**

```bash
ls -la resources/js/types/api.d.ts
```

時刻が「ついさっき」になっとれば、フックが走って `generate:types` が実行された証拠や。

**② 中身が変わったか（コンテンツ）**

`api.d.ts` を開いて `Item.quantity` の行を見る:

```ts
Item: {
  id: number;
  product_name: string;
  quantity: string;   // ← integer から string に変わっとる ✨
  ...
}
```

`number` から `string` に変わっとれば、**バックエンドの $casts 変更が型に正しく伝わった** っちゅうことや。

#### 5-5. テストが済んだら戻す

`$casts` の `quantity` を `'integer'` に戻して、もう一度 commit する:

```php
protected $casts = [
    'quantity' => 'integer',     // ← 元に戻す
    'purchased' => 'boolean',
    'priority' => 'integer',
];
```

```bash
git add app/Models/Item.php
git commit -m "test: cast を元に戻してフック動作再確認"
```

これで `api.d.ts` も `quantity: number` に戻る。**フックが今回も走った** ことが分かるし、**元の状態に戻った** ことも確認できる。

#### 5-6. 「動かなかった」場合のチェックリスト

- ホストに Node.js が入っとるか？ → `node -v` で確認
- `npx husky init` でちゃんと `.husky/pre-commit` が作られとるか？
- `pre-commit` の中身が **`npx lint-staged`**（sail なし）になっとるか？
- `package.json` の `lint-staged` キーが正しい階層に書かれとるか？
- Sail（Docker コンテナ）は起動しとるか？ → `./vendor/bin/sail ps` で確認
- Vite の dev server は起動しとるか？ → `http://laravel.test/docs/api.json` が取得できる必要
- 「`Current directory is not a git directory!`」っちゅうエラーが出たら、**ホストで実行されてない**（sail 経由で呼んでもうとる）可能性が高い

---

## 🔁 Before / After 比較

| 場面 | Before（タスク3完了時）| After（タスク4完了時）|
|---|---|---|
| バックエンドを変更して commit するとき | `sail npm run generate:types` を **手で叩く必要あり**、忘れたら型がズレる | **何もせんでええ**、commit が自動で走らせてくれる |
| 型のズレ | 起こりうる（人間が忘れる）| **構造的に起こらん**（仕組みが防ぐ）|
| チームで運用 | 「型再生成しといて」っちゅう注意喚起が必要 | **README にも書かんでええ**、git に組み込まれてる |

> 💀 ワシの教え子のフォードくんが組立ラインで「**ヒューマンエラーは "人を責める" んやのうて "仕組みで防ぐ"**」を実証したやろ？お前が今やったのも同じや。**「気を付けます」じゃなく「仕組みが勝手にやる」** を選ぶのが熟練エンジニアの態度や。

---

## ✅ 完了基準

- [ ] `package.json` の `devDependencies` に `husky` と `lint-staged` が入っとる
- [ ] `.husky/pre-commit` が存在し、`./vendor/bin/sail npx lint-staged` の1行が書かれとる
- [ ] `package.json` に `lint-staged` キーがあり、`app/**/*.php` 変更時に `generate:types` を走らせる設定が入っとる
- [ ] `app/` 配下の PHP ファイルを変更 → `git commit` → **自動で `generate:types` が走り** `api.d.ts` が更新される
- [ ] `app/` 配下以外（例: resources の Blade ファイル）の変更だけの commit では `generate:types` は走らない
- [ ] ウォーミングアップで仕込んだ `$appends` などの実験コードは元に戻してある

全部チェックついたか？お前、**「コマンド実行の権利」を仕組みに譲り渡した** で。

---

## 💡 完了したら

```bash
git add .
git commit -m "task-4: Husky + lint-staged で型再生成を自動化"
git push origin okumura/task-4   # ← 自分の作業ブランチ名やで
```

GitHub でリポジトリの `task-4` ブランチに向けて Pull Request を作成してや。

- **base**: `task-4`
- **compare（head）**: `<名前>/task-4`（例: `okumura/task-4`）

⚠️ **PR はマージしないでな**。`task-4` ブランチは次の受講生のスタート地点として綺麗に保つためや。

次のタスクへ進むには `docs/task-5.md` を読んでや（冒頭にスタート手順があるで）。

### もし push や PR がうまくいかなかったら？

焦らんでええ。次の `task-5` ブランチには **タスク4が完了した状態のコード** が最初から入っとる。やから、今の変更を全部捨てて `task-5` ブランチに切り替えれば、そこからタスク5を始められるで。

手順:

1. **Cursor の左サイドバー → ソース管理（Git アイコン）** を開く
2. 変更されたファイルの一覧が出るから、**「変更を破棄」**（↩️ アイコン）で全ての変更を元に戻す
3. ターミナルで以下を実行:

   ```bash
   git fetch origin
   git checkout -b <名前>/task-5 origin/task-5    # 例: miyata/task-5
   ```

これでタスク5の開始地点に立てる。push できんかったことは気にせんでええ、**学びはお前の手に残っとる** からな。

---

次の **タスク5** はここまでで作ってきた **型安全な世界の上で、初めて「失敗」を扱う** で。API が落ちたら、ネットが切れたら、ユーザーにどう伝える？「エラーハンドリング」っちゅう、フロントエンドの **影の主役** を学んでいくで。

ほな、また会おか。お供えのあんみつは引き続き受付中やからな🍨。
