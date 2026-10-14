# 定点観測 — 街の変化をたどる

GitHub Pages用の静的サイトです。ビルド・npm・外部ライブラリは不要です。

## アップロードするもの

ZIPを解凍し、`fixed-point-viewer` フォルダの **中身** をリポジトリの公開対象フォルダへアップロードしてください。
既存サイトを置き換える場合、`index.html`、`styles.css`、`app.js`、`data.js` を置き換えます。

```text
index.html
styles.css
app.js
data.js
README.md
assets/
  photos/
    After20261014_Mitsui_20250804.jpg
    After20261014_Mitsui_20251007.jpg
    After20261014_Mitsui_20251203.jpg
    After20261014_Mitsui_20260210.jpg
    After20261014_Mitsui_20260408.jpg
    After20261014_Mitsui_20260609.jpg
    After20261014_Mitsui_20260818.jpg
    After20261014_Mitsui_20261014.jpg
```

**実際の写真はZIPに含まれていません。** 上記8枚を `assets/photos/` に入れてください。スクショから読み取ったファイル名を使用しています。古いREADMEの接頭辞と4月の日付は使用していません。大文字小文字や拡張子も一致させてください。
写真がない場合は撮影日と不足ファイル名が表示されます。仮画像はブラウザ内で生成し、外部へ通信しません。

## 操作

- 基準日・比較日：それぞれの日付選択欄で変更します。
- 下の写真一覧：「比較日を選ぶ」「基準日を選ぶ」で選択先を指定してタップします。
- スライド：左が基準、右が比較。境界か下のスライダーを動かします。境界にキーボードのフォーカスを置くと左右キー／Home／Endでも操作できます。
- 重ねる：スライダー左端は基準、右端は比較。中間は透明度を変えて重ねます。
- 差分：画素の色の差を表示。同じ色は暗くなります。明るさ・天候・構図のずれも差に含まれ、建物だけを検出する機能ではありません。
- 拡大：＋／−、画像内のピンチ、Ctrl/Cmd＋ホイール。拡大中はドラッグで移動。倍率表示でリセット。
- スマホの画像エリアは写真操作用です。ページをスクロールするときは画像以外の領域をスワイプしてください。
- 自動再生：現在の比較日から撮影順に一枚ずつ再生し、最後まで行くと最初に戻ります。フェード／通常切替、2／4／6秒を選べます。間隔変更は次の待機から反映します。停止すると基準日と現在の比較日に戻ります。
- 自動再生中に日付・比較方法を変更すると再生を停止します。タブを離れた場合も停止します。
- 端末の「動きを減らす」設定が有効な場合、フェードを通常切替にします。
- 全画面：標準APIが使えない端末では、画面いっぱいの表示に切り替えます。

## タイトル・写真の追加

`data.js` の `title` と `photos` を変更します。撮影日順に自動整列します。

```js
{ date: "2026-12-01", file: "After20261201_Mitsui_20261201.jpg" }
```

写真本体も `assets/photos/` に追加してください。日付は `YYYY-MM-DD` にします。

## スマホ向けに通信量を減らす

表示画像は必要な2枚を読み込み、自動再生時に次の1枚を先読みします。ただし写真一覧は原画像を使うため、そのままでは一覧の読み込みも大きくなります。
長辺400〜600pxのサムネイルを別途用意し、各項目に `thumb` を指定すると一覧を軽量化できます。

```js
{ date: "2026-10-14", file: "After20261014_Mitsui_20261014.jpg", thumb: "assets/thumbs/20261014.jpg" }
```

写真本体もWeb用に書き出すと効果的です。全画像の縦横比を揃え、長辺2000〜2600px程度を初期目安に、細部とファイルサイズを見て調整してください（制作上の提案であり、固定の規格ではありません）。
サイズ別画像がある場合は任意で `srcset` を指定できます。

```js
{ date: "2026-10-14", file: "After20261014_Mitsui_20261014.jpg", srcset: "assets/photos/20261014-small.jpg 1200w, assets/photos/20261014-large.jpg 2400w" }
```

自動位置合わせや画像圧縮は行いません。構図は写真側で揃えてください。

## 確認・公開

ローカルではこのフォルダで `python -m http.server 8000` を実行し、`http://localhost:8000` を開きます。
GitHub Pagesの既存設定を利用する場合は、設定で指定されたブランチ／フォルダへ配置してください。
新規の場合はGitHubの Settings → Pages → Deploy from a branch で対象ブランチとフォルダを設定します。

## 検証範囲

JavaScript構文、HTMLと参照IDの整合、模擬DOMでの日付選択・表示切替・読み込み失敗・自動再生停止を確認しました。
実写真は未提供のため、写真を使った画質・位置合わせ・通信速度の確認は未実施です。実機のSafari／Chromeでのタッチ操作と全画面表示も未検証です。

## 技術資料

- MDN Pointer events: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events
- MDN prefers-reduced-motion: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion
- GitHub Pages 公開元設定: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

ファイル名・撮影日は利用者提供のスクリーンショットを出典としています。
