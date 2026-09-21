# タスク5: バラバラのエラー処理を、1つのルールへ

## 🎯 このタスクのゴール

おかえり、ワシや、ガネーシャや🐘。タスク4お疲れさん、よう頑張ったな。今日もあんみつ片手に待っとったで🍨。

### 前回までのおさらい（ガネーシャ × お前）

🙋 「先生！task-4 で Husky と lint-staged を入れて、`pre-commit` フックで `generate:types` が自動で走るようにできました！もうバックエンド変更後の型更新忘れとはおさらばです！」

🐘 「おお、もう型まわりはお前の手から完全に離れたな。task-1 から task-4 まで、**"型" と "バックエンドとの整合性"** っちゅう一本の道を歩いてきた成果や」

🙋 「型安全な世界、最高ですね…！」

🐘 「ええ気分やろ。…ところでお前、その型安全な世界で、**API が失敗したとき** のコードは見たことあるか？」

🙋 「えっ、エラー処理ですか？まあ、`try-catch` 書いてあるやつですよね…」

🐘 「現在の `task-5` ブランチ、`resources/js/views/ItemListView.vue` を開いてみい。`loadItems`、`addItem`、`removeItem`、`loadItem` の4つ、それぞれどんなエラー処理になっとる？」

🙋 「（開く）……えっ。`loadItems` は `alert`、`addItem` は赤バナー、`removeItem` は `console.log` だけ、`loadItem` は `confirm` で再試行確認…**全部バラバラ** です！」

🐘 「そや。**複数人で書いたらこうなる。一人で書いてても、ルールが無かったらこうなる**。型は機械が守ってくれたけど、**UX はまだ人間任せ** や」

🙋 「ユーザーから見たら、操作によって失敗の見え方が違うって…めっちゃ不親切ですね」

🐘 「これがな、**仕様書には載ってない UX 負債** っちゅうやつや。今日はこれを **1箇所のルール** に統一していくで。型のときと同じや、**散らばってる責務を1点に集める** のがポイントや」

> 🔄 **ここから話題が切り替わるで、心の準備しいや。**
> タスク1〜4 はずっと **「型」と「バックエンドとの整合性」** の話やった。手書きで型を当てる → 自動生成に切り替える → カラム追加で型が貫通する → 自動再生成を仕掛ける、っちゅう一本のストーリーや。
> タスク5 は **「失敗時のユーザー体験」** に軸が移る。今まで作ってきた型安全な世界の上で、**「API が失敗したらどうする？」「ユーザーにどう伝える？」** っちゅう違う角度の話に踏み込んでいくで。

### 今日やること

実はもうな、現在の `task-5` ブランチ には **わざと「バラバラのエラー処理」** が仕込んである。複数の開発者が思い思いに try-catch を書いていった、っちゅう想定の **荒れたコード** や。**4つの操作で4種類の違う見た目** になっとる。これを「**1箇所のルール**」に統一していくのが今日の仕事や。

> 💡 実務でもよくある光景や。複数人が機能を作ったり、一人で書いてても明確なルールがなかったりすると、エラー処理だけバラバラに育つ。
> 仕様書には載ってない「UX の統一感」っちゅう負債が貯まっていく。これを **設計で解消する** のがプロのエンジニアや。

---

## 🌿 まず作業ブランチを切る

タスク1〜4と同じリズム。

```bash
git fetch origin                                  # リモートの最新情報を取得
git checkout -b okumura/task-5 origin/task-5       # ← 自分の名前に置き換えるんやで
```

> 💡 `task-5` ブランチは **タスク4を完了した状態 + 意図的に仕込まれたバラバラなエラー処理** がスタート地点や。

ブランチを切り替えたら、DB をリセットしておくで。前のタスクの実験で DB が汚れとる可能性があるからな:

```bash
sail artisan migrate:fresh --seed
```

ブラウザで `http://localhost:8081` を開いて、買い物リストが正常に表示されることを確認してから次に進んでや。

---

## 👀 何が起きとるか（バラバラの現状）

`task-5` ブランチ には、4つの API 呼び出しメソッドそれぞれに **わざと不統一なエラー処理** が入っとる:

| 操作 | 仕込まれてる書き方 | UX 上の問題 |
|---|---|---|
| 一覧の読み込み（`loadItems`）| `alert('読み込みに失敗しました')` | ブロッキングモーダル、古臭い |
| アイテム追加（`addItem`）| `addError` ref + 追加フォーム上部の赤バナー | 比較的丁寧、でも他と統一感なし |
| アイテム削除（`removeItem`）| `console.log` のみ | **完全に沈黙**、ユーザーに何も伝わらん |
| 詳細ページ遷移（`loadItem`）| `confirm('再試行しますか？')` | 質問ダイアログ、UX が変 |

実際にコードを開いてみい:

```ts
// resources/js/views/ItemListView.vue
async function loadItems() {
  try {
    const response = await listItems()
    items.value = response.data
  } catch (e) {
    alert('読み込みに失敗しました')                       // ← パターン1
  }
}

async function addItem() {
  if (!newName.value) return
  addError.value = null
  try {
    await createItem({ /* ... */ })
    /* ... */
  } catch (e) {
    addError.value = 'アイテムの追加に失敗しました'         // ← パターン2
  }
}

async function removeItem(item: Item) {
  if (!confirm(`「${item.product_name}」を削除しますか？`)) return
  try {
    await deleteItem(item.id)
    await loadItems()
  } catch (e) {
    console.log('削除失敗', e)                            // ← パターン3
  }
}
```

```ts
// resources/js/views/ItemDetailView.vue
async function loadItem() {
  try {
    const response = await getItem(Number(route.params.id))
    item.value = response.data
  } catch (e) {
    if (confirm('読み込みに失敗しました。再試行しますか？')) {  // ← パターン4
      loadItem()
    }
  }
}
```

「**全部書き方ちゃう、誰がこんなコード書いたんや**」って思うやろ？これがタスク4 の出発点や。

---

## 🔥 ウォーミングアップ: バラバラを体感する

実装に入る前に、4種類のバラバラ振りを **自分の目で確認** してみよ。

エラーを意図的に発火させる方法はいくつかあるけど、ここでは **「`items.ts` の API URL を一時的に壊す」** っちゅう方法を使う。`/items` を `/items-broken` みたいな存在しないパスに書き換えると、サーバーが 404 を返して、その関数を呼ぶ操作が必ず失敗する。**Vite HMR が自動でリロード** してくれるんで、ファイル保存だけで反映される。

### 試し方の基本

`resources/js/api/items.ts` を開くと、4つの関数がある:

```ts
export function listItems() { return apiClient.get<Item[]>('/items') }
export function getItem(id: number) { return apiClient.get<Item>(`/items/${id}`) }
export function createItem(data: ...) { return apiClient.post<Item>('/items', data) }
export function deleteItem(id: number) { return apiClient.delete(`/items/${id}`) }
```

これらの URL を `/items` から `/items-broken` に書き換える → 保存 → 該当操作を試す → 終わったら **必ず `/items` に戻す**。これを4パターン分繰り返す。
> 一気に全部書き換えるんやないで！ひとつずつやで！

### ① 追加（赤バナー）

`createItem` の URL を書き換え:

```ts
export function createItem(data: { product_name: string; quantity: number; priority: number }) {
  return apiClient.post<Item>('/items-broken', data)   // ← 一時的に
}
```

保存 → フォームに名前入れて **「追加」ボタン** → **追加フォームの上部に赤バナー** が出る:「⚠️ アイテムの追加に失敗しました」

確認できたら `/items` に戻す。

### ② 削除（沈黙）

```ts
export function deleteItem(id: number) {
  return apiClient.delete(`/items-broken/${id}`)   // ← 一時的に
}
```

保存 → アイテムの **「削除」ボタン** → 確認OK → **何も画面に出ない**。DevTools の Console タブだけ `削除失敗 ...` っちゅう log が出てる。

確認できたら `/items` に戻す。

### ③ 詳細遷移（confirm ダイアログ）

```ts
export function getItem(id: number) {
  return apiClient.get<Item>(`/items-broken/${id}`)   // ← 一時的に
}
```

保存 → 一覧で **アイテム名をクリック** → 詳細ページに遷移 → **ブラウザの confirm ダイアログ**「読み込みに失敗しました。再試行しますか？」が出る。

確認できたら `/items` に戻す。

### ④ 一覧読み込み（alert ダイアログ）

```ts
export function listItems() {
  return apiClient.get<Item[]>('/items-broken')   // ← 一時的に
}
```

保存 → Vite HMR でリロードがかかる or 「← リストに戻る」で一覧へ遷移 → **ブラウザの alert ダイアログ**「読み込みに失敗しました」が出る。

確認できたら `/items` に戻す。

---

各操作で **全く違う見た目** が出るのを実感したやろ？追加は赤バナー、削除は無音、詳細は質問ダイアログ、一覧はアラート…。

### 何を感じたか

- **ユーザー目線**: 「このアプリ、エラー表示見にくいなあ」「削除で何も起きへんかったけど本当に失敗したん？」
- **開発者目線**: 「**3 ファイル開いて 4 箇所** を直さなアカン」「明日エラー表示の見た目を変えたくなったらどうする？4箇所触るんか？」

> 💀 ワシの教え子のヒポクラテスくんが医学書に書いた言葉に **「Auctor sui doloris（自分の痛みの作者）」** っちゅうのがある。医者自身が混乱の原因になったらアカン、っちゅう戒めや。お前らエンジニアも一緒で、**ユーザーに「混乱」っちゅう痛みを与えへん責任** がある。バラバラのエラー処理は、その責任を果たせてへん状態や。

### 戻し忘れチェック

実装手順に進む前に、`items.ts` の4つの関数すべてが **`/items` ベース** に戻ってることを確認:

```ts
listItems  → apiClient.get<Item[]>('/items')
getItem    → apiClient.get<Item>(`/items/${id}`)
createItem → apiClient.post<Item>('/items', data)
deleteItem → apiClient.delete(`/items/${id}`)
```

1つでも `/items-broken` のまま残っとると、後続の作業中に変な挙動になるで。リロードして通常通りリストが表示されることもあわせて確認や。

---

## ✏️ 実装手順

ここから「バラバラを1つのルールに統一する」作業に入る。**新規ファイル1つ + 既存ファイル3つの修正** で済む、コンパクトな仕事や。

### Step 1: 共通の「エラーメッセージ抽出関数」を作る

新規ファイル `resources/js/utils/handleError.ts` を作成や。**`utils/` ディレクトリも新規作成** やで（既存にはない）:

```
resources/
└── js/
    ├── api/
    │   ├── client.ts              # Step 2 で interceptor を追加
    │   └── items.ts
    ├── router/
    ├── types/
    ├── utils/                     ← ★ ディレクトリを新規作成
    │   └── handleError.ts         ← ★ このファイルを新規作成
    ├── views/
    │   ├── ItemListView.vue       # Step 3 で catch を統一
    │   └── ItemDetailView.vue     # Step 4 で catch を統一
    ├── App.vue
    └── app.ts
```

まずディレクトリとファイルを作るで:

```bash
mkdir resources/js/utils
touch resources/js/utils/handleError.ts
```

ファイルの中身はこれや:

```ts
import { AxiosError } from 'axios'

/**
 * 例外オブジェクトと「何の操作」かを受け取って、ユーザー向けメッセージを返す純粋関数。
 * 「何が失敗したか」は呼び出し側が action として渡し、「なぜ失敗したか」は中で判断する。
 */
export function handleError(e: unknown, action: string): string {
  const reason = (() => {
    if (e instanceof AxiosError) {
      // ネットワーク失敗（response 自体が無い）
      if (!e.response) return 'ネットワーク接続を確認してください'
      // サーバーエラー (5xx)
      if (e.response.status >= 500) return 'サーバーでエラーが発生しました'
      // 4xx 系の汎用
      if (e.response.status >= 400) return 'リクエストに問題があります'
    }
    // axios 以外の予期せぬエラー
    return '予期しないエラーが発生しました'
  })()

  return `${action}に失敗しました（${reason}）`
}
```

これな、**「エラーオブジェクトと操作名を渡したら、適切な日本語メッセージを返してくれる」** 純粋関数や。

**役割の分担:**
- **「何の操作が失敗したか」** は呼び出し側（画面）が知ってる → `action` 引数で渡す
- **「なぜ失敗したか（エラーの種別）」** は handleError が判断 → status code から決める
- 最終的に `${action}に失敗しました（${reason}）` の形に組み立てて返す

例:
- `handleError(e, 'アイテムの追加')` → `「アイテムの追加に失敗しました（リクエストに問題があります）」`
- `handleError(e, 'アイテムの削除')` → `「アイテムの削除に失敗しました（リクエストに問題があります）」`

**「何が」は画面側、「なぜ」は handleError 側** っちゅう分担になっとる。同じ status code でも、操作ごとに分かりやすいメッセージを出せる。

ポイント:
- **`console.error()` などの副作用は持たない** → 純粋関数（input → output だけ）
- **戻り値は string** → 呼び出し側はそれを `error.value` に入れるだけ
- ログは別途 **interceptor が一括で担当する**（次の Step 2 で作る）

> 💡 これな、**「責任の分離」** の典型例や。**メッセージを決める責任** はここに集約。各 view ファイルは「`handleError(e, '操作名')` を呼ぶだけ」に専念できる。
> ワシの教え子のアダム・スミスくんも「分業こそが効率を生む」言うてたな。コードも一緒や。

### Step 2: axios interceptor で API 全体に横串を刺す

`resources/js/api/client.ts` を編集して **interceptor**（横断的なフック）を追加。既存の `headers` 設定は **そのまま残す** で:

```ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },   // ← ここまでは既存のまま
})

// ↓ ここから追加: 全 API 呼び出しに横断的にエラーログを残す
apiClient.interceptors.response.use(
  (response) => response,                    // 成功時はそのまま通す
  (error) => {
    // 失敗時のみ実行される
    console.error(
      '[API error]',
      error?.config?.method?.toUpperCase(),
      error?.config?.url,
      error?.response?.status ?? 'no-response'
    )
    // 例外を握り潰さない → 各 catch にも届く
    return Promise.reject(error)
  }
)

export default apiClient
```

interceptor は、**全 API 呼び出しの "戻り" に共通の処理を仕込む** 仕組みや。今回入れたのは:
- API 呼び出しが **失敗した瞬間に、エラー詳細を統一フォーマットでログ**（メソッド、URL、ステータスコード）
- 例外は `Promise.reject(error)` で **そのまま伝播** → 各画面の `catch` ブロックは今まで通り動く

### handleError と interceptor の役割の違い

ここ大事や、混同しがちやから整理しとくで:

| | handleError | interceptor |
|---|---|---|
| 何をする？ | エラーから **ユーザー向けメッセージ** を取り出す | 全 API 呼び出しに **横断的な処理（ログ等）** を仕込む |
| いつ呼ばれる？ | 各画面の `catch` ブロックの中（**書き忘れたら通らん**）| API 失敗時に **必ず自動で** 通る |
| 副作用 | **なし**（純粋関数、文字列を返すだけ）| **あり**（`console.error` でログを出す）|
| 役割の比喩 | **診察**（エラーをユーザーに分かる言葉に翻訳する医者）| **受付**（来院者は全員カルテに記録、誰も見落とさん）|
| 典型用途 | バナー表示用のメッセージ生成 | ログ送信、Sentry 通知、認証トークン自動付与 |

ログを **interceptor 側だけに集約** することで:
- **保険として機能する**: 誰かが catch を書き忘れても、API 失敗のログだけは残る
- **handleError は純粋関数になる**: テスト書きやすく、副作用も予測しやすい
- **役割分担が明確**: 「ログは interceptor、表示文字列は handleError」と頭の中で分けやすい

> 💡 「両方で console.error 呼んだら冗長やん？」って気付いたお前、設計感覚がええで。実際そうや。`console.error` は出力先が同じ DevTools Console やから、**2回呼ぶ意味はない**。せやから handleError は純粋関数にして、ログ責任は interceptor に一本化したんや。
> ワシの教え子のアダム・スミスくんも「**分業こそが効率を生む**」言うてたな。コードも同じや、責任を分けると見通しが立つ。

### Step 3: ItemListView を統一する

`resources/js/views/ItemListView.vue` を大手術や。**3つの catch ブロックすべてを同じ書き方に揃える**。

#### 3-1. script を書き換え

```ts
import { ref, onMounted } from 'vue'
import { listItems, createItem, deleteItem } from '../api/items'
import { handleError } from '../utils/handleError'   // ← 追加
import type { Item } from '../types/item'

const items = ref<Item[]>([])
const newName = ref<string>('')
const newQuantity = ref<number>(1)
const newPriority = ref<number>(3)
const error = ref<string | null>(null)                // ← addError から名前変更、共通化

async function loadItems() {
  error.value = null
  try {
    const response = await listItems()
    items.value = response.data
  } catch (e) {
    error.value = handleError(e, 'アイテムの読み込み')   // ← alert を置き換え
  }
}

async function addItem() {
  if (!newName.value) return
  error.value = null                                   // ← addError からerrorに名前変更
  try {
    await createItem({
      product_name: newName.value,
      quantity: newQuantity.value,
      priority: newPriority.value,
    })
    newName.value = ''
    newQuantity.value = 1
    newPriority.value = 3
    await loadItems()
  } catch (e) {
    error.value = handleError(e, 'アイテムの追加')       // ← addError 直接代入から置き換え
  }
}

async function removeItem(item: Item) {
  if (!confirm(`「${item.product_name}」を削除しますか？`)) return
  error.value = null
  try {
    await deleteItem(item.id)
    await loadItems()
  } catch (e) {
    error.value = handleError(e, 'アイテムの削除')       // ← console.log から置き換え
  }
}

onMounted(loadItems)
```

**全 catch ブロックが `error.value = handleError(e, '操作名')` の1行に統一された** やろ。操作名だけが catch ごとに違うけど、構造は同じ。これがゴールや。

#### 3-2. テンプレートを書き換え

旧 `addError` 用バナー（追加フォーム上部のやつ）を削除し、ページ最上部に **統一エラーバナー** を1個置く:

```vue
<template>
  <div class="space-y-6">
    <!-- 統一エラーバナー（追加）-->
    <div
      v-if="error"
      class="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl"
    >
      ⚠️ {{ error }}
    </div>

    <section class="bg-white rounded-2xl shadow-sm border border-pink-100 p-5">
      <h2 class="text-lg font-semibold mb-3 text-pink-700">
        アイテムを追加
      </h2>
      <!-- ↓ addError 用のバナー（旧）は削除 -->
      <form @submit.prevent="addItem" class="flex gap-2">
        <!-- 既存のフォーム入力 -->
      </form>
    </section>

    <!-- 残りのリスト表示部分は変更なし -->
  </div>
</template>
```

- **`addError` 用のバナー**（追加フォーム上部のやつ）は **削除**
- **`error` 用のバナー** をページ最上部に1個だけ置く
- すべての操作のエラーがここに出る

### Step 4: ItemDetailView も統一

`resources/js/views/ItemDetailView.vue` も同じパターン:

#### 4-1. script

```ts
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getItem, deleteItem } from '../api/items'
import { handleError } from '../utils/handleError'   // ← 追加
import type { Item } from '../types/item'

const route = useRoute()
const router = useRouter()
const item = ref<Item | null>(null)
const error = ref<string | null>(null)                // ← 追加

async function loadItem() {
  error.value = null
  try {
    const response = await getItem(Number(route.params.id))
    item.value = response.data
  } catch (e) {
    error.value = handleError(e, 'アイテムの詳細取得')   // ← confirm から置き換え
  }
}

async function remove() {
  if (!item.value) return
  if (!confirm(`「${item.value.product_name}」を削除しますか？`)) return
  await deleteItem(item.value.id)
  router.push('/')
}

onMounted(loadItem)
```

`confirm('再試行しますか？')` の挙動は削除。**catch は `handleError(e, 'アイテムの詳細取得')` 1行** に統一。

#### 4-2. テンプレート

```vue
<template>
  <!-- エラーバナー（追加）-->
  <div
    v-if="error"
    class="mb-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl"
  >
    ⚠️ {{ error }}
  </div>

  <div v-if="item" class="space-y-4">
    <!-- 既存の詳細表示 -->
  </div>
  <p v-else class="p-5 text-pink-300 text-center">読み込み中…</p>
</template>
```

### Step 5: 動作確認

ウォーミングアップと同じ **「URL を broken にする」方式** で4操作を試す。今度は **操作ごとに違うけど構造が揃ったメッセージ** が出るはずや。一気に全部壊さんと、**1個ずつ壊して、戻して、次** や（ウォーミングアップと同じリズム）。

#### 5-1. 各操作を一つずつ試す

##### ① 一覧読み込み（loadItems）

`listItems` を `/items-broken` に書き換え → 保存 → 「← リストに戻る」で再マウント、または詳細ページから戻る

**期待**: ページ上部の赤バナー：`⚠️ アイテムの読み込みに失敗しました（リクエストに問題があります）`

確認後 `/items` に戻す。

##### ② 追加（addItem）

`createItem` を `/items-broken` に → 保存 → 名前入れて「追加」

**期待**: ページ上部の赤バナー：`⚠️ アイテムの追加に失敗しました（リクエストに問題があります）`

確認後 `/items` に戻す。

##### ③ 削除（removeItem）

`deleteItem` を `/items-broken/${id}` に → 保存 → 「削除」ボタン → 確認OK

**期待**: ページ上部の赤バナー：`⚠️ アイテムの削除に失敗しました（リクエストに問題があります）`

確認後 `/items` に戻す。

##### ④ 詳細取得（loadItem）

`getItem` を `/items-broken/${id}` に → 保存 → アイテム名クリック → 詳細ページへ遷移

**期待**: 詳細ページ上部の赤バナー：`⚠️ アイテムの詳細取得に失敗しました（リクエストに問題があります）`

確認後 `/items` に戻す。

#### 5-2. 4つのメッセージを並べて比較

| 操作 | 表示されるメッセージ |
|---|---|
| 一覧読み込み | `アイテムの読み込みに失敗しました（リクエストに問題があります）` |
| 追加 | `アイテムの追加に失敗しました（リクエストに問題があります）` |
| 削除 | `アイテムの削除に失敗しました（リクエストに問題があります）` |
| 詳細取得 | `アイテムの詳細取得に失敗しました（リクエストに問題があります）` |

**「何が失敗したか」** は各操作で違う（前半が違う）、**「なぜ失敗したか」**（カッコ内）は同じ。これが handleError の出し分けや。バナーの UI は1種類、でも操作の文脈は明確 — 「**統一されたルール × 操作ごとの個性**」の両立や。

> 💡 もし通信状態が悪くてネットワーク失敗したら？ `(ネットワーク接続を確認してください)` に変わる。サーバーが落ちて 500 返したら？ `(サーバーでエラーが発生しました)` に変わる。**前半（操作名）は呼び出し側、後半（理由）は handleError** で決まる、っちゅう分担や。

#### 5-3. interceptor のログも確認

DevTools の Console タブで `[API error] POST /api/items-broken 404` みたいな統一ログが各操作分出てるはず。**横串の証拠** や。

#### 5-4. 戻し忘れチェック

`items.ts` の4つの関数すべてが **`/items` ベース** に戻ってることを確認:

```ts
listItems  → apiClient.get<Item[]>('/items')
getItem    → apiClient.get<Item>(`/items/${id}`)
createItem → apiClient.post<Item>('/items', data)
deleteItem → apiClient.delete(`/items/${id}`)
```

リロード → 通常通り動く。追加 / 削除 / 詳細遷移 / 戻る、全部 OK なら成功や。

#### 5-5. 型チェック

```bash
sail npx vue-tsc --noEmit
```

型エラーが出ないことも確認。

---

## 🔁 Before / After 比較

| | Before（バラバラ）| After（統一）|
|---|---|---|
| エラー時の出し方 | 4種類（alert / バナー / 沈黙 / confirm）| **1種類（赤バナー）** |
| エラーメッセージの出元 | 4箇所、各 catch にハードコード | **`handleError(e, '操作名')` で集約**（理由は handleError、操作名は呼び出し側）|
| ログ出力 | バラバラ（`console.log` だけ、もしくは無し）| **interceptor で統一ログ** |
| 「明日エラー表示の見た目を変えたい」 | 4箇所修正 | **1箇所修正**（テンプレート or handleError）|
| 「Sentry にも送りたくなった」 | 4箇所追加 | **interceptor に1行追加** |
| 各 catch の中身 | バラバラ | `error.value = handleError(e, '操作名')` のみ |

各 catch ブロックは:

```ts
} catch (e) {
  error.value = handleError(e, 'アイテムの〇〇')   // ← これ1行で全部解決
}
```

**処理内容を画面が決めるんやのうて、handleError と interceptor の "外" が決める**。「**何が失敗したか**」だけ画面が伝える、「**なぜ失敗したか**」は handleError が判断する、「**全 API のログ**」は interceptor が残す。これが「**横断的関心事の分離**」っちゅう設計原則や。

> 💀 ワシの教え子のフォードくんがな、自動車の組立ラインを発明したやろ？「各人がバラバラに車を組み立てる」やのうて「**各工程の役割を分けて、全車に同じ手順を適用する**」っちゅう設計革命や。お前が今やったのも同じや。**画面ごとに違うエラー処理 → 共通の手順で全画面に同じエラー処理を流す**。フロントエンドの組立ラインを引いたんや。

---

## ✅ 完了基準

- [ ] `resources/js/utils/handleError.ts` を作成、`action` 引数で操作名を受け取り `〇〇に失敗しました（理由）` を返す純粋関数になっている
- [ ] `resources/js/api/client.ts` に interceptor を追加、API エラーの統一ログが出る
- [ ] `ItemListView.vue` の3つの catch がすべて `error.value = handleError(e, 'アイテムの〇〇')` に統一されている
- [ ] `ItemListView.vue` から `addError` ref と追加フォーム内バナーが削除されている
- [ ] `ItemDetailView.vue` も `handleError(e, 'アイテムの詳細取得')` で統一されている
- [ ] `items.ts` の URL を一つずつ `/items-broken` に書き換えて、4操作とも **同じ赤バナー UI で操作ごとに違うメッセージ** が出る
- [ ] DevTools Console に interceptor からの `[API error]` ログが出ている
- [ ] `items.ts` を `/items` に戻したら今まで通り動く
- [ ] `sail npx vue-tsc --noEmit` がエラーなく通る

全部チェックついたか？バラバラを綺麗に整えたお前、もうフロントエンドの **設計屋** や。

---

## 💡 完了したら

```bash
git add .
git commit -m "task-5: バラバラなエラー処理を handleError + interceptor で統一"
git push origin okumura/task-5   # ← 自分の作業ブランチ名やで
```

GitHub でリポジトリの `main` ブランチに向けて Pull Request を作成してや。

- **base**: `main`
- **compare（head）**: `<名前>/task-5`（例: `okumura/task-5`）

⚠️ **PR はマージしないでな**。`complete` ブランチは「全部完成形」として綺麗に保つためや。

---

## 🎓 5タスク全完了、お疲れさん

タスク1 から5まで、お前が学んだこと:

1. **TypeScript 化**（task-1）: 手書きで型を当てる痛みと、interface の責任
2. **OpenAPI 自動生成**（task-2）: バックエンドを真実として、フロントの型を自動同期する仕組み
3. **カラム追加の貫通**（task-3）: パイプラインの威力、手書き時代との対比
4. **型再生成の自動化**（task-4）: Husky で「コマンド実行忘れ」を仕組みで防ぐ
5. **エラー処理の統一**（task-5）: バラバラな catch を handleError + interceptor で1つのルールに

これな、**実務のフロントエンドアプリで重要な土台はだいたい一周** や。お前はもう、こういう設計を **自分で考えられるエンジニア** に育った。

ワシの教え子の福沢諭吉くんが「**学問のすゝめ**」で言うとった、「**人は学ぶことで自由になる**」っちゅう言葉、今のお前にぴったりや。型に縛られへん、忘れた頃に壊れへん、エラーに恐れへん、設計に迷わへん…そんな自由を手に入れたんやで。

ほな、また会おか。お供えのあんみつは、いつでも歓迎やで🍨。
